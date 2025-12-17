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
  ReloadOutlined,
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
import { getAvailableSkills, hasSkillData } from "../types";

interface ResultPageProps {
  config?: MoodleConfig;
}

const ResultPage = ({ config }: ResultPageProps) => {
  const { answers, writingEssays, speakingAudio, examData } = useExamStore();

  // Determine first available skill for default tab
  const getFirstAvailableSkill = ():
    | "reading"
    | "listening"
    | "writing"
    | "speaking" => {
    if (examData?.reading?.length) return "reading";
    if (examData?.listening?.length) return "listening";
    if (examData?.writing?.length) return "writing";
    if (examData?.speaking?.length) return "speaking";
    return "reading"; // Fallback
  };

  const [activeReviewTab, setActiveReviewTab] = useState<
    "reading" | "listening" | "writing" | "speaking"
  >(getFirstAvailableSkill());
  const [playingAudio, setPlayingAudio] = useState<number | null>(null);
  const [activeReadingPart, setActiveReadingPart] = useState(0);
  const [activeListeningPart, setActiveListeningPart] = useState(0);
  const audioRefs = useRef<{ [key: number]: HTMLAudioElement | null }>({});

  // IMPORTANT: examData must come from backend API, no fallback to mock
  const exam = examData;

  // Build answer key map from examData (correctAnswer from backend)
  const answerKeyMap = useMemo(() => {
    const map: Record<number, string> = {};
    if (!exam) return map;

    // Reading answers
    exam.reading?.forEach((passage) => {
      passage.groups.forEach((group) => {
        group.questions.forEach((q) => {
          if (q.correctAnswer) {
            map[q.id] = q.correctAnswer;
          }
        });
      });
    });

    // Listening answers
    exam.listening?.forEach((section) => {
      section.groups.forEach((group) => {
        group.questions.forEach((q) => {
          if (q.correctAnswer) {
            map[q.id] = q.correctAnswer;
          }
        });
      });
    });

    return map;
  }, [exam]);

  // Get all questions with their correct answers organized by skill
  const getReadingQuestions = () => {
    const questions: {
      id: number;
      partIndex: number;
      groupTitle: string;
      text: string;
      type: string;
      options?: string[];
      correctAnswer?: string;
    }[] = [];
    exam?.reading?.forEach((passage, partIndex) => {
      passage.groups.forEach((group) => {
        group.questions.forEach((q) => {
          questions.push({
            id: q.id,
            partIndex,
            groupTitle: group.title,
            text: q.text,
            type: q.type,
            options: q.options,
            correctAnswer: q.correctAnswer,
          });
        });
      });
    });
    return questions;
  };

  const getListeningQuestions = () => {
    const questions: {
      id: number;
      partIndex: number;
      groupTitle: string;
      text: string;
      type: string;
      options?: string[];
      correctAnswer?: string;
    }[] = [];
    exam?.listening?.forEach((section, partIndex) => {
      section.groups.forEach((group) => {
        group.questions.forEach((q) => {
          questions.push({
            id: q.id,
            partIndex,
            groupTitle: group.title,
            text: q.text,
            type: q.type,
            options: q.options,
            correctAnswer: q.correctAnswer,
          });
        });
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

  const readingResult = calculateReadingScore();
  const listeningResult = calculateListeningScore();

  // Total objective score (Reading + Listening)
  const correctCount = readingResult.correct + listeningResult.correct;
  const totalQuestions = readingResult.total + listeningResult.total;
  const accuracy =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  // IELTS Official Band Score Conversion Tables (Academic)
  // Based on official IELTS scoring: https://www.ielts.org/
  const convertToReadingBand = (rawScore: number): number => {
    // IELTS Academic Reading: 40 questions
    // This is the official conversion table
    if (rawScore >= 39) return 9.0;
    if (rawScore >= 37) return 8.5;
    if (rawScore >= 35) return 8.0;
    if (rawScore >= 33) return 7.5;
    if (rawScore >= 30) return 7.0;
    if (rawScore >= 27) return 6.5;
    if (rawScore >= 23) return 6.0;
    if (rawScore >= 19) return 5.5;
    if (rawScore >= 15) return 5.0;
    if (rawScore >= 13) return 4.5;
    if (rawScore >= 10) return 4.0;
    if (rawScore >= 8) return 3.5;
    if (rawScore >= 6) return 3.0;
    if (rawScore >= 4) return 2.5;
    return 2.0;
  };

  const convertToListeningBand = (rawScore: number): number => {
    // IELTS Listening: 40 questions
    // This is the official conversion table
    if (rawScore >= 39) return 9.0;
    if (rawScore >= 37) return 8.5;
    if (rawScore >= 35) return 8.0;
    if (rawScore >= 32) return 7.5;
    if (rawScore >= 30) return 7.0;
    if (rawScore >= 26) return 6.5;
    if (rawScore >= 23) return 6.0;
    if (rawScore >= 18) return 5.5;
    if (rawScore >= 16) return 5.0;
    if (rawScore >= 13) return 4.5;
    if (rawScore >= 10) return 4.0;
    if (rawScore >= 8) return 3.5;
    if (rawScore >= 6) return 3.0;
    if (rawScore >= 4) return 2.5;
    return 2.0;
  };

  // Get available skills for this exam
  const availableSkills = useMemo(() => getAvailableSkills(exam), [exam]);

  // Calculate band scores only for available skills
  const readingScore = hasSkillData(exam, "READING")
    ? convertToReadingBand(readingResult.correct)
    : null;
  const listeningScore = hasSkillData(exam, "LISTENING")
    ? convertToListeningBand(listeningResult.correct)
    : null;

  // Writing score (based on word count achievement - simplified)
  const countWords = (text: string): number => {
    if (!text) return 0;
    const trimmed = text.trim();
    if (!trimmed) return 0;
    const words = trimmed.match(/\S+/g);
    return words ? words.length : 0;
  };

  const task1Words = countWords(writingEssays[1] || "");
  const task2Words = countWords(writingEssays[2] || "");
  const writingScore = hasSkillData(exam, "WRITING")
    ? task1Words >= 150 && task2Words >= 250
      ? 7.0
      : task1Words >= 100 && task2Words >= 200
      ? 6.0
      : 5.0
    : null;

  // Speaking score (based on recording presence - simplified)
  const hasRecordings = Object.keys(speakingAudio).length > 0;
  const speakingScore = hasSkillData(exam, "SPEAKING")
    ? hasRecordings
      ? 6.5
      : 0
    : null;

  // Calculate overall band score dynamically based on available skills
  const calculateOverallScore = (): string => {
    const scores: number[] = [];
    if (readingScore !== null) scores.push(readingScore);
    if (listeningScore !== null) scores.push(listeningScore);
    if (writingScore !== null) scores.push(writingScore);
    if (speakingScore !== null) scores.push(speakingScore);

    if (scores.length === 0) return "0.0";

    const sum = scores.reduce((acc, score) => acc + score, 0);
    const average = sum / scores.length;

    // Round to nearest 0.5 (IELTS standard)
    const rounded = Math.round(average * 2) / 2;
    return rounded.toFixed(1);
  };

  const overallScore = calculateOverallScore();

  // Get band description
  const getBandDescription = (score: number): string => {
    if (score >= 8.5) return "Expert User";
    if (score >= 7.5) return "Very Good User";
    if (score >= 6.5) return "Good User";
    if (score >= 5.5) return "Competent User";
    if (score >= 4.5) return "Modest User";
    return "Limited User";
  };

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

  // Handle retake
  const handleRetake = () => {
    window.location.reload();
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
      (q) => q.partIndex === activeReadingPart
    );

    return (
      <div className={styles.reviewWithPassage}>
        {/* Questions Panel */}
        <div className={styles.questionsPanel}>
          {currentPassage.groups.map((group) => (
            <div key={group.id} className={styles.questionGroup}>
              <div className={styles.groupTitle}>{group.title}</div>
              <div className={styles.groupInstruction}>{group.instruction}</div>

              {group.questions.map((q) => {
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
                        {q.id}
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
                      <span
                        className={`${styles.answerLabel} ${
                          isCorrect
                            ? styles.correctLabel
                            : styles.incorrectLabel
                        }`}
                      >
                        {q.id} Answer: <strong>{correctAns}</strong>
                      </span>

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
          ))}

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
      (q) => q.partIndex === activeListeningPart
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

          {currentSection.groups.map((group) => (
            <div key={group.id} className={styles.questionGroup}>
              <div className={styles.groupTitle}>{group.title}</div>
              <div className={styles.groupInstruction}>{group.instruction}</div>

              {group.questions.map((q) => {
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
                        {q.id}
                      </span>
                      <span
                        className={styles.questionText}
                        dangerouslySetInnerHTML={{ __html: q.text }}
                      />
                    </div>

                    <div className={styles.answerFeedback}>
                      <span
                        className={`${styles.answerLabel} ${
                          isCorrect
                            ? styles.correctLabel
                            : styles.incorrectLabel
                        }`}
                      >
                        {q.id} Answer: <strong>{correctAns}</strong>
                      </span>
                      {userAns && !isCorrect && (
                        <span className={styles.yourAnswer}>
                          Your answer: <strong>{userAns}</strong>
                        </span>
                      )}

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
          ))}

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
          </div>
        );

      case "speaking":
        return (
          <div>
            {[1, 2, 3].map((partId) => {
              const audioBlob = speakingAudio[partId];
              const audioUrl = audioBlob
                ? URL.createObjectURL(audioBlob)
                : null;

              return (
                <div key={partId} className={styles.speakingReview}>
                  <div className={styles.speakingPart}>
                    Speaking Part {partId}
                    {audioBlob && (
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
        {/* Overall Score */}
        <div className={styles.overallScoreSection}>
          <div className={styles.overallLabel}>Overall Band Score</div>
          <div className={styles.overallScore}>{overallScore}</div>
          <div className={styles.overallDescription}>
            {getBandDescription(parseFloat(overallScore))}
          </div>
          <div style={{ fontSize: "12px", color: "#888", marginTop: "8px" }}>
            Based on {availableSkills.length} skill(s):{" "}
            {availableSkills.join(", ")}
          </div>
        </div>

        {/* Skill Scores - Only show available skills */}
        <div className={styles.skillScoresGrid}>
          {hasSkillData(exam, "READING") && (
            <div className={styles.skillCard}>
              <div className={`${styles.skillIcon} ${styles.reading}`}>
                <BookOutlined />
              </div>
              <div className={styles.skillName}>Reading</div>
              <div className={styles.skillScore}>
                {readingScore?.toFixed(1) ?? "-"}
              </div>
              <div className={styles.skillDetails}>
                {readingResult.correct}/{readingResult.total} correct
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
                {listeningScore?.toFixed(1) ?? "-"}
              </div>
              <div className={styles.skillDetails}>
                {listeningResult.correct}/{listeningResult.total} correct
              </div>
            </div>
          )}

          {hasSkillData(exam, "WRITING") && (
            <div className={styles.skillCard}>
              <div className={`${styles.skillIcon} ${styles.writing}`}>
                <EditOutlined />
              </div>
              <div className={styles.skillName}>Writing</div>
              <div className={styles.skillScore}>
                {writingScore?.toFixed(1) ?? "-"}
              </div>
              <div className={styles.skillDetails}>
                T1: {task1Words}w • T2: {task2Words}w
              </div>
            </div>
          )}

          {hasSkillData(exam, "SPEAKING") && (
            <div className={styles.skillCard}>
              <div className={`${styles.skillIcon} ${styles.speaking}`}>
                <AudioOutlined />
              </div>
              <div className={styles.skillName}>Speaking</div>
              <div className={styles.skillScore}>
                {speakingScore !== null && speakingScore > 0
                  ? speakingScore.toFixed(1)
                  : "-"}
              </div>
              <div className={styles.skillDetails}>
                {hasRecordings
                  ? `${Object.keys(speakingAudio).length}/3 parts`
                  : "Not recorded"}
              </div>
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
                <div className={styles.statValue}>~60 min</div>
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
          <Button
            size="large"
            icon={<ReloadOutlined />}
            onClick={handleRetake}
            className={`${styles.actionButton} ${styles.secondaryButton}`}
          >
            Retake Test
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
        </div>
      </div>
    </div>
  );
};

export default ResultPage;
