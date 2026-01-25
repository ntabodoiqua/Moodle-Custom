// src/store/examStore.ts
import { create } from "zustand";
import type {
  ExamData,
  SkillType,
  UserAnswers,
  WritingSubmissions,
  SpeakingSubmissions,
  MoodleConfig,
} from "../types";
import {
  fetchExamById,
  submitExamResult,
  initializeApi,
  uploadAudioFile,
  type DetailedResults,
} from "../services/ieltsApi";

// Grading info from teacher
interface GradingInfo {
  writing_band: number | null;
  speaking_band: number | null;
  writing_feedback: string | null;
  speaking_feedback: string | null;
  graded_by: number | null;
  timegraded: number | null;
}

interface AttemptData {
  band: number;
  answers: UserAnswers;
  scoring?: {
    reading?: { correct: number; total: number; band: number };
    listening?: { correct: number; total: number; band: number };
    writing?: { submitted: boolean };
    speaking?: { submitted: boolean };
  };
  questionResults?: Array<{
    id: number;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }>;
  writingEssays?: WritingSubmissions;
  speakingAudio?: Record<number, string>; // URLs instead of Blobs for review
  timeTaken?: number;
  completedAt?: string;
  grading?: GradingInfo | null; // Teacher graded scores
}

interface ExamState {
  // Dữ liệu đề thi
  examData: ExamData | null;
  currentSkill: SkillType;
  currentExamId: number | null; // Track loaded exam ID

  // Trạng thái làm bài
  timeLeft: number; // Thời gian còn lại (giây) - computed from endTime
  endTime: number | null; // Timestamp khi hết giờ (ms) - source of truth for timer
  startTime: number | null; // Timestamp khi bắt đầu làm bài (ms)
  timeTaken: number | null; // Thời gian đã làm bài (giây) - set khi submit
  isLoading: boolean; // Loading state for async operations
  error: string | null; // Error message if any
  isApiInitialized: boolean; // Track if API has been initialized

  // Review mode
  isReviewMode: boolean; // True when reviewing a past attempt
  reviewBand: number | null; // Band score from the reviewed attempt
  reviewScoring: AttemptData["scoring"] | null; // Scoring data from reviewed attempt
  reviewQuestionResults: AttemptData["questionResults"] | null; // Question results from reviewed attempt

  // Lưu bài làm
  answers: UserAnswers; // Reading & Listening
  writingEssays: WritingSubmissions; // Writing
  speakingAudio: SpeakingSubmissions; // Speaking

  // Actions
  setExamData: (data: ExamData, startSkill?: SkillType) => void;
  setSkill: (skill: SkillType, duration: number) => void; // Chuyển kỹ năng & set lại giờ

  // Update answers
  setAnswer: (qId: number, value: string) => void;
  setEssay: (taskId: number, content: string) => void;
  setRecording: (partId: number, audioBlob: Blob) => void;

  // Timer
  updateTimeLeft: () => void; // Recalculate timeLeft from endTime

  isSubmitted: boolean;
  submitExam: () => void; // Legacy sync action

  // New async actions
  initApi: (config: MoodleConfig) => void;
  loadExam: (id: number, preserveAnswers?: boolean) => Promise<void>;
  submitAssessment: () => Promise<number | null>;

  // Review mode action
  setReviewMode: (isReview: boolean, attemptData?: AttemptData) => void;

  // Grading info getter
  gradingInfo: GradingInfo | null;
}

