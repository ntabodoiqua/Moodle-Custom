import { useState, useEffect, useRef, useMemo } from "react";
import { Slider, Button, Empty } from "antd";
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  SoundOutlined,
} from "@ant-design/icons";
import { useExamStore } from "../store/examStore";
import QuestionRenderer from "./QuestionRenderer";
import TableQuestion, {
  extractTableQuestionIds,
  extractTableQuestionInfo,
} from "./TableQuestion";
import type { QuestionInfo } from "./TableQuestion";
import styles from "./ListeningTest.module.css";

interface ListeningTestProps {
  answers: { [key: number]: string };
  onAnswerChange: (questionId: number, value: string) => void;
}

const ListeningTest = ({ answers, onAnswerChange }: ListeningTestProps) => {
  const { examData } = useExamStore();
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Get listening sections from examData
  const sections = useMemo(() => examData?.listening || [], [examData]);

  // Get current section
  const currentSection = sections[currentSectionIndex];

  // Get all question info for current section (including table questions)
  // This stores both the actual ID (for storing answers) and display number (for showing in UI)
  const currentQuestionInfo = useMemo(() => {
    if (!currentSection) return [];
    const questions: QuestionInfo[] = [];
    currentSection.groups.forEach((group) => {
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
  }, [currentSection]);

  // Reset state when component mounts or examData changes
  useEffect(() => {
    setCurrentSectionIndex(0);
  }, [examData]);

  // Function to scroll to a specific question
  const scrollToQuestion = (questionId: number) => {
    const element = document.getElementById(`listening-question-${questionId}`);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  // Audio controls
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSliderChange = (value: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value;
      setCurrentTime(value);
    }
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value);
    if (audioRef.current) {
      audioRef.current.volume = value / 100;
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  if (!examData || sections.length === 0) {
    return (
      <div className={styles.containerWrapper}>
        <div className={styles.emptyState}>
          <Empty description="No listening sections available" />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.containerWrapper}>
      <div className={styles.container}>
        {/* Left Panel - Audio Player & Instructions */}
        <div className={styles.audioPanel}>
          <div className={styles.sectionHeader}>
            SECTION {currentSectionIndex + 1}
          </div>
          <h1 className={styles.sectionTitle}>{currentSection?.title}</h1>
          <p className={styles.sectionDescription}>
            {currentSection?.instruction ||
              "Listen carefully and answer the questions."}
          </p>

          {/* Audio Player */}
          <div className={styles.audioPlayer}>
            <audio
              ref={audioRef}
              src={currentSection?.audioUrl}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
            />

            <div className={styles.playerControls}>
              <Button
                type="primary"
                shape="circle"
                size="large"
                icon={
                  isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />
                }
                onClick={togglePlay}
                className={styles.playButton}
              />

              <div className={styles.progressSection}>
                <span className={styles.timeDisplay}>
                  {formatTime(currentTime)}
                </span>
                <Slider
                  className={styles.progressSlider}
                  value={currentTime}
                  max={duration || 100}
                  onChange={handleSliderChange}
                  tooltip={{ formatter: (val) => formatTime(val || 0) }}
                />
                <span className={styles.timeDisplay}>
                  {formatTime(duration)}
                </span>
              </div>

              <div className={styles.volumeSection}>
                <SoundOutlined className={styles.volumeIcon} />
                <Slider
                  className={styles.volumeSlider}
                  value={volume}
                  onChange={handleVolumeChange}
                />
              </div>
            </div>

            <div className={styles.audioInstructions}>
              <div className={styles.instructionBox}>
                <h4>Instructions:</h4>
                <ul>
                  <li>You will hear the recording ONCE only.</li>
                  <li>Answer the questions as you listen.</li>
                  <li>You will have time to check your answers.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section Tabs */}
          <div className={styles.sectionTabs}>
            {sections.map((_, index) => (
              <button
                key={index}
                className={`${styles.sectionTab} ${
                  index === currentSectionIndex ? styles.activeTab : ""
                }`}
                onClick={() => setCurrentSectionIndex(index)}
              >
                Section {index + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Right Panel - Questions */}
        <div className={styles.questionsPanel}>
          {currentSection?.groups.map((group) => (
            <div key={group.id} className={styles.questionSection}>
              <h3 className={styles.questionSectionTitle}>{group.title}</h3>

              {/* Render instruction only for non-table groups or custom instruction */}
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
                  questionIdPrefix="listening-question-"
                />
              ) : (
                /* Render normal questions */
                group.questions.map((question) => (
                  <div
                    key={question.id}
                    id={`listening-question-${question.id}`}
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

      {/* Question Navigation - Fixed at bottom */}
      <div className={styles.questionNavigation}>
        <div className={styles.sectionTabs}>
          {sections.map((_, index) => (
            <button
              key={index}
              className={`${styles.sectionTab} ${
                index === currentSectionIndex ? styles.activeTab : ""
              }`}
              onClick={() => setCurrentSectionIndex(index)}
            >
              Section {index + 1}
            </button>
          ))}
        </div>

        <div className={styles.questionButtons}>
          {currentQuestionInfo.map((qInfo) => (
            <button
              key={qInfo.id}
              className={`${styles.questionButton} ${
                answers[qInfo.id] ? styles.completed : ""
              }`}
              onClick={() => scrollToQuestion(qInfo.id)}
            >
              {qInfo.displayNumber}
            </button>
          ))}
        </div>

        <div className={styles.progressInfo}>
          {sections.map((section, index) => {
            if (index === currentSectionIndex) return null;
            const sectionQuestionIds: number[] = [];
            section.groups.forEach((g) => {
              // Handle TABLE_COMPLETION groups
              if (g.groupType === "TABLE_COMPLETION" && g.tableData) {
                const tableIds = extractTableQuestionIds(g.tableData);
                sectionQuestionIds.push(...tableIds);
              } else {
                // Normal questions
                g.questions.forEach((q) => sectionQuestionIds.push(q.id));
              }
            });
            const answered = sectionQuestionIds.filter(
              (id) => answers[id],
            ).length;
            return (
              <div key={index} className={styles.progressItem}>
                <strong>Section {index + 1}:</strong> {answered} of{" "}
                {sectionQuestionIds.length} questions
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ListeningTest;
