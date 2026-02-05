/**
 * Utility functions for answer validation
 */

/**
 * Check if user answer matches the correct answer(s).
 * Supports multiple acceptable answers separated by "|".
 *
 * Example: correctAnswer = "five|5" means either "five" or "5" is correct.
 *
 * @param userAnswer - The answer provided by the user
 * @param correctAnswer - The correct answer(s), multiple options separated by "|"
 * @returns true if the user answer matches any of the acceptable answers
 */
export function checkAnswer(
  userAnswer: string,
  correctAnswer: string,
): boolean {
  // Normalize user answer
  const normalizedUserAnswer = (userAnswer || "")
    .toString()
    .trim()
    .toLowerCase();

  // Empty answers are always incorrect
  if (!normalizedUserAnswer) {
    return false;
  }

  // Normalize correct answer string
  const correctAnswerStr = (correctAnswer || "").toString().trim();

  // If there's no correct answer defined, can't be correct
  if (!correctAnswerStr) {
    return false;
  }

  // Split by "|" to get all acceptable answers
  const acceptableAnswers = correctAnswerStr
    .split("|")
    .map((ans) => ans.trim().toLowerCase());

  // Check if user answer matches any of the acceptable answers
  return acceptableAnswers.some(
    (acceptable) => acceptable === normalizedUserAnswer,
  );
}

/**
 * Check if user answer matches the correct answer(s) and return details.
 *
 * @param userAnswer - The answer provided by the user
 * @param correctAnswer - The correct answer(s), multiple options separated by "|"
 * @returns Object with isCorrect boolean and normalizedAnswers
 */
export function checkAnswerWithDetails(
  userAnswer: string,
  correctAnswer: string,
): { isCorrect: boolean; userAnswer: string; correctAnswer: string } {
  const normalizedUserAnswer = (userAnswer || "").toString().trim();
  const correctAnswerStr = (correctAnswer || "").toString().trim();

  return {
    isCorrect: checkAnswer(userAnswer, correctAnswer),
    userAnswer: normalizedUserAnswer,
    correctAnswer: correctAnswerStr,
  };
}
