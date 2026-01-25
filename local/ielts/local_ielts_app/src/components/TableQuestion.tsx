import { Input } from "antd";
import type { TableData } from "../types";
import styles from "./TableQuestion.module.css";

interface TableQuestionProps {
  tableData: TableData;
  answers: { [key: number]: string };
  onAnswerChange: (questionId: number, value: string) => void;
  questionIdPrefix?: string; // Prefix for generating question IDs (e.g., "listening-question-")
}

// Extract question ID from cell content like "[1]", "[2]", etc.
const extractQuestionId = (cellContent: string): number | null => {
  const match = cellContent.match(/^\[(\d+)\]$/);
  return match ? parseInt(match[1], 10) : null;
};

// Parse a cell to check if it's a question input or plain text
const parseCell = (
  cellContent: string,
): { isQuestion: boolean; questionId: number | null; text: string } => {
  const questionId = extractQuestionId(cellContent.trim());
  if (questionId !== null) {
    return { isQuestion: true, questionId, text: "" };
  }
  return { isQuestion: false, questionId: null, text: cellContent };
};

const TableQuestion = ({
  tableData,
  answers,
  onAnswerChange,
  questionIdPrefix = "listening-question-",
}: TableQuestionProps) => {
  const { headers, rows } = tableData;

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

                if (parsed.isQuestion && parsed.questionId !== null) {
                  const questionId = parsed.questionId;
                  return (
                    <td
                      key={cellIndex}
                      className={styles.tableCell}
                      id={`${questionIdPrefix}${questionId}`}
                    >
                      <div className={styles.inputCell}>
                        <span className={styles.questionNumber}>
                          {questionId}.
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
  const questionIds: number[] = [];

  tableData.rows.forEach((row) => {
    row.forEach((cell) => {
      const questionId = extractQuestionId(cell.trim());
      if (questionId !== null) {
        questionIds.push(questionId);
      }
    });
  });

  return questionIds.sort((a, b) => a - b);
};

export default TableQuestion;
