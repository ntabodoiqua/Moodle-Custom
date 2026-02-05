import { Select, Checkbox, Radio, Input } from "antd";
import type { Question } from "../types";
import styles from "./QuestionRenderer.module.css";

interface QuestionRendererProps {
  question: Question;
  answer: string | undefined;
  onAnswerChange: (questionId: number, value: string) => void;
}

const QuestionRenderer = ({
  question,
  answer,
  onAnswerChange,
}: QuestionRendererProps) => {
  const { id, type, options, matchItems, numCorrect } = question;

  // Handle multiple selection for MULTIPLE_CHOICE_MULTI
  const handleMultiSelect = (checkedValues: string[]) => {
    onAnswerChange(id, checkedValues.join(","));
  };

  // Get current selected values for multi-select
  const getMultiSelectValues = (): string[] => {
    if (!answer) return [];
    return answer.split(",").filter((v) => v.trim() !== "");
  };

  // Render based on question type
  switch (type) {
    // Single choice - Radio buttons (uses A, B, C keys)
    case "MULTIPLE_CHOICE":
      return (
        <Radio.Group
          className={styles.radioGroup}
          value={answer || undefined}
          onChange={(e) => onAnswerChange(id, e.target.value)}
        >
          {options?.map((opt, idx) => {
            const key = String.fromCharCode(65 + idx); // A, B, C, D...
            return (
              <Radio key={idx} value={key} className={styles.radioItem}>
                {key}. {opt}
              </Radio>
            );
          })}
        </Radio.Group>
      );

    // Multiple choice with multiple correct answers (uses A, B, C keys)
    case "MULTIPLE_CHOICE_MULTI":
      return (
        <div className={styles.multiChoiceContainer}>
          <div className={styles.multiChoiceHint}>
            Choose {numCorrect || 2} answers
          </div>
          <Checkbox.Group
            className={styles.checkboxGroup}
            value={getMultiSelectValues()}
            onChange={handleMultiSelect}
          >
            {options?.map((opt, idx) => {
              const key = String.fromCharCode(65 + idx); // A, B, C, D...
              return (
                <Checkbox key={idx} value={key} className={styles.checkboxItem}>
                  {key}. {opt}
                </Checkbox>
              );
            })}
          </Checkbox.Group>
        </div>
      );

    // True/False/Not Given
    case "TRUE_FALSE":
      return (
        <Radio.Group
          className={styles.radioGroup}
          value={answer || undefined}
          onChange={(e) => onAnswerChange(id, e.target.value)}
        >
          <Radio value="TRUE" className={styles.radioItem}>
            TRUE
          </Radio>
          <Radio value="FALSE" className={styles.radioItem}>
            FALSE
          </Radio>
          <Radio value="NOT GIVEN" className={styles.radioItem}>
            NOT GIVEN
          </Radio>
        </Radio.Group>
      );

    // Yes/No/Not Given
    case "YES_NO":
      return (
        <Radio.Group
          className={styles.radioGroup}
          value={answer || undefined}
          onChange={(e) => onAnswerChange(id, e.target.value)}
        >
          <Radio value="YES" className={styles.radioItem}>
            YES
          </Radio>
          <Radio value="NO" className={styles.radioItem}>
            NO
          </Radio>
          <Radio value="NOT GIVEN" className={styles.radioItem}>
            NOT GIVEN
          </Radio>
        </Radio.Group>
      );

    // Matching types - select from match items list (Gộp tất cả matching types)
    case "MATCHING":
      const matchOptions = matchItems || options || [];
      return (
        <Select
          className={styles.answerSelect}
          placeholder="Select matching item"
          value={answer || undefined}
          onChange={(value) => onAnswerChange(id, value)}
          options={matchOptions.map((item, idx) => ({
            label: `${String.fromCharCode(65 + idx)}. ${item}`,
            value: String.fromCharCode(65 + idx),
          }))}
        />
      );

    // Map/Diagram labeling - select from options
    case "MAP_LABELING":
      return (
        <Select
          className={styles.answerSelect}
          placeholder="Select label"
          value={answer || undefined}
          onChange={(value) => onAnswerChange(id, value)}
          options={options?.map((opt) => ({
            label: opt,
            value: opt,
          }))}
        />
      );

    // Text input types (Gộp: SHORT_ANSWER, GAP_FILL, SUMMARY_COMPLETION)
    case "SHORT_ANSWER":
    default:
      return (
        <Input
          className={styles.answerInput}
          placeholder="Type your answer"
          value={answer || ""}
          onChange={(e) => onAnswerChange(id, e.target.value)}
        />
      );
  }
};

export default QuestionRenderer;