export const useExamStore = create<ExamState>((set, get) => ({
  examData: null,
  currentSkill: "READING", // Mặc định vào là Reading
  currentExamId: null,
  timeLeft: 0,
  endTime: null,
  startTime: null,
  timeTaken: null,
  isLoading: false,
  error: null,
  isApiInitialized: false,

  // Review mode
  isReviewMode: false,
  reviewBand: null,
  reviewScoring: null,
  reviewQuestionResults: null,
  gradingInfo: null,

  answers: {},
  writingEssays: {},
  speakingAudio: {},

  setExamData: (data, startSkill = "READING") =>
    set({
      examData: data,
      currentSkill: startSkill,
      // Logic: Nếu vào Reading thì set 60 phút, Listening 40p...
      // Ở đây tạm set mặc định, sau này logic chuyển skill sẽ set lại
      timeLeft: 3600,
    }),

  setSkill: (skill, duration) => {
    const state = get();
    const now = Date.now();
    set({
      currentSkill: skill,
      timeLeft: duration,
      endTime: now + duration * 1000, // Set end time based on duration
      // Set startTime only once (first skill)
      startTime: state.startTime ?? now,
    });
  },

  setAnswer: (qId, val) =>
    set((state) => ({
      answers: { ...state.answers, [qId]: val },
    })),

  setEssay: (taskId, content) =>
    set((state) => ({
      writingEssays: { ...state.writingEssays, [taskId]: content },
    })),

  setRecording: (partId, audioBlob) =>
    set((state) => ({
      speakingAudio: { ...state.speakingAudio, [partId]: audioBlob },
    })),

  // Recalculate timeLeft from endTime - accurate even after tab switch
  updateTimeLeft: () =>
    set((state) => {
      if (!state.endTime) return { timeLeft: 0 };
      const remaining = Math.max(
        0,
        Math.floor((state.endTime - Date.now()) / 1000),
      );
      return { timeLeft: remaining };
    }),

  isSubmitted: false,
  submitExam: () => {
    const { startTime } = get();
    const now = Date.now();
    // Calculate time taken in seconds
    const taken = startTime ? Math.floor((now - startTime) / 1000) : null;
    set({ isSubmitted: true, timeTaken: taken });
  },

  // Initialize API with Moodle config
  initApi: (config: MoodleConfig) => {
    initializeApi(config);
    set({ isApiInitialized: true });
  },

  // Load exam data from API
  loadExam: async (id: number, preserveAnswers: boolean = false) => {
    set({ isLoading: true, error: null });

    try {
      const examData = await fetchExamById(id);

      if (examData) {
        const currentState = get();
        // Only reset answers/submission if loading a different exam AND not preserving answers
        const isNewExam = currentState.currentExamId !== id;
        const shouldResetAnswers = isNewExam && !preserveAnswers;
        set({
          examData,
          currentExamId: id,
          isLoading: false,
          error: null,
          // Only reset answers when loading a NEW exam and not in review mode
          ...(shouldResetAnswers
            ? {
                answers: {},
                writingEssays: {},
                speakingAudio: {},
                isSubmitted: false,
              }
            : {}),
        });
      } else {
        set({
          isLoading: false,
          error: "Failed to load exam data",
        });
      }
    } catch (error) {
      console.error("Error loading exam:", error);
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  },

  // Submit assessment to API
  submitAssessment: async () => {
    const { currentExamId, answers, examData, writingEssays, speakingAudio } =
      get();

    if (!currentExamId) {
      console.error("No exam loaded");
      return null;
    }

    if (!examData) {
      console.error("No exam data available");
      return null;
    }

    set({ isLoading: true, error: null });

    try {
      // First, upload any audio files
      const speakingAudioUrls: Record<number, string> = {};
      if (Object.keys(speakingAudio).length > 0) {
        console.log("Uploading audio files...");

        for (const [partId, audioBlob] of Object.entries(speakingAudio)) {
          const partIdNum = parseInt(partId);
          const fileUrl = await uploadAudioFile(
            currentExamId,
            partIdNum,
            audioBlob,
          );

          if (fileUrl) {
            speakingAudioUrls[partIdNum] = fileUrl;
            console.log(`Audio uploaded for part ${partIdNum}:`, fileUrl);
          } else {
            console.error(`Failed to upload audio for part ${partIdNum}`);
            // Continue with submission even if some audio files fail to upload
          }
        }
      }

      // Calculate detailed scoring with question-level results
      const { band, detailedResults } = calculateDetailedScore(
        answers,
        examData,
        writingEssays,
        speakingAudio,
      );

      // Add audio URLs to detailed results
      if (Object.keys(speakingAudioUrls).length > 0) {
        detailedResults.speakingAudio = speakingAudioUrls;
      }

      const attemptId = await submitExamResult(
        currentExamId,
        answers,
        band,
        detailedResults,
      );

      if (attemptId) {
        set({
          isSubmitted: true,
          isLoading: false,
          error: null,
        });
        return attemptId;
      } else {
        set({
          isLoading: false,
          error: "Failed to submit assessment",
        });
        return null;
      }
    } catch (error) {
      console.error("Error submitting assessment:", error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Submission failed",
      });
      return null;
    }
  },

  // Set review mode with attempt data
  setReviewMode: (isReview: boolean, attemptData?: AttemptData) => {
    if (isReview && attemptData) {
      set({
        isReviewMode: true,
        isSubmitted: true, // Mark as submitted to show ResultPage
        reviewBand: attemptData.band,
        reviewScoring: attemptData.scoring || null,
        reviewQuestionResults: attemptData.questionResults || null,
        answers: attemptData.answers || {},
        writingEssays: attemptData.writingEssays || {},
        // Note: attemptData.speakingAudio contains URLs, not Blobs
        // We'll need to handle this differently in ResultPage
        speakingAudio: {}, // Clear local blobs since we have URLs in attemptData
        timeTaken: attemptData.timeTaken || null,
        gradingInfo: attemptData.grading || null,
        // Reset other states
        timeLeft: 0,
        endTime: null,
        isLoading: false,
        error: null,
      });
    } else {
      set({
        isReviewMode: false,
        reviewBand: null,
        reviewScoring: null,
        reviewQuestionResults: null,
        gradingInfo: null,
      });
    }
  },
}));

