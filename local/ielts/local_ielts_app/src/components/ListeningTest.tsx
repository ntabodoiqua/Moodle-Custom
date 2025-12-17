import { useState, useEffect, useRef } from "react";
import { Select, Slider, Button } from "antd";
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  SoundOutlined,
} from "@ant-design/icons";
import styles from "./ListeningTest.module.css";

interface Question {
  id: number;
  type: "dropdown" | "input";
  text: string;
  options?: string[];
}

interface ListeningTestProps {
  answers: { [key: number]: string };
  onAnswerChange: (questionId: number, value: string) => void;
}

const ListeningTest = ({ answers, onAnswerChange }: ListeningTestProps) => {
  const [currentSection, setCurrentSection] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Reset state when component mounts
  useEffect(() => {
    setCurrentSection(1);
    setCurrentQuestion(1);
  }, []);

  // Function to scroll to a specific question
  const scrollToQuestion = (questionId: number) => {
    const element = document.getElementById(`listening-question-${questionId}`);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      setCurrentQuestion(questionId);
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

  // Mock data - sẽ thay bằng data thật từ API
  const sections = [
    {
      id: 1,
      title: "Section 1",
      description:
        "A conversation between two people set in an everyday social context",
      audioUrl: "/audio/section1.mp3",
      questionGroups: [
        {
          title: "Questions 1-5",
          instruction:
            "Complete the form below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
          questions: [
            { id: 1, type: "input" as const, text: "Name: Sarah _______" },
            { id: 2, type: "input" as const, text: "Phone number: _______" },
            { id: 3, type: "input" as const, text: "Address: _______ Street" },
            { id: 4, type: "input" as const, text: "Postcode: _______" },
            { id: 5, type: "input" as const, text: "Email: sarah@_______" },
          ],
        },
        {
          title: "Questions 6-10",
          instruction: "Choose the correct letter, A, B or C.",
          questions: [
            {
              id: 6,
              type: "dropdown" as const,
              text: "What time does the tour start?",
              options: ["A. 9:00 AM", "B. 10:00 AM", "C. 11:00 AM"],
            },
            {
              id: 7,
              type: "dropdown" as const,
              text: "How long does the tour take?",
              options: ["A. 1 hour", "B. 2 hours", "C. 3 hours"],
            },
            {
              id: 8,
              type: "dropdown" as const,
              text: "What is the cost per person?",
              options: ["A. $15", "B. $20", "C. $25"],
            },
            {
              id: 9,
              type: "dropdown" as const,
              text: "What should visitors bring?",
              options: ["A. Camera", "B. Water bottle", "C. Both A and B"],
            },
            {
              id: 10,
              type: "dropdown" as const,
              text: "Where do they meet?",
              options: ["A. Main entrance", "B. Café", "C. Gift shop"],
            },
          ],
        },
      ],
    },
  ];

  const currentSectionData = sections.find((s) => s.id === currentSection);
  const allQuestions: Question[] =
    currentSectionData?.questionGroups.flatMap(
      (g): Question[] => g.questions
    ) || [];

  return (
    <div className={styles.containerWrapper}>
      <div className={styles.container}>
        {/* Left Panel - Audio Player & Instructions */}
        <div className={styles.audioPanel}>
          <div className={styles.sectionHeader}>SECTION {currentSection}</div>
          <h1 className={styles.sectionTitle}>{currentSectionData?.title}</h1>
          <p className={styles.sectionDescription}>
            {currentSectionData?.description}
          </p>

          {/* Audio Player */}
          <div className={styles.audioPlayer}>
            <audio
              ref={audioRef}
              src={currentSectionData?.audioUrl}
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
            {[1, 2, 3, 4].map((section) => (
              <button
                key={section}
                className={`${styles.sectionTab} ${
                  section === currentSection ? styles.activeTab : ""
                }`}
                onClick={() => setCurrentSection(section)}
              >
                Section {section}
              </button>
            ))}
          </div>
        </div>

        {/* Right Panel - Questions */}
        <div className={styles.questionsPanel}>
          {currentSectionData?.questionGroups.map((group, groupIndex) => (
            <div key={groupIndex} className={styles.questionSection}>
              <h3 className={styles.questionSectionTitle}>{group.title}</h3>

              {group.instruction && (
                <div className={styles.questionInstruction}>
                  {group.instruction}
                </div>
              )}

              {group.questions.map((question) => (
                <div
                  key={question.id}
                  id={`listening-question-${question.id}`}
                  className={styles.question}
                >
                  <div className={styles.questionNumber}>{question.id}.</div>
                  <div className={styles.questionContent}>
                    <div className={styles.questionText}>{question.text}</div>

                    {question.type === "dropdown" && question.options ? (
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

      {/* Question Navigation - Fixed at bottom */}
      <div className={styles.questionNavigation}>
        <span className={styles.sectionLabel}>Section {currentSection}</span>
        <div className={styles.questionButtons}>
          {allQuestions.map((q) => (
            <button
              key={q.id}
              className={`${styles.questionButton} ${
                q.id === currentQuestion ? styles.active : ""
              } ${answers[q.id] ? styles.completed : ""}`}
              onClick={() => scrollToQuestion(q.id)}
            >
              {q.id}
            </button>
          ))}
        </div>

        <div className={styles.progressInfo}>
          <div className={styles.progressItem}>
            <strong>Section 2:</strong> 0 of 10 questions
          </div>
          <div className={styles.progressItem}>
            <strong>Section 3:</strong> 0 of 10 questions
          </div>
          <div className={styles.progressItem}>
            <strong>Section 4:</strong> 0 of 10 questions
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListeningTest;
