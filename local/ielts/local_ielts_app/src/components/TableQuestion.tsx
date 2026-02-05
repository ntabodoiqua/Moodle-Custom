import { Input } from "antd";
import type { TableData } from "../types";
import styles from "./TableQuestion.module.css";

interface TableQuestionProps {
  tableData: TableData;
  answers: { [key: number]: string };
  onAnswerChange: (questionId: number, value: string) => void;
  questionIdPrefix?: string; // Prefix for generating question IDs (e.g., "listening-question-")
}

// Extract question number from cell content like "[1]", "[2]", "[2] Nelson", etc.
// Returns the first [number] found in the cell content
const extractQuestionNumber = (cellContent: string): number | null => {
  const match = cellContent.match(/\[(\d+)\]/);
  return match ? parseInt(match[1], 10) : null;
};

// Parse cell content and extract parts before and after the gap marker
// Handles formats like: "[1]", "[2] Nelson", "Name: [3]", "[4] (surname)"
interface ParsedCellContent {
  isQuestion: boolean;
  questionNumber: number | null;
  textBefore: string;
  textAfter: string;
}

const parseCell = (cellContent: string): ParsedCellContent => {
  const trimmed = cellContent.trim();
  const match = trimmed.match(/^(.*?)\[(\d+)\](.*)$/);

  if (match) {
    const textBefore = match[1].trim();
    const questionNumber = parseInt(match[2], 10);
    const textAfter = match[3].trim();
    return {
      isQuestion: true,
      questionNumber,
      textBefore,
      textAfter,
    };
  }

  return {
    isQuestion: false,
    questionNumber: null,
    textBefore: cellContent,
    textAfter: "",
  };
};

// Build a map from display number (from cell content) to actual question ID
const buildQuestionIdMap = (tableData: TableData): Map<number, number> => {
  const map = new Map<number, number>();

  // First, extract display numbers from cells in order
  const displayNumbersFromCells: number[] = [];
  tableData.rows.forEach((row) => {
    row.forEach((cell) => {
      const questionNumber = extractQuestionNumber(cell.trim());
      if (questionNumber !== null) {
        displayNumbersFromCells.push(questionNumber);
      }
    });
  });
  displayNumbersFromCells.sort((a, b) => a - b);

  // Map each display number to corresponding question ID
  if (tableData.questions && tableData.questions.length > 0) {
    displayNumbersFromCells.forEach((displayNum, index) => {
      const questionObj = tableData.questions![index];
      if (questionObj) {
        map.set(displayNum, questionObj.id);
      }
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
                        {parsed.textBefore && (
                          <span className={styles.cellText}>
                            {parsed.textBefore}
                          </span>
                        )}
                        <Input
                          className={styles.tableInput}
                          placeholder="Type your answer"
                          value={answers[questionId] || ""}
                          onChange={(e) =>
                            onAnswerChange(questionId, e.target.value)
                          }
                        />
                        {parsed.textAfter && (
                          <span className={styles.cellText}>
                            {parsed.textAfter}
                          </span>
                        )}
                      </div>
                    </td>
                  );
                }

                return (
                  <td key={cellIndex} className={styles.tableCell}>
                    <span className={styles.cellText}>{parsed.textBefore}</span>
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
  // First, extract display numbers from cell content (e.g., [1], [2], [3])
  // This is the source of truth for display numbers
  const displayNumbersFromCells: number[] = [];
  tableData.rows.forEach((row) => {
    row.forEach((cell) => {
      const questionNumber = extractQuestionNumber(cell.trim());
      if (questionNumber !== null) {
        displayNumbersFromCells.push(questionNumber);
      }
    });
  });
  displayNumbersFromCells.sort((a, b) => a - b);

  // If questions array exists, map display numbers to actual IDs
  if (tableData.questions && tableData.questions.length > 0) {
    // Build a map: array index -> question object
    // Questions array should be in same order as display numbers
    return displayNumbersFromCells
      .map((displayNum, index) => {
        const questionObj = tableData.questions![index];
        if (questionObj) {
          return {
            id: questionObj.id,
            displayNumber:
              questionObj.number !== undefined
                ? questionObj.number
                : displayNum,
          };
        }
        // Fallback if no matching question object
        return { id: displayNum, displayNumber: displayNum };
      })
      .sort((a, b) => a.displayNumber - b.displayNumber);
  }

  // Fallback: use display numbers as IDs (for backward compatibility)
  return displayNumbersFromCells.map((num) => ({
    id: num,
    displayNumber: num,
  }));
};

export default TableQuestion;