/**
 * IELTS Official Band Score Conversion
 * Based on official IELTS scoring tables
 */
const convertToReadingBand = (rawScore: number): number => {
  // IELTS Academic Reading: 40 questions
  if (rawScore >= 39) return 9.0;
  if (rawScore >= 37) return 8.5;
  if (rawScore >= 35) return 8.0;
  if (rawScore >= 33) return 7.5;
  if (rawScore >= 30) return 7.0;
  if (rawScore >= 27) return 6.5;
  if (rawScore >= 23) return 6.0;
  if (rawScore >= 19) return 5.5;
  if (rawScore >= 15) return 5.0;
  if (rawScore >= 13) return 4.5;
  if (rawScore >= 10) return 4.0;
  if (rawScore >= 8) return 3.5;
  if (rawScore >= 6) return 3.0;
  if (rawScore >= 4) return 2.5;
  return 2.0;
};

const convertToListeningBand = (rawScore: number): number => {
  // IELTS Listening: 40 questions
  if (rawScore >= 39) return 9.0;
  if (rawScore >= 37) return 8.5;
  if (rawScore >= 35) return 8.0;
  if (rawScore >= 32) return 7.5;
  if (rawScore >= 30) return 7.0;
  if (rawScore >= 26) return 6.5;
  if (rawScore >= 23) return 6.0;
  if (rawScore >= 18) return 5.5;
  if (rawScore >= 16) return 5.0;
  if (rawScore >= 13) return 4.5;
  if (rawScore >= 10) return 4.0;
  if (rawScore >= 8) return 3.5;
  if (rawScore >= 6) return 3.0;
  if (rawScore >= 4) return 2.5;
  return 2.0;
};

/**
 * Calculate detailed score with question-level results
 * Returns both band score and detailed scoring information
 */
