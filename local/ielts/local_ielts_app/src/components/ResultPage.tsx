// src/components/ResultPage.tsx
import { useState, useRef, useMemo } from "react";
import { Button, Tooltip, message } from "antd";
import {
  CheckCircleOutlined,
  BookOutlined,
  SoundOutlined,
  EditOutlined,
  AudioOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  PercentageOutlined,
  HomeOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  FileTextOutlined,
  KeyOutlined,
  AimOutlined,
  CommentOutlined,
  WarningOutlined,
  RightOutlined,
  LeftOutlined,
} from "@ant-design/icons";
import { useExamStore } from "../store/examStore";
import styles from "./ResultPage.module.css";
import type { MoodleConfig } from "../types";
import { hasSkillData } from "../types";

interface ResultPageProps {
  config?: MoodleConfig;
}

const ResultPage = ({ config }: ResultPageProps) => {
  const {
    answers,
    writingEssays,
    speakingAudio,
    examData,
    timeTaken,
    isReviewMode,
    gradingInfo,
    reviewScoring,
    reviewQuestionResults,
    reviewBand,
  } = useExamStore();

  // Get review attempt data from config if in review mode
  const reviewAttemptData =
    isReviewMode && config?.attemptData ? config.attemptData : null;

  // Format time taken for display
  const formatTimeTaken = (seconds: number | null): string => {
    if (seconds === null) return "N/A";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  // Determine first available skill for default tab
  // In review mode, use reviewScoring to determine available skills
  const getFirstAvailableSkill = ():
    | "reading"
    | "listening"
    | "writing"
    | "speaking" => {
    // In review mode, check what was actually submitted
    if (isReviewMode && reviewScoring) {
      if (reviewScoring.reading && reviewScoring.reading.total > 0)
        return "reading";
      if (reviewScoring.listening && reviewScoring.listening.total > 0)
        return "listening";
      if (reviewScoring.writing?.submitted) return "writing";
      if (reviewScoring.speaking?.submitted) return "speaking";
    }
    // Fallback to examData
    if (examData?.reading?.length) return "reading";
    if (examData?.listening?.length) return "listening";
    if (examData?.writing?.length) return "writing";
    if (examData?.speaking?.length) return "speaking";
    // Last resort: check what answers exist
    if (Object.keys(answers).length > 0) return "listening"; // Assume listening if we have answers
    if (Object.keys(writingEssays).length > 0) return "writing";
    return "listening"; // Better default for review
  };

  const [activeReviewTab, setActiveReviewTab] = useState<
    "reading" | "listening" | "writing" | "speaking"
  >(getFirstAvailableSkill());
  const [playingAudio, setPlayingAudio] = useState<number | null>(null);
  const [activeReadingPart, setActiveReadingPart] = useState(0);
  const [activeListeningPart, setActiveListeningPart] = useState(0);
  const audioRefs = useRef<{ [key: number]: HTMLAudioElement | null }>({});

  // Debug logging for review mode
  if (isReviewMode) {
    console.log("Review Mode Data:", {
      reviewScoring,
      reviewQuestionResults,
      gradingInfo,
      reviewBand,
      writingEssays,
      examData,
    });
  }

  // IMPORTANT: examData must come from backend API, no fallback to mock
  const exam = examData;

  // Build answer key map from examData (correctAnswer from backend)
  const answerKeyMap = useMemo(() => {
    const map: Record<number, string> = {};
    if (!exam) return map;

    // Reading answers
    exam.reading?.forEach((passage) => {
      passage.groups.forEach((group) => {
        // Handle TABLE_COMPLETION groups
        if (
          group.groupType === "TABLE_COMPLETION" &&
          group.tableData?.questions
        ) {
          group.tableData.questions.forEach((tq) => {
            if (tq.correctAnswer) {
              map[tq.id] = tq.correctAnswer;
            }
          });
        } else {
          // Normal questions
          group.questions.forEach((q) => {
            if (q.correctAnswer) {
              map[q.id] = q.correctAnswer;
            }
          });
        }
      });
    });

    // Listening answers
    exam.listening?.forEach((section) => {
      section.groups.forEach((group) => {
        // Handle TABLE_COMPLETION groups
        if (
          group.groupType === "TABLE_COMPLETION" &&
          group.tableData?.questions
        ) {
          group.tableData.questions.forEach((tq) => {
            if (tq.correctAnswer) {
              map[tq.id] = tq.correctAnswer;
            }
          });
        } else {
          // Normal questions
          group.questions.forEach((q) => {
            if (q.correctAnswer) {
              map[q.id] = q.correctAnswer;
            }
          });
        }
      });
    });

    return map;
  }, [exam]);

  // Get all questions with their correct answers organized by skill
  const getReadingQuestions = () => {
    const questions: {
      id: number;
      displayNumber: number;
      partIndex: number;
      groupTitle: string;
      text: string;
      type: string;
      options?: string[];
      correctAnswer?: string;
      isTableQuestion?: boolean;
    }[] = [];
    exam?.reading?.forEach((passage, partIndex) => {
      passage.groups.forEach((group) => {
        // Handle TABLE_COMPLETION groups
        if (group.groupType === "TABLE_COMPLETION" && group.tableData) {
          group.tableData.questions?.forEach((tq) => {
            const displayNum = tq.number !== undefined ? tq.number : tq.id;
            questions.push({
              id: tq.id,
              displayNumber: displayNum,
              partIndex,
              groupTitle: group.title,
              text: `Table Question ${displayNum}`,
              type: "TABLE_COMPLETION",
              correctAnswer: tq.correctAnswer,
              isTableQuestion: true,
            });
          });
        } else {
          // Normal questions
          group.questions.forEach((q) => {
            const displayNum = q.number ? parseInt(q.number, 10) : q.id;
            questions.push({
              id: q.id,
              displayNumber: displayNum,
              partIndex,
              groupTitle: group.title,
              text: q.text,
              type: q.type,
              options: q.options,
              correctAnswer: q.correctAnswer,
            });
          });
        }
      });
    });
    return questions;
  };

  const getListeningQuestions = () => {
    const questions: {
      id: number;
      displayNumber: number;
      partIndex: number;
      groupTitle: string;
      text: string;
      type: string;
      options?: string[];
      correctAnswer?: string;
      isTableQuestion?: boolean;
    }[] = [];
    exam?.listening?.forEach((section, partIndex) => {
      section.groups.forEach((group) => {
        // Handle TABLE_COMPLETION groups
        if (group.groupType === "TABLE_COMPLETION" && group.tableData) {
          // Extract questions from tableData.questions if available
          group.tableData.questions?.forEach((tq) => {
            const displayNum = tq.number !== undefined ? tq.number : tq.id;
            questions.push({
              id: tq.id,
              displayNumber: displayNum,
              partIndex,
              groupTitle: group.title,
              text: `Table Question ${displayNum}`,
              type: "TABLE_COMPLETION",
              correctAnswer: tq.correctAnswer,
              isTableQuestion: true,
            });
          });
        } else {
          // Normal questions
          group.questions.forEach((q) => {
            const displayNum = q.number ? parseInt(q.number, 10) : q.id;
            questions.push({
              id: q.id,
              displayNumber: displayNum,
              partIndex,
              groupTitle: group.title,
              text: q.text,
              type: q.type,
              options: q.options,
              correctAnswer: q.correctAnswer,
            });
          });
        }
      });
    });
    return questions;
  };

  const readingQuestions = getReadingQuestions();
  const listeningQuestions = getListeningQuestions();

  // Calculate scores using answer keys from backend
  const calculateReadingScore = () => {
    let correct = 0;
    let total = 0;

    readingQuestions.forEach((q) => {
      if (q.correctAnswer) {
        total++;
        const userAns = (answers[q.id] || "").toString().trim().toLowerCase();
        const correctAns = q.correctAnswer.toString().trim().toLowerCase();
        if (userAns === correctAns) {
          correct++;
        }
      }
    });

    return { correct, total };
  };

  const calculateListeningScore = () => {
    let correct = 0;
    let total = 0;

    listeningQuestions.forEach((q) => {
      if (q.correctAnswer) {
        total++;
        const userAns = (answers[q.id] || "").toString().trim().toLowerCase();
        const correctAns = q.correctAnswer.toString().trim().toLowerCase();
        if (userAns === correctAns) {
          correct++;
        }
      }
    });

    return { correct, total };
  };

  // Use stored scoring from review mode if available, otherwise calculate
  const readingResult =
    isReviewMode && reviewScoring?.reading
      ? {
          correct: reviewScoring.reading.correct,
          total: reviewScoring.reading.total,
        }
      : calculateReadingScore();

  const listeningResult =
    isReviewMode && reviewScoring?.listening
      ? {
          correct: reviewScoring.listening.correct,
          total: reviewScoring.listening.total,
        }
      : calculateListeningScore();

  // Total objective score (Reading + Listening)
  const correctCount = readingResult.correct + listeningResult.correct;
  const totalQuestions = readingResult.total + listeningResult.total;
  const accuracy =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  // Word count function for writing stats display
  const countWords = (text: string): number => {
    if (!text) return 0;
    const trimmed = text.trim();
    if (!trimmed) return 0;
    const words = trimmed.match(/\S+/g);
    return words ? words.length : 0;
  };

  const task1Words = countWords(writingEssays[1] || "");
  const task2Words = countWords(writingEssays[2] || "");

  // Writing & Speaking scores are NOT calculated automatically
  // They require teacher grading - displayed as "Pending" in UI

  // Check if recordings exist for speaking
  const hasRecordings = Object.keys(speakingAudio).length > 0;

  // Handle audio playback
  const toggleAudioPlayback = (partId: number) => {
    const audio = audioRefs.current[partId];
    if (!audio) return;

    if (playingAudio === partId) {
      audio.pause();
      setPlayingAudio(null);
    } else {
      // Pause any currently playing audio
      if (playingAudio !== null && audioRefs.current[playingAudio]) {
        audioRefs.current[playingAudio]?.pause();
      }
      audio.play();
      setPlayingAudio(partId);
    }
  };

  // Handle back to overview (for review mode)
  const handleBackToOverview = () => {
    if (config?.backUrl) {
      window.location.href = config.backUrl;
    } else if (config?.wwwroot && config?.cmId) {
      window.location.href = `${config.wwwroot}/mod/ielts/view.php?id=${config.cmId}`;
    } else {
      window.history.back();
    }
  };

  // Handle go to dashboard (Moodle integration)
  const handleGoToDashboard = () => {
    if (config?.wwwroot) {
      window.location.href = `${config.wwwroot}/my/`;
    } else {
      message.info("Returning to dashboard...");
      window.location.href = "/";
    }
  };

  // Handle action buttons for each question
  const handleLocate = (questionId: number) => {
    message.info(`Locating answer for question ${questionId}...`);
  };

  const handleExplain = (questionId: number) => {
    message.info(`Loading explanation for question ${questionId}...`);
  };

  const handleReport = (questionId: number) => {
    message.info(`Report submitted for question ${questionId}`);
  };

  // Render Answer Keys section
  const renderAnswerKeys = (skill: "reading" | "listening") => {
    const questions =
      skill === "reading" ? readingQuestions : listeningQuestions;

    // Group questions by part
    const questionsByPart: { [key: number]: typeof questions } = {};
    questions.forEach((q) => {
      if (!questionsByPart[q.partIndex]) {
        questionsByPart[q.partIndex] = [];
      }
      questionsByPart[q.partIndex].push(q);
    });

    const parts = Object.keys(questionsByPart).map(Number);

    return (
      <div className={styles.answerKeysSection}>
        <div className={styles.sectionHeader}>
          <KeyOutlined className={styles.sectionIcon} />
          <h3>Answer Keys:</h3>
        </div>

        {parts.map((partIndex) => {
          const partQuestions = questionsByPart[partIndex];
          const firstQ = partQuestions[0]?.id || 1;
          const lastQ = partQuestions[partQuestions.length - 1]?.id || 1;

          return (
            <div key={partIndex} className={styles.answerKeyPart}>
              <div className={styles.partTitle}>
                Part {partIndex + 1}: Question {firstQ} - {lastQ}
              </div>
              <div className={styles.answerKeyGrid}>
                {partQuestions.map((q) => {
                  const userAns = answers[q.id] || "";
                  const correctAns =
                    q.correctAnswer || answerKeyMap[q.id] || "N/A";
                  const isCorrect =
                    userAns.toString().trim().toLowerCase() ===
                    correctAns.toString().trim().toLowerCase();

                  return (
                    <div key={q.id} className={styles.answerKeyItem}>
                      <span className={styles.answerKeyNumber}>{q.id}</span>
                      <span className={styles.answerKeyValue}>
                        {correctAns}
                      </span>
                      <span
                        className={`${styles.answerKeyStatus} ${
                          isCorrect ? styles.correct : styles.incorrect
                        }`}
                      >
                        {isCorrect ? "✓" : "✗"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render Reading Review with passage
  const renderReadingReview = () => {
    const passages = exam?.reading || [];
    const currentPassage = passages[activeReadingPart];

    if (!currentPassage) {
      return (
        <div className={styles.emptyState}>No reading passages available</div>
      );
    }

    const passageQuestions = readingQuestions.filter(
      (q) => q.partIndex === activeReadingPart,
    );

    return (
      <div className={styles.reviewWithPassage}>
        {/* Questions Panel */}
        <div className={styles.questionsPanel}>
          {currentPassage.groups.map((group) => {
            // Get questions from either tableData (for TABLE_COMPLETION) or regular questions
            const groupQuestions =
              group.groupType === "TABLE_COMPLETION" &&
              group.tableData?.questions
                ? group.tableData.questions.map((tq) => {
                    const displayNum =
                      tq.number !== undefined ? tq.number : tq.id;
                    return {
                      id: tq.id,
                      displayNumber: displayNum,
                      text: `Table Question ${displayNum}`,
                      type: "TABLE_COMPLETION" as const,
                      correctAnswer: tq.correctAnswer,
                      options: undefined,
                    };
                  })
                : group.questions.map((q) => {
                    const displayNum = q.number ? parseInt(q.number, 10) : q.id;
                    return {
                      ...q,
                      displayNumber: displayNum,
                    };
                  });

            return (
              <div key={group.id} className={styles.questionGroup}>
                <div className={styles.groupTitle}>{group.title}</div>
                <div className={styles.groupInstruction}>
                  {group.instruction}
                </div>

                {groupQuestions.map((q) => {
                  const userAns = answers[q.id] || "";
                  const correctAns =
                    q.correctAnswer || answerKeyMap[q.id] || "N/A";
                  const isCorrect =
                    userAns.toString().trim().toLowerCase() ===
                    correctAns.toString().trim().toLowerCase();

                  return (
                    <div key={q.id} className={styles.reviewQuestion}>
                      <div className={styles.questionRow}>
                        <span
                          className={`${styles.qNumber} ${
                            isCorrect ? styles.correct : styles.incorrect
                          }`}
                        >
                          {q.displayNumber}
                        </span>
                        {q.type === "MULTIPLE_CHOICE" && q.options && (
                          <select
                            className={styles.answerSelect}
                            value={userAns}
                            disabled
                          >
                            <option value="">Select</option>
                            {q.options.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        )}
                        <span
                          className={styles.questionText}
                          dangerouslySetInnerHTML={{ __html: q.text }}
                        />
                      </div>

                      <div className={styles.answerFeedback}>
                        <div className={styles.answerComparison}>
                          <span className={styles.yourAnswer}>
                            Your answer:{" "}
                            <strong>{userAns || "(no answer)"}</strong>
                          </span>
                          <span
                            className={`${styles.answerLabel} ${
                              isCorrect
                                ? styles.correctLabel
                                : styles.incorrectLabel
                            }`}
                          >
                            Correct: <strong>{correctAns}</strong>
                            {isCorrect ? " ✓" : " ✗"}
                          </span>
                        </div>

                        <div className={styles.actionBtns}>
                          <Tooltip title="Locate in passage">
                            <Button
                              size="small"
                              icon={<AimOutlined />}
                              onClick={() => handleLocate(q.id)}
                            >
                              Locate
                            </Button>
                          </Tooltip>
                          <Tooltip title="View explanation">
                            <Button
                              size="small"
                              icon={<CommentOutlined />}
                              onClick={() => handleExplain(q.id)}
                            >
                              Explain
                            </Button>
                          </Tooltip>
                          <Tooltip title="Report issue">
                            <Button
                              size="small"
                              icon={<WarningOutlined />}
                              onClick={() => handleReport(q.id)}
                              danger
                            >
                              Report
                            </Button>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Navigation */}
          <div className={styles.partNavigation}>
            <span className={styles.partLabel}>
              PART {activeReadingPart + 1}
            </span>
            <div className={styles.navButtons}>
              {activeReadingPart > 0 && (
                <Button
                  icon={<LeftOutlined />}
                  onClick={() => setActiveReadingPart(activeReadingPart - 1)}
                >
                  Previous
                </Button>
              )}
              {activeReadingPart < passages.length - 1 && (
                <Button
                  type="primary"
                  onClick={() => setActiveReadingPart(activeReadingPart + 1)}
                >
                  Next <RightOutlined />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Passage Panel */}
        <div className={styles.passagePanel}>
          <div className={styles.passageHeader}>
            <h3>Reading Passage {activeReadingPart + 1}</h3>
          </div>
          <div className={styles.passageInfo}>
            You should spend about 20 minutes on{" "}
            <strong>
              Questions {passageQuestions[0]?.id || 1} -{" "}
              {passageQuestions[passageQuestions.length - 1]?.id || 1}
            </strong>
            , which are based on Reading Passage {activeReadingPart + 1} below.
          </div>
          <div className={styles.passageContent}>
            <h4>{currentPassage.title}</h4>
            <div dangerouslySetInnerHTML={{ __html: currentPassage.content }} />
          </div>
        </div>
      </div>
    );
  };

  // Render Listening Review with audio
  const renderListeningReview = () => {
    const sections = exam?.listening || [];
    const currentSection = sections[activeListeningPart];

    if (!currentSection) {
      return (
        <div className={styles.emptyState}>No listening sections available</div>
      );
    }

    const sectionQuestions = listeningQuestions.filter(
      (q) => q.partIndex === activeListeningPart,
    );

    return (
      <div className={styles.reviewWithPassage}>
        {/* Questions Panel */}
        <div className={styles.questionsPanel}>
          {/* Audio Player */}
          <div className={styles.audioSection}>
            <div className={styles.audioTitle}>
              <SoundOutlined /> {currentSection.title}
            </div>
            <audio
              controls
              src={currentSection.audioUrl}
              className={styles.audioElement}
            />
          </div>

          {currentSection.groups.map((group) => {
            // Get questions from either tableData (for TABLE_COMPLETION) or regular questions
            const groupQuestions =
              group.groupType === "TABLE_COMPLETION" &&
              group.tableData?.questions
                ? group.tableData.questions.map((tq) => {
                    const displayNum =
                      tq.number !== undefined ? tq.number : tq.id;
                    return {
                      id: tq.id,
                      displayNumber: displayNum,
                      text: `Table Question ${displayNum}`,
                      type: "TABLE_COMPLETION" as const,
                      correctAnswer: tq.correctAnswer,
                      options: undefined,
                    };
                  })
                : group.questions.map((q) => {
                    const displayNum = q.number ? parseInt(q.number, 10) : q.id;
                    return {
                      ...q,
                      displayNumber: displayNum,
                    };
                  });

            return (
              <div key={group.id} className={styles.questionGroup}>
                <div className={styles.groupTitle}>{group.title}</div>
                <div className={styles.groupInstruction}>
                  {group.instruction}
                </div>

                {groupQuestions.map((q) => {
                  const userAns = answers[q.id] || "";
                  const correctAns =
                    q.correctAnswer || answerKeyMap[q.id] || "N/A";
                  const isCorrect =
                    userAns.toString().trim().toLowerCase() ===
                    correctAns.toString().trim().toLowerCase();

                  return (
                    <div key={q.id} className={styles.reviewQuestion}>
                      <div className={styles.questionRow}>
                        <span
                          className={`${styles.qNumber} ${
                            isCorrect ? styles.correct : styles.incorrect
                          }`}
                        >
                          {q.displayNumber}
                        </span>
                        <span
                          className={styles.questionText}
                          dangerouslySetInnerHTML={{ __html: q.text }}
                        />
                      </div>

                      <div className={styles.answerFeedback}>
                        <div className={styles.answerComparison}>
                          <span className={styles.yourAnswer}>
                            Your answer:{" "}
                            <strong>{userAns || "(no answer)"}</strong>
                          </span>
                          <span
                            className={`${styles.answerLabel} ${
                              isCorrect
                                ? styles.correctLabel
                                : styles.incorrectLabel
                            }`}
                          >
                            Correct: <strong>{correctAns}</strong>
                            {isCorrect ? " ✓" : " ✗"}
                          </span>
                        </div>

                        <div className={styles.actionBtns}>
                          <Tooltip title="Listen to section">
                            <Button
                              size="small"
                              icon={<SoundOutlined />}
                              onClick={() => handleLocate(q.id)}
                            >
                              Listen
                            </Button>
                          </Tooltip>
                          <Tooltip title="View explanation">
                            <Button
                              size="small"
                              icon={<CommentOutlined />}
                              onClick={() => handleExplain(q.id)}
                            >
                              Explain
                            </Button>
                          </Tooltip>
                          <Tooltip title="Report issue">
                            <Button
                              size="small"
                              icon={<WarningOutlined />}
                              onClick={() => handleReport(q.id)}
                              danger
                            >
                              Report
                            </Button>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Navigation */}
          <div className={styles.partNavigation}>
            <span className={styles.partLabel}>
              SECTION {activeListeningPart + 1}
            </span>
            <div className={styles.navButtons}>
              {activeListeningPart > 0 && (
                <Button
                  icon={<LeftOutlined />}
                  onClick={() =>
                    setActiveListeningPart(activeListeningPart - 1)
                  }
                >
                  Previous
                </Button>
              )}
              {activeListeningPart < sections.length - 1 && (
                <Button
                  type="primary"
                  onClick={() =>
                    setActiveListeningPart(activeListeningPart + 1)
                  }
                >
                  Next <RightOutlined />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Transcript Panel (Optional) */}
        <div className={styles.passagePanel}>
          <div className={styles.passageHeader}>
            <h3>Section {activeListeningPart + 1} - Audio Transcript</h3>
          </div>
          <div className={styles.passageInfo}>
            Listen to the audio and review your answers for{" "}
            <strong>
              Questions {sectionQuestions[0]?.id || 1} -{" "}
              {sectionQuestions[sectionQuestions.length - 1]?.id || 1}
            </strong>
            .
          </div>
          <div className={styles.transcriptPlaceholder}>
            <SoundOutlined
              style={{ fontSize: 48, opacity: 0.3, marginBottom: 16 }}
            />
            <p>Audio transcript will be available here after release.</p>
            <p>Click the audio player to listen again.</p>
          </div>
        </div>
      </div>
    );
  };

  // Render review content based on active tab
  const renderReviewContent = () => {
    switch (activeReviewTab) {
      case "reading":
        return (
          <>
            {renderAnswerKeys("reading")}
            <div className={styles.reviewExplanationsSection}>
              <div className={styles.sectionHeader}>
                <BookOutlined className={styles.sectionIcon} />
                <h3>Review & Explanations:</h3>
              </div>
              {renderReadingReview()}
            </div>
          </>
        );

      case "listening":
        return (
          <>
            {renderAnswerKeys("listening")}
            <div className={styles.reviewExplanationsSection}>
              <div className={styles.sectionHeader}>
                <SoundOutlined className={styles.sectionIcon} />
                <h3>Review & Explanations:</h3>
              </div>
              {renderListeningReview()}
            </div>
          </>
        );

      case "writing":
        return (
          <div>
            {[1, 2].map((taskId) => {
              const essay = writingEssays[taskId] || "";
              const wordCount = countWords(essay);
              const minWords = taskId === 1 ? 150 : 250;

              return (
                <div key={taskId} className={styles.writingReview}>
                  <div className={styles.writingTask}>
                    Writing Task {taskId}
                    {wordCount >= minWords && (
                      <CheckCircleOutlined
                        style={{ color: "#16a34a", marginLeft: 8 }}
                      />
                    )}
                  </div>
                  {essay ? (
                    <>
                      <div className={styles.writingContent}>
                        {essay.length > 500
                          ? essay.substring(0, 500) + "..."
                          : essay}
                      </div>
                      <div className={styles.writingStats}>
                        <span>Words: {wordCount}</span>
                        <span>Target: {minWords}+</span>
                        <span>
                          {wordCount >= minWords
                            ? "✓ Requirement met"
                            : `${minWords - wordCount} more needed`}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className={styles.emptyState}>
                      <FileTextOutlined className={styles.emptyIcon} />
                      <p>No response submitted</p>
                    </div>
                  )}
                </div>
              );
            })}
            {/* Teacher feedback for Writing */}
            {gradingInfo?.writing_feedback && (
              <div className={styles.teacherFeedback}>
                <div className={styles.feedbackHeader}>
                  <CommentOutlined style={{ marginRight: 8 }} />
                  Teacher Feedback
                  {gradingInfo.writing_band !== null && (
                    <span className={styles.feedbackBand}>
                      Band: {gradingInfo.writing_band.toFixed(1)}
                    </span>
                  )}
                </div>
                <div className={styles.feedbackContent}>
                  {gradingInfo.writing_feedback}
                </div>
              </div>
            )}
          </div>
        );

      case "speaking":
        return (
          <div>
            {[1, 2, 3].map((partId) => {
              // In review mode, check if we have audio URLs from server
              let audioUrl: string | null = null;
              let hasRecording = false;

              if (isReviewMode && reviewAttemptData) {
                // Try to get audio URL from review attempt data
                if (
                  reviewAttemptData.speakingAudio &&
                  reviewAttemptData.speakingAudio[partId]
                ) {
                  audioUrl = reviewAttemptData.speakingAudio[partId];
                  hasRecording = true;
                }
              } else {
                // Normal mode: use local audio blobs
                const audioBlob = speakingAudio[partId];
                if (audioBlob) {
                  audioUrl = URL.createObjectURL(audioBlob);
                  hasRecording = true;
                }
              }

              return (
                <div key={partId} className={styles.speakingReview}>
                  <div className={styles.speakingPart}>
                    Speaking Part {partId}
                    {hasRecording && (
                      <CheckCircleOutlined
                        style={{ color: "#16a34a", marginLeft: 8 }}
                      />
                    )}
                  </div>
                  {audioUrl ? (
                    <div className={styles.audioPlayer}>
                      <audio
                        ref={(el) => {
                          audioRefs.current[partId] = el;
                        }}
                        src={audioUrl}
                        onEnded={() => setPlayingAudio(null)}
                      />
                      <Button
                        type="primary"
                        shape="circle"
                        icon={
                          playingAudio === partId ? (
                            <PauseCircleOutlined />
                          ) : (
                            <PlayCircleOutlined />
                          )
                        }
                        onClick={() => toggleAudioPlayback(partId)}
                      />
                      <span>Click to play your recording</span>
                    </div>
                  ) : (
                    <div className={styles.noRecording}>
                      <AudioOutlined style={{ marginRight: 8 }} />
                      No recording submitted
                    </div>
                  )}
                </div>
              );
            })}
            {/* Teacher feedback for Speaking */}
            {gradingInfo?.speaking_feedback && (
              <div className={styles.teacherFeedback}>
                <div className={styles.feedbackHeader}>
                  <CommentOutlined style={{ marginRight: 8 }} />
                  Teacher Feedback
                  {gradingInfo.speaking_band !== null && (
                    <span className={styles.feedbackBand}>
                      Band: {gradingInfo.speaking_band.toFixed(1)}
                    </span>
                  )}
                </div>
                <div className={styles.feedbackContent}>
                  {gradingInfo.speaking_feedback}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.containerWrapper}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>
          <TrophyOutlined style={{ marginRight: 12 }} />
          Test Completed!
        </h1>
        <p className={styles.headerSubtitle}>
          {examData?.title || "IELTS Mock Test"} •{" "}
          {config?.fullName || `Candidate ID: ${config?.userId || "Demo User"}`}
        </p>
      </div>

      <div className={styles.container}>
        {/* Overall Score - Show correct/total instead of band */}
        <div className={styles.overallScoreSection}>
          <div className={styles.overallLabel}>Overall Score</div>
          <div className={styles.overallScore}>
            {correctCount}/{totalQuestions}
          </div>
          <div className={styles.overallDescription}>{accuracy}% Accuracy</div>
          <div style={{ fontSize: "12px", color: "#888", marginTop: "8px" }}>
            {hasSkillData(exam, "READING") || hasSkillData(exam, "LISTENING")
              ? "Reading & Listening (auto-graded)"
              : "Awaiting teacher grading"}
          </div>
          {(hasSkillData(exam, "WRITING") ||
            hasSkillData(exam, "SPEAKING")) && (
            <div
              style={{
                fontSize: "11px",
                color:
                  (gradingInfo?.writing_band !== null &&
                    gradingInfo?.writing_band !== undefined) ||
                  (gradingInfo?.speaking_band !== null &&
                    gradingInfo?.speaking_band !== undefined)
                    ? "#10b981"
                    : "#f59e0b",
                marginTop: "4px",
              }}
            >
              {(() => {
                const writingGraded =
                  gradingInfo?.writing_band !== null &&
                  gradingInfo?.writing_band !== undefined;
                const speakingGraded =
                  gradingInfo?.speaking_band !== null &&
                  gradingInfo?.speaking_band !== undefined;
                const hasWriting = hasSkillData(exam, "WRITING");
                const hasSpeaking = hasSkillData(exam, "SPEAKING");

                if (hasWriting && hasSpeaking) {
                  if (writingGraded && speakingGraded) {
                    return "✓ Writing & Speaking graded by teacher";
                  } else if (writingGraded) {
                    return "✓ Writing graded • Speaking pending";
                  } else if (speakingGraded) {
                    return "Writing pending • ✓ Speaking graded";
                  }
                  return "Writing & Speaking pending teacher review";
                } else if (hasWriting) {
                  return writingGraded
                    ? "✓ Writing graded by teacher"
                    : "Writing pending teacher review";
                } else if (hasSpeaking) {
                  return speakingGraded
                    ? "✓ Speaking graded by teacher"
                    : "Speaking pending teacher review";
                }
                return "";
              })()}
            </div>
          )}
        </div>

        {/* Skill Scores - Show correct/total only */}
        <div className={styles.skillScoresGrid}>
          {hasSkillData(exam, "READING") && (
            <div className={styles.skillCard}>
              <div className={`${styles.skillIcon} ${styles.reading}`}>
                <BookOutlined />
              </div>
              <div className={styles.skillName}>Reading</div>
              <div className={styles.skillScore}>
                {readingResult.correct}/{readingResult.total}
              </div>
              <div className={styles.skillDetails}>
                {readingResult.total > 0
                  ? Math.round(
                      (readingResult.correct / readingResult.total) * 100,
                    )
                  : 0}
                % correct
              </div>
            </div>
          )}

          {hasSkillData(exam, "LISTENING") && (
            <div className={styles.skillCard}>
              <div className={`${styles.skillIcon} ${styles.listening}`}>
                <SoundOutlined />
              </div>
              <div className={styles.skillName}>Listening</div>
              <div className={styles.skillScore}>
                {listeningResult.correct}/{listeningResult.total}
              </div>
              <div className={styles.skillDetails}>
                {listeningResult.total > 0
                  ? Math.round(
                      (listeningResult.correct / listeningResult.total) * 100,
                    )
                  : 0}
                % correct
              </div>
            </div>
          )}

          {hasSkillData(exam, "WRITING") && (
            <div className={styles.skillCard}>
              <div className={`${styles.skillIcon} ${styles.writing}`}>
                <EditOutlined />
              </div>
              <div className={styles.skillName}>Writing</div>
              {gradingInfo?.writing_band !== null &&
              gradingInfo?.writing_band !== undefined ? (
                <>
                  <div
                    className={styles.skillScore}
                    style={{ color: "#10b981" }}
                  >
                    {gradingInfo.writing_band.toFixed(1)}
                  </div>
                  <div className={styles.skillDetails}>
                    T1: {task1Words}w • T2: {task2Words}w
                  </div>
                  <div
                    className={styles.skillDetails}
                    style={{ fontSize: "11px", color: "#10b981" }}
                  >
                    ✓ Graded by teacher
                  </div>
                </>
              ) : (
                <>
                  <div
                    className={styles.skillScore}
                    style={{ fontSize: "18px", color: "#f59e0b" }}
                  >
                    Pending
                  </div>
                  <div className={styles.skillDetails}>
                    T1: {task1Words}w • T2: {task2Words}w
                  </div>
                  <div
                    className={styles.skillDetails}
                    style={{ fontSize: "11px", color: "#888" }}
                  >
                    Awaiting teacher grading
                  </div>
                </>
              )}
            </div>
          )}

          {hasSkillData(exam, "SPEAKING") && (
            <div className={styles.skillCard}>
              <div className={`${styles.skillIcon} ${styles.speaking}`}>
                <AudioOutlined />
              </div>
              <div className={styles.skillName}>Speaking</div>
              {gradingInfo?.speaking_band !== null &&
              gradingInfo?.speaking_band !== undefined ? (
                <>
                  <div
                    className={styles.skillScore}
                    style={{ color: "#10b981" }}
                  >
                    {gradingInfo.speaking_band.toFixed(1)}
                  </div>
                  <div className={styles.skillDetails}>
                    {hasRecordings
                      ? `${Object.keys(speakingAudio).length}/3 parts recorded`
                      : "Not recorded"}
                  </div>
                  <div
                    className={styles.skillDetails}
                    style={{ fontSize: "11px", color: "#10b981" }}
                  >
                    ✓ Graded by teacher
                  </div>
                </>
              ) : (
                <>
                  <div
                    className={styles.skillScore}
                    style={{ fontSize: "18px", color: "#f59e0b" }}
                  >
                    Pending
                  </div>
                  <div className={styles.skillDetails}>
                    {hasRecordings
                      ? `${Object.keys(speakingAudio).length}/3 parts recorded`
                      : "Not recorded"}
                  </div>
                  <div
                    className={styles.skillDetails}
                    style={{ fontSize: "11px", color: "#888" }}
                  >
                    Awaiting teacher grading
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Stats Row - Only show if there are objective questions */}
        {(hasSkillData(exam, "READING") || hasSkillData(exam, "LISTENING")) && (
          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.correct}`}>
                <CheckCircleOutlined />
              </div>
              <div className={styles.statInfo}>
                <div className={styles.statLabel}>Total Correct</div>
                <div className={styles.statValue}>
                  {correctCount}/{totalQuestions}
                </div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.time}`}>
                <ClockCircleOutlined />
              </div>
              <div className={styles.statInfo}>
                <div className={styles.statLabel}>Time Taken</div>
                <div className={styles.statValue}>
                  {formatTimeTaken(timeTaken)}
                </div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.accuracy}`}>
                <PercentageOutlined />
              </div>
              <div className={styles.statInfo}>
                <div className={styles.statLabel}>Accuracy</div>
                <div className={styles.statValue}>{accuracy}%</div>
              </div>
            </div>
          </div>
        )}

        {/* Review Section */}
        <div className={styles.reviewSection}>
          <div className={styles.reviewHeader}>
            <h2 className={styles.reviewTitle}>Detailed Review</h2>
            <div className={styles.reviewTabs}>
              {hasSkillData(exam, "READING") && (
                <button
                  className={`${styles.reviewTab} ${
                    activeReviewTab === "reading" ? styles.active : ""
                  }`}
                  onClick={() => setActiveReviewTab("reading")}
                >
                  <BookOutlined /> Reading
                </button>
              )}
              {hasSkillData(exam, "LISTENING") && (
                <button
                  className={`${styles.reviewTab} ${
                    activeReviewTab === "listening" ? styles.active : ""
                  }`}
                  onClick={() => setActiveReviewTab("listening")}
                >
                  <SoundOutlined /> Listening
                </button>
              )}
              {hasSkillData(exam, "WRITING") && (
                <button
                  className={`${styles.reviewTab} ${
                    activeReviewTab === "writing" ? styles.active : ""
                  }`}
                  onClick={() => setActiveReviewTab("writing")}
                >
                  <EditOutlined /> Writing
                </button>
              )}
              {hasSkillData(exam, "SPEAKING") && (
                <button
                  className={`${styles.reviewTab} ${
                    activeReviewTab === "speaking" ? styles.active : ""
                  }`}
                  onClick={() => setActiveReviewTab("speaking")}
                >
                  <AudioOutlined /> Speaking
                </button>
              )}
            </div>
          </div>

          {renderReviewContent()}
        </div>

        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          {isReviewMode ? (
            <Button
              type="primary"
              size="large"
              icon={<LeftOutlined />}
              onClick={handleBackToOverview}
              className={`${styles.actionButton} ${styles.primaryButton}`}
            >
              Back to Overview
            </Button>
          ) : (
            <>
              <Button
                size="large"
                icon={<LeftOutlined />}
                onClick={handleBackToOverview}
                className={`${styles.actionButton} ${styles.secondaryButton}`}
              >
                Back to Test
              </Button>
              <Button
                type="primary"
                size="large"
                icon={<HomeOutlined />}
                onClick={handleGoToDashboard}
                className={`${styles.actionButton} ${styles.primaryButton}`}
              >
                Back to Dashboard
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultPage;
