// src/types/index.ts

// --- MOODLE CONFIG ---
export interface MoodleConfig {
  userId: number;
  sesskey: string;
  wwwroot: string;
  apiEndpoint: string;
  fullName?: string;
}

// --- COMMON (Dùng chung) ---
export type SkillType = "READING" | "LISTENING" | "WRITING" | "SPEAKING";

export interface Question {
  id: number;
  number: string; // Vd: "1", "2", "3-5"
  text: string; // Nội dung câu hỏi
  type:
    | "MULTIPLE_CHOICE"
    | "TRUE_FALSE"
    | "GAP_FILL"
    | "MATCHING"
    | "MAP_LABELING";
  options?: string[]; // Cho trắc nghiệm
  correctAnswer?: string; // Đáp án đúng
  explanation?: string; // Giải thích đáp án
  referenceText?: string; // Đoạn văn tham chiếu (cho Reading)
}

export interface QuestionGroup {
  id: number;
  title: string; // Vd: "Questions 1-5"
  instruction: string; // Vd: "Choose the correct letter..."
  questions: Question[];
}

// --- READING ---
export interface ReadingPassage {
  id: number;
  title: string;
  content: string; // HTML bài đọc
  groups: QuestionGroup[];
}

// --- LISTENING (Mới) ---
export interface ListeningSection {
  id: number;
  title: string; // Vd: "Section 1"
  audioUrl: string; // URL file mp3 cho section này
  groups: QuestionGroup[];
}

// --- WRITING (Mới) ---
export interface WritingTask {
  id: number;
  type: "TASK_1" | "TASK_2";
  title: string; // Vd: "Writing Task 1"
  prompt: string; // HTML đề bài
  imageUrl?: string; // Dùng cho Task 1 (Biểu đồ/Map)
  minWords: number; // Vd: 150 hoặc 250
}

// --- SPEAKING (Mới) ---
export interface SpeakingPart {
  id: number;
  partNumber: 1 | 2 | 3;
  title: string; // Vd: "Part 1: Introduction"
  questions: string[]; // Danh sách câu hỏi gợi ý
  preparationTime?: number; // Cho Part 2 (60 giây)
}

// --- ROOT DATA STRUCTURE ---
export interface ExamData {
  id: number;
  title: string;
  duration: number; // Tổng thời gian (nếu cần)

  // 4 kỹ năng có thể có hoặc null (nếu bài thi lẻ)
  reading?: ReadingPassage[];
  listening?: ListeningSection[];
  writing?: WritingTask[];
  speaking?: SpeakingPart[];
}

// --- SUBMISSION TYPES ---
export interface UserAnswers {
  [questionId: number]: string; // Dùng cho Reading/Listening
}

export interface WritingSubmissions {
  [taskId: number]: string; // Lưu bài văn (text)
}

export interface SpeakingSubmissions {
  [partId: number]: Blob; // Lưu file ghi âm (Blob audio)
}

// --- HELPER FUNCTIONS ---

/**
 * Get list of available skills in an exam
 * Returns array of skill types that have data
 */
export const getAvailableSkills = (examData: ExamData | null): SkillType[] => {
  if (!examData) return [];

  const skills: SkillType[] = [];

  if (examData.reading && examData.reading.length > 0) {
    skills.push("READING");
  }
  if (examData.listening && examData.listening.length > 0) {
    skills.push("LISTENING");
  }
  if (examData.writing && examData.writing.length > 0) {
    skills.push("WRITING");
  }
  if (examData.speaking && examData.speaking.length > 0) {
    skills.push("SPEAKING");
  }

  return skills;
};

/**
 * Get the next skill in sequence based on available skills
 * Returns null if current skill is the last one
 */
export const getNextSkill = (
  currentSkill: SkillType,
  availableSkills: SkillType[]
): SkillType | null => {
  const currentIndex = availableSkills.indexOf(currentSkill);
  if (currentIndex === -1 || currentIndex === availableSkills.length - 1) {
    return null; // Last skill or not found
  }
  return availableSkills[currentIndex + 1];
};

/**
 * Get default duration for a skill (in seconds)
 */
export const getSkillDuration = (skill: SkillType): number => {
  switch (skill) {
    case "READING":
      return 60 * 60; // 60 minutes
    case "LISTENING":
      return 40 * 60; // 40 minutes
    case "WRITING":
      return 60 * 60; // 60 minutes
    case "SPEAKING":
      return 15 * 60; // 15 minutes
    default:
      return 60 * 60;
  }
};

/**
 * Check if a skill has data in the exam
 */
export const hasSkillData = (
  examData: ExamData | null,
  skill: SkillType
): boolean => {
  if (!examData) return false;

  switch (skill) {
    case "READING":
      return !!(examData.reading && examData.reading.length > 0);
    case "LISTENING":
      return !!(examData.listening && examData.listening.length > 0);
    case "WRITING":
      return !!(examData.writing && examData.writing.length > 0);
    case "SPEAKING":
      return !!(examData.speaking && examData.speaking.length > 0);
    default:
      return false;
  }
};