function calculateDetailedScore(
  answers: UserAnswers,
  examData: ExamData,
  writingEssays?: WritingSubmissions,
  speakingAudio?: SpeakingSubmissions,
): { band: number; detailedResults: DetailedResults } {
  const questionResults: DetailedResults["questionResults"] = [];
  let readingCorrect = 0;
  let readingTotal = 0;
  let listeningCorrect = 0;
  let listeningTotal = 0;

  // Process Reading answers
  if (examData.reading) {
    for (const passage of examData.reading) {
      for (const group of passage.groups) {
        // Handle TABLE_COMPLETION groups
        if (
          group.groupType === "TABLE_COMPLETION" &&
          group.tableData?.questions
        ) {
          for (const tq of group.tableData.questions) {
            readingTotal++;
            const userAnswer = (answers[tq.id] || "").toString().trim();
            const correctAnswer = (tq.correctAnswer || "").toString().trim();
            const isCorrect =
              userAnswer.toLowerCase() === correctAnswer.toLowerCase() &&
              userAnswer !== "";

            if (isCorrect) readingCorrect++;

            questionResults.push({
              id: tq.id,
              userAnswer,
              correctAnswer,
              isCorrect,
            });
          }
        } else {
          // Normal questions
          for (const question of group.questions) {
            readingTotal++;
            const userAnswer = (answers[question.id] || "").toString().trim();
            const correctAnswer = (question.correctAnswer || "")
              .toString()
              .trim();
            const isCorrect =
              userAnswer.toLowerCase() === correctAnswer.toLowerCase() &&
              userAnswer !== "";

            if (isCorrect) readingCorrect++;

            questionResults.push({
              id: question.id,
              userAnswer,
              correctAnswer,
              isCorrect,
            });
          }
        }
      }
    }
  }

  // Process Listening answers
  if (examData.listening) {
    for (const section of examData.listening) {
      for (const group of section.groups) {
        // Handle TABLE_COMPLETION groups
        if (
          group.groupType === "TABLE_COMPLETION" &&
          group.tableData?.questions
        ) {
          for (const tq of group.tableData.questions) {
            listeningTotal++;
            const userAnswer = (answers[tq.id] || "").toString().trim();
            const correctAnswer = (tq.correctAnswer || "").toString().trim();
            const isCorrect =
              userAnswer.toLowerCase() === correctAnswer.toLowerCase() &&
              userAnswer !== "";

            if (isCorrect) listeningCorrect++;

            questionResults.push({
              id: tq.id,
              userAnswer,
              correctAnswer,
              isCorrect,
            });
          }
        } else {
          // Normal questions
          for (const question of group.questions) {
            listeningTotal++;
            const userAnswer = (answers[question.id] || "").toString().trim();
            const correctAnswer = (question.correctAnswer || "")
              .toString()
              .trim();
            const isCorrect =
              userAnswer.toLowerCase() === correctAnswer.toLowerCase() &&
              userAnswer !== "";

            if (isCorrect) listeningCorrect++;

            questionResults.push({
              id: question.id,
              userAnswer,
              correctAnswer,
              isCorrect,
            });
          }
        }
      }
    }
  }

  // Convert raw scores to band scores
  const readingBand = convertToReadingBand(readingCorrect);
  const listeningBand = convertToListeningBand(listeningCorrect);

  // Calculate average band (IELTS rounds to nearest 0.5)
  const average = (readingBand + listeningBand) / 2;
  const band = Math.round(average * 2) / 2;

  // Note: speakingAudio Blobs are uploaded separately to server via uploadAudioFile()
  // The URLs to uploaded files will be added to detailedResults.speakingAudio before submission

  const detailedResults: DetailedResults = {
    answers,
    scoring: {
      reading: {
        correct: readingCorrect,
        total: readingTotal,
        band: readingBand,
      },
      listening: {
        correct: listeningCorrect,
        total: listeningTotal,
        band: listeningBand,
      },
      writing: { submitted: Object.keys(writingEssays || {}).length > 0 },
      speaking: { submitted: Object.keys(speakingAudio || {}).length > 0 },
    },
    questionResults,
    writingEssays: writingEssays || {},
    // speakingAudio URLs will be added by submitAssessment() after upload
  };

  return { band, detailedResults };
}
