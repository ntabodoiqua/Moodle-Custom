// src/services/ieltsApi.ts
import axios, { AxiosError } from "axios";
import type { ExamData, UserAnswers, MoodleConfig } from "../types";

// Re-export MoodleConfig for convenience
export type { MoodleConfig };

/**
 * API response interface from Moodle backend
 */
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Exam response from getexam action
 */
interface ExamResponse {
  id: number;
  name: string;
  exam: ExamData;
  timecreated: number;
  timemodified: number;
}

/**
 * Submit attempt response
 */
interface SubmitAttemptResponse {
  attempt_id: number;
  message: string;
}

// Module-level config storage
let _config: MoodleConfig | null = null;

/**
 * Initialize the API service with Moodle config
 * Must be called before making any API requests
 */
export const initializeApi = (config: MoodleConfig): void => {
  _config = config;
};

/**
 * Get current config (throws if not initialized)
 */
const getConfig = (): MoodleConfig => {
  if (!_config) {
    throw new Error("API not initialized. Call initializeApi(config) first.");
  }
  return _config;
};

/**
 * Generic API call helper that converts params to FormData
 * and automatically appends sesskey for CSRF protection
 *
 * @param action - The API action name (e.g., 'getexam', 'submitattempt')
 * @param params - Key-value pairs to send as form data
 * @returns Promise with typed API response
 */
export const callApi = async <T = unknown>(
  action: string,
  params: Record<string, string | number | boolean> = {},
): Promise<ApiResponse<T>> => {
  const config = getConfig();

  // Create FormData object (Moodle requires multipart/form-data)
  const formData = new FormData();
  formData.append("action", action);
  formData.append("sesskey", config.sesskey);

  // Append all additional params
  Object.entries(params).forEach(([key, value]) => {
    formData.append(key, String(value));
  });

  try {
    const response = await axios.post<ApiResponse<T>>(
      config.apiEndpoint,
      formData,
      {
        headers: {
          // Let browser set Content-Type with boundary for FormData
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiResponse<T>>;

    // If server returned an error response with our format
    if (axiosError.response?.data) {
      return axiosError.response.data;
    }

    // Network or other error
    console.error(`API call failed for action '${action}':`, error);
    return {
      success: false,
      error: axiosError.message || "Network error occurred",
    };
  }
};

/**
 * Fetch exam data by ID
 *
 * @param id - The exam ID
 * @returns ExamData object or null if not found/error
 */
export const fetchExamById = async (id: number): Promise<ExamData | null> => {
  const response = await callApi<ExamResponse>("getexam", { id });

  if (!response.success || !response.data) {
    console.error("Failed to fetch exam:", response.error);
    return null;
  }

  // The exam data is nested inside response.data.exam
  return response.data.exam;
};

/**
 * Submit exam results to the backend
 *
 * @param examId - The exam ID
 * @param answers - User answers object
 * @param band - Calculated band score (0-9)
 * @param detailedResults - Optional detailed scoring info
 * @returns Attempt ID on success, null on failure
 */
export interface DetailedResults {
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
  writingEssays?: Record<number, string>;
  speakingAudio?: Record<number, string>; // URLs to uploaded audio files
}

export const submitExamResult = async (
  examId: number,
  answers: UserAnswers,
  band: number,
  detailedResults?: DetailedResults,
): Promise<number | null> => {
  // If detailed results provided, use that; otherwise just answers
  const resultsJson = detailedResults
    ? JSON.stringify(detailedResults)
    : JSON.stringify({ answers });

  const response = await callApi<SubmitAttemptResponse>("submitattempt", {
    exam_id: examId,
    results: resultsJson,
    band: band,
  });

  if (!response.success || !response.data) {
    console.error("Failed to submit exam:", response.error);
    return null;
  }

  return response.data.attempt_id;
};

/**
 * Upload audio file for speaking section
 *
 * @param examId - The exam ID
 * @param partId - Speaking part ID (1, 2, or 3)
 * @param audioBlob - Audio file as Blob
 * @returns File URL on success, null on failure
 */
export const uploadAudioFile = async (
  examId: number,
  partId: number,
  audioBlob: Blob,
): Promise<string | null> => {
  const config = getConfig();

  // Create FormData for file upload
  const formData = new FormData();
  formData.append("action", "uploadaudio");
  formData.append("sesskey", config.sesskey);
  formData.append("exam_id", examId.toString());
  formData.append("part_id", partId.toString());

  // Add audio file with proper filename and type
  const filename = `speaking_part${partId}.webm`;
  formData.append("audio", audioBlob, filename);

  try {
    const response = await axios.post<
      ApiResponse<{
        file_url: string;
        filename: string;
        filesize: number;
        message: string;
      }>
    >(config.apiEndpoint, formData, {
      headers: {
        // Let browser set Content-Type with boundary for FormData
        "Content-Type": "multipart/form-data",
      },
    });

    if (response.data.success && response.data.data) {
      return response.data.data.file_url;
    } else {
      console.error("Failed to upload audio:", response.data.error);
      return null;
    }
  } catch (error) {
    const axiosError = error as AxiosError<ApiResponse>;

    console.error(`Audio upload failed for part ${partId}:`, error);

    if (axiosError.response?.data?.error) {
      console.error("Server error:", axiosError.response.data.error);
    }

    return null;
  }
};

// Export types for external use
export type { ApiResponse, ExamResponse, SubmitAttemptResponse };
