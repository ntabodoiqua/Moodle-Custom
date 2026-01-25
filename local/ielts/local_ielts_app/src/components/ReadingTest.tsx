import { useState, useEffect, useMemo } from "react";
import { Empty } from "antd";
import { useExamStore } from "../store/examStore";
import QuestionRenderer from "./QuestionRenderer";
import TableQuestion, {
  extractTableQuestionIds,
  extractTableQuestionInfo,
} from "./TableQuestion";
import type { QuestionInfo } from "./TableQuestion";
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

  // Get questions for current passage (including table questions)
  const currentPassage = passages[currentPart];
  const currentQuestionInfo = useMemo(() => {
    if (!currentPassage) return [];
    const questions: QuestionInfo[] = [];
    currentPassage.groups.forEach((group) => {
      // Check if this is a table completion group
      if (group.groupType === "TABLE_COMPLETION" && group.tableData) {
        const tableQuestions = extractTableQuestionInfo(group.tableData);
        questions.push(...tableQuestions);
      } else {
        // Normal questions
        group.questions.forEach((q) => {
          const displayNum = q.number ? parseInt(q.number, 10) : q.id;
          questions.push({ id: q.id, displayNumber: displayNum });
        });
      }
    });
    return questions.sort((a, b) => a.displayNumber - b.displayNumber);
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
              Questions {currentQuestionInfo[0]?.displayNumber || 1}-
              {currentQuestionInfo[currentQuestionInfo.length - 1]
                ?.displayNumber || 1}
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

              {/* Render instruction only for non-table groups */}
              {group.instruction && group.groupType !== "TABLE_COMPLETION" && (
                <div className={styles.questionInstruction}>
                  {group.instruction}
                </div>
              )}

              {/* Render TABLE_COMPLETION group */}
              {group.groupType === "TABLE_COMPLETION" && group.tableData ? (
                <TableQuestion
                  tableData={group.tableData}
                  answers={answers}
                  onAnswerChange={onAnswerChange}
                  questionIdPrefix="question-"
                />
              ) : (
                /* Render normal questions */
                group.questions.map((question) => (
                  <div
                    key={question.id}
                    id={`question-${question.id}`}
                    className={styles.question}
                  >
                    <div className={styles.questionNumber}>
                      {question.number}.
                    </div>
                    <div className={styles.questionContent}>
                      <div
                        className={styles.questionText}
                        dangerouslySetInnerHTML={{ __html: question.text }}
                      />

                      <QuestionRenderer
                        question={question}
                        answer={answers[question.id]}
                        onAnswerChange={onAnswerChange}
                      />
                    </div>
                  </div>
                ))
              )}
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
          {currentQuestionInfo.map((qInfo) => (
            <button
              key={qInfo.id}
              className={`${styles.partButton} ${
                answers[qInfo.id] ? styles.completed : ""
              }`}
              onClick={() => scrollToQuestion(qInfo.id)}
            >
              {qInfo.displayNumber}
            </button>
          ))}
        </div>

        <div className={styles.progressInfo}>
          {passages.map((passage, index) => {
            if (index === currentPart) return null;
            const passageQuestionIds: number[] = [];
            passage.groups.forEach((g) => {
              // Handle TABLE_COMPLETION groups
              if (g.groupType === "TABLE_COMPLETION" && g.tableData) {
                const tableIds = extractTableQuestionIds(g.tableData);
                passageQuestionIds.push(...tableIds);
              } else {
                // Normal questions
                g.questions.forEach((q) => passageQuestionIds.push(q.id));
              }
            });
            const answered = passageQuestionIds.filter(
              (id) => answers[id],
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
