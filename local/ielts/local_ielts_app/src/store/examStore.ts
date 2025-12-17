// src/store/examStore.ts
import { create } from "zustand";
import type {
  ExamData,
  SkillType,
  UserAnswers,
  WritingSubmissions,
  SpeakingSubmissions,
} from "../types";

interface ExamState {
  // Dữ liệu đề thi
  examData: ExamData | null;
  currentSkill: SkillType;

  // Trạng thái làm bài
  timeLeft: number; // Thời gian còn lại (giây)

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
  tickTimer: () => void;

  isSubmitted: boolean; // <--- Thêm cái này
  submitExam: () => void; // <--- Action nộp bài
}

export const useExamStore = create<ExamState>((set) => ({
  examData: null,
  currentSkill: "READING", // Mặc định vào là Reading
  timeLeft: 0,

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

  setSkill: (skill, duration) =>
    set({
      currentSkill: skill,
      timeLeft: duration,
    }),

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

  tickTimer: () =>
    set((state) => ({
      timeLeft: state.timeLeft > 0 ? state.timeLeft - 1 : 0,
    })),
  isSubmitted: false, // Mặc định chưa nộp
  submitExam: () => set({ isSubmitted: true }), // Nộp thì set thành true
}));
