import { Input } from "antd";
import type { TableData } from "../types";
import styles from "./TableQuestion.module.css";

interface TableQuestionProps {
  tableData: TableData;
  answers: { [key: number]: string };
  onAnswerChange: (questionId: number, value: string) => void;
  questionIdPrefix?: string; // Prefix for generating question IDs (e.g., "listening-question-")
}

// Extract question number from cell content like "[1]", "[2]", etc.
const extractQuestionNumber = (cellContent: string): number | null => {
  const match = cellContent.match(/^\[(\d+)\]$/);
  return match ? parseInt(match[1], 10) : null;
};

// Parse a cell to check if it's a question input or plain text
const parseCell = (
  cellContent: string,
): { isQuestion: boolean; questionNumber: number | null; text: string } => {
  const questionNumber = extractQuestionNumber(cellContent.trim());
  if (questionNumber !== null) {
    return { isQuestion: true, questionNumber, text: "" };
  }
  return { isQuestion: false, questionNumber: null, text: cellContent };
};

// Build a map from display number to actual question ID
const buildQuestionIdMap = (tableData: TableData): Map<number, number> => {
  const map = new Map<number, number>();
  if (tableData.questions) {
    tableData.questions.forEach((q) => {
      // Support both new format (with number) and old format (id as number)
      const displayNum = q.number !== undefined ? q.number : q.id;
      map.set(displayNum, q.id);
    });
  }
  return map;
};

const TableQuestion = ({
  tableData,
  answers,
  onAnswerChange,
  questionIdPrefix = "listening-question-",
}: TableQuestionProps) => {
  const { headers, rows } = tableData;
  const questionIdMap = buildQuestionIdMap(tableData);

  return (
    <div className={styles.tableContainer}>
      <table className={styles.questionTable}>
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={index} className={styles.tableHeader}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className={styles.tableRow}>
              {row.map((cell, cellIndex) => {
                const parsed = parseCell(cell);

                if (parsed.isQuestion && parsed.questionNumber !== null) {
                  const displayNumber = parsed.questionNumber;
                  // Get actual question ID from map, fallback to display number for backward compatibility
                  const questionId =
                    questionIdMap.get(displayNumber) ?? displayNumber;

                  return (
                    <td
                      key={cellIndex}
                      className={styles.tableCell}
                      id={`${questionIdPrefix}${questionId}`}
                    >
                      <div className={styles.inputCell}>
                        <span className={styles.questionNumber}>
                          {displayNumber}.
                        </span>
                        <Input
                          className={styles.tableInput}
                          placeholder="Type your answer"
                          value={answers[questionId] || ""}
                          onChange={(e) =>
                            onAnswerChange(questionId, e.target.value)
                          }
                        />
                      </div>
                    </td>
                  );
                }

                return (
                  <td key={cellIndex} className={styles.tableCell}>
                    <span className={styles.cellText}>{parsed.text}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Helper function to extract all question IDs from table data
export const extractTableQuestionIds = (tableData: TableData): number[] => {
  // If questions array exists, use the actual IDs
  if (tableData.questions && tableData.questions.length > 0) {
    return tableData.questions.map((q) => q.id).sort((a, b) => a - b);
  }

  // Fallback: extract from cell content (for backward compatibility)
  const questionIds: number[] = [];
  tableData.rows.forEach((row) => {
    row.forEach((cell) => {
      const questionNumber = extractQuestionNumber(cell.trim());
      if (questionNumber !== null) {
        questionIds.push(questionNumber);
      }
    });
  });

  return questionIds.sort((a, b) => a - b);
};

// Helper to extract question info with both ID and display number
export interface QuestionInfo {
  id: number;
  displayNumber: number;
}

export const extractTableQuestionInfo = (
  tableData: TableData,
): QuestionInfo[] => {
  // If questions array exists with proper structure
  if (tableData.questions && tableData.questions.length > 0) {
    return tableData.questions
      .map((q) => ({
        id: q.id,
        displayNumber: q.number !== undefined ? q.number : q.id,
      }))
      .sort((a, b) => a.displayNumber - b.displayNumber);
  }

  // Fallback: extract from cell content (for backward compatibility)
  const questions: QuestionInfo[] = [];
  tableData.rows.forEach((row) => {
    row.forEach((cell) => {
      const questionNumber = extractQuestionNumber(cell.trim());
      if (questionNumber !== null) {
        questions.push({ id: questionNumber, displayNumber: questionNumber });
      }
    });
  });

  return questions.sort((a, b) => a.displayNumber - b.displayNumber);
};

export default TableQuestion;
