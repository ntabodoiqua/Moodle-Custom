// src/types/index.ts

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
