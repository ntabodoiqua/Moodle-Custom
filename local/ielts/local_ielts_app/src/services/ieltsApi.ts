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
  params: Record<string, string | number | boolean> = {}
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
      }
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
 * @returns Attempt ID on success, null on failure
 */
export const submitExamResult = async (
  examId: number,
  answers: UserAnswers,
  band: number
): Promise<number | null> => {
  // Stringify answers for transmission
  const resultsJson = JSON.stringify(answers);

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

// Export types for external use
export type { ApiResponse, ExamResponse, SubmitAttemptResponse };
