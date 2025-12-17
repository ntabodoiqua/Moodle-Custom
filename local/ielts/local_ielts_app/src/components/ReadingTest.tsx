import { useState, useEffect, useMemo } from "react";
import { Select, Empty } from "antd";
import { useExamStore } from "../store/examStore";
import styles from "./ReadingTest.module.css";

interface ReadingTestProps {
  answers: { [key: number]: string };
  onAnswerChange: (questionId: number, value: string) => void;
}

const ReadingTest = ({ answers, onAnswerChange }: ReadingTestProps) => {
  const { examData } = useExamStore();
  const [currentPart, setCurrentPart] = useState(0);

  // Get reading passages from examData
  const passages = useMemo(() => examData?.reading || [], [examData]);

  // Get questions for current passage
  const currentPassage = passages[currentPart];
  const currentQuestionIds = useMemo(() => {
    if (!currentPassage) return [];
    const ids: number[] = [];
    currentPassage.groups.forEach((group) => {
      group.questions.forEach((q) => {
        ids.push(q.id);
      });
    });
    return ids;
  }, [currentPassage]);

  // Reset currentPart when component mounts or examData changes
  useEffect(() => {
    setCurrentPart(0);
  }, [examData]);

  // Function to scroll to a specific question
  const scrollToQuestion = (questionId: number) => {
    const element = document.getElementById(`question-${questionId}`);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  // Determine input type based on question type
  const isDropdown = (type: string) => {
    return type === "MULTIPLE_CHOICE" || type === "TRUE_FALSE";
  };

  if (!examData || passages.length === 0) {
    return (
      <div className={styles.containerWrapper}>
        <div className={styles.emptyState}>
          <Empty description="No reading passages available" />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.containerWrapper}>
      <div className={styles.container}>
        {/* Left Panel - Reading Passage */}
        <div className={styles.passagePanel}>
          <div className={styles.partHeader}>PART {currentPart + 1}</div>
          <h1 className={styles.passageTitle}>
            READING PASSAGE {currentPart + 1}
          </h1>
          <p className={styles.passageSubtitle}>
            You should spend about 20 minutes on{" "}
            <strong>
              Questions {currentQuestionIds[0] || 1}-
              {currentQuestionIds[currentQuestionIds.length - 1] || 1}
            </strong>
            , which are based on Reading Passage {currentPart + 1} below.
          </p>

          <h2 className={styles.passageTitle}>{currentPassage?.title}</h2>

          <div
            className={styles.passageContent}
            dangerouslySetInnerHTML={{ __html: currentPassage?.content || "" }}
          />
        </div>

        {/* Right Panel - Questions */}
        <div className={styles.questionsPanel}>
          {currentPassage?.groups.map((group) => (
            <div key={group.id} className={styles.questionSection}>
              <h3 className={styles.questionSectionTitle}>{group.title}</h3>

              {group.instruction && (
                <div className={styles.questionInstruction}>
                  {group.instruction}
                </div>
              )}

              {group.questions.map((question) => (
                <div
                  key={question.id}
                  id={`question-${question.id}`}
                  className={styles.question}
                >
                  <div className={styles.questionNumber}>{question.id}.</div>
                  <div className={styles.questionContent}>
                    <div
                      className={styles.questionText}
                      dangerouslySetInnerHTML={{ __html: question.text }}
                    />

                    {isDropdown(question.type) && question.options ? (
                      <Select
                        className={styles.answerSelect}
                        placeholder="Select answer"
                        value={answers[question.id] || undefined}
                        onChange={(value) => onAnswerChange(question.id, value)}
                        options={question.options.map((opt) => ({
                          label: opt,
                          value: opt,
                        }))}
                      />
                    ) : (
                      <input
                        type="text"
                        className={styles.answerInput}
                        placeholder="Type your answer"
                        value={answers[question.id] || ""}
                        onChange={(e) =>
                          onAnswerChange(question.id, e.target.value)
                        }
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Part Navigation - Fixed at bottom */}
      <div className={styles.partNavigation}>
        <div className={styles.partTabs}>
          {passages.map((_, index) => (
            <button
              key={index}
              className={`${styles.partTab} ${
                index === currentPart ? styles.activeTab : ""
              }`}
              onClick={() => setCurrentPart(index)}
            >
              Part {index + 1}
            </button>
          ))}
        </div>

        <div className={styles.partButtons}>
          {currentQuestionIds.map((id) => (
            <button
              key={id}
              className={`${styles.partButton} ${
                answers[id] ? styles.completed : ""
              }`}
              onClick={() => scrollToQuestion(id)}
            >
              {id}
            </button>
          ))}
        </div>

        <div className={styles.progressInfo}>
          {passages.map((passage, index) => {
            if (index === currentPart) return null;
            const passageQuestionIds: number[] = [];
            passage.groups.forEach((g) =>
              g.questions.forEach((q) => passageQuestionIds.push(q.id))
            );
            const answered = passageQuestionIds.filter(
              (id) => answers[id]
            ).length;
            return (
              <div key={index} className={styles.progressItem}>
                <strong>Part {index + 1}:</strong> {answered} of{" "}
                {passageQuestionIds.length} questions
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ReadingTest;
