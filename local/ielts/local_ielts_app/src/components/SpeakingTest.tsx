import { useState, useEffect, useRef, useCallback } from "react";
import { Button, Progress, Modal, message, Tabs } from "antd";
import {
  AudioOutlined,
  PauseOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import styles from "./SpeakingTest.module.css";

interface SpeakingPart {
  id: number;
  partNumber: 1 | 2 | 3;
  title: string;
  description: string;
  questions: string[];
  preparationTime?: number; // For Part 2
  speakingTime: number;
}

interface SpeakingTestProps {
  recordings: { [partId: number]: Blob };
  onRecordingChange: (partId: number, audioBlob: Blob) => void;
}

const SpeakingTest = ({ recordings, onRecordingChange }: SpeakingTestProps) => {
  const [activePart, setActivePart] = useState("1");
  const [isRecording, setIsRecording] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [prepTime, setPrepTime] = useState(0);
  const [recordTime, setRecordTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);

  // Mock data - sẽ thay bằng data thật từ API
  const parts: SpeakingPart[] = [
    {
      id: 1,
      partNumber: 1,
      title: "Part 1: Introduction & Interview",
      description:
        "The examiner will ask you general questions about yourself and a range of familiar topics.",
      questions: [
        "What is your full name?",
        "Where are you from?",
        "Do you work or study?",
        "What do you like about your job/studies?",
        "Let's talk about your hometown. What's special about it?",
        "Is there anything you would like to change about your hometown?",
      ],
      speakingTime: 300, // 5 minutes
    },
    {
      id: 2,
      partNumber: 2,
      title: "Part 2: Long Turn (Cue Card)",
      description:
        "You will be given a topic card. You have 1 minute to prepare, then speak for 1-2 minutes.",
      questions: [
        "Describe a place you have visited that you particularly liked.",
        "",
        "You should say:",
        "• where it was",
        "• when you went there",
        "• what you did there",
        "• and explain why you liked it so much",
      ],
      preparationTime: 60, // 1 minute prep
      speakingTime: 120, // 2 minutes
    },
    {
      id: 3,
      partNumber: 3,
      title: "Part 3: Discussion",
      description:
        "The examiner will ask further questions connected to the topic in Part 2.",
      questions: [
        "What types of places are popular for tourists in your country?",
        "Do you think tourism has a positive or negative impact on local communities?",
        "How do you think tourism will change in the future?",
        "What can be done to make tourism more sustainable?",
        "Do you think virtual tourism could replace real travel?",
      ],
      speakingTime: 300, // 5 minutes
    },
  ];

  const currentPart =
    parts.find((p) => p.id === parseInt(activePart)) || parts[0];

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  // Reset when changing parts
  useEffect(() => {
    stopRecording();
    setAudioUrl(null);
    setPrepTime(0);
    setRecordTime(0);
    setIsPreparing(false);

    // Check if there's existing recording
    const existingRecording = recordings[currentPart.id];
    if (existingRecording) {
      const url = URL.createObjectURL(existingRecording);
      setAudioUrl(url);
    }
  }, [activePart, currentPart.id, recordings]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Preparation timer (for Part 2)
  const startPreparation = useCallback(() => {
    if (!currentPart.preparationTime) {
      startRecording();
      return;
    }

    setIsPreparing(true);
    setPrepTime(currentPart.preparationTime);

    timerRef.current = setInterval(() => {
      setPrepTime((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setIsPreparing(false);
          message.info("Preparation time is over. Please start speaking.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [currentPart.preparationTime]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        onRecordingChange(currentPart.id, audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordTime(0);

      // Recording timer
      timerRef.current = setInterval(() => {
        setRecordTime((prev) => {
          if (prev >= currentPart.speakingTime) {
            stopRecording();
            message.warning("Maximum speaking time reached.");
            return currentPart.speakingTime;
          }
          return prev + 1;
        });
      }, 1000);

      message.success("Recording started!");
    } catch (error) {
      console.error("Error accessing microphone:", error);
      Modal.error({
        title: "Microphone Access Denied",
        content:
          "Please allow microphone access to record your speaking response.",
      });
    }
  }, [currentPart.id, currentPart.speakingTime, onRecordingChange]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      message.success("Recording saved!");
    }
  }, [isRecording]);

  // Play/Pause recorded audio
  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Re-record
  const handleReRecord = () => {
    Modal.confirm({
      title: "Re-record this part?",
      content: "Your current recording will be deleted. Are you sure?",
      icon: <ExclamationCircleOutlined />,
      onOk: () => {
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
        setRecordTime(0);
        if (currentPart.preparationTime) {
          startPreparation();
        } else {
          startRecording();
        }
      },
    });
  };

  const recordingProgress = (recordTime / currentPart.speakingTime) * 100;

  return (
    <div className={styles.containerWrapper}>
      <div className={styles.container}>
        {/* Left Panel - Part Instructions */}
        <div className={styles.instructionPanel}>
          <div className={styles.partHeader}>
            <span className={styles.partBadge}>
              PART {currentPart.partNumber}
            </span>
          </div>
          <h1 className={styles.partTitle}>{currentPart.title}</h1>
          <p className={styles.partDescription}>{currentPart.description}</p>

          {/* Questions/Prompts */}
          <div className={styles.questionCard}>
            <h3 className={styles.questionCardTitle}>
              {currentPart.partNumber === 2 ? "Cue Card" : "Sample Questions"}
            </h3>
            <div className={styles.questionList}>
              {currentPart.questions.map((question, index) => (
                <div
                  key={index}
                  className={`${styles.questionItem} ${
                    question.startsWith("•") ? styles.bulletPoint : ""
                  }`}
                >
                  {!question.startsWith("•") &&
                    !question.startsWith("You should") &&
                    question && (
                      <span className={styles.questionNumber}>
                        {index + 1}.
                      </span>
                    )}
                  <span>{question}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Speaking Tips */}
          <div className={styles.tipsBox}>
            <h4>Speaking Tips</h4>
            <ul>
              {currentPart.partNumber === 1 && (
                <>
                  <li>Speak naturally and don't memorize answers</li>
                  <li>Give extended answers, not just yes/no</li>
                  <li>Use a variety of vocabulary and structures</li>
                </>
              )}
              {currentPart.partNumber === 2 && (
                <>
                  <li>Use the preparation time to make notes</li>
                  <li>Cover all the bullet points</li>
                  <li>Speak for the full 2 minutes if possible</li>
                </>
              )}
              {currentPart.partNumber === 3 && (
                <>
                  <li>Give your opinion clearly</li>
                  <li>Support your ideas with examples</li>
                  <li>Discuss different perspectives</li>
                </>
              )}
            </ul>
          </div>

          {/* Part Tabs */}
          <div className={styles.partTabs}>
            <Tabs
              activeKey={activePart}
              onChange={setActivePart}
              items={parts.map((part) => ({
                key: part.id.toString(),
                label: (
                  <span className={styles.tabLabel}>
                    {recordings[part.id] && (
                      <CheckCircleOutlined style={{ color: "#10b981" }} />
                    )}
                    Part {part.partNumber}
                  </span>
                ),
              }))}
            />
          </div>
        </div>

        {/* Right Panel - Recording Area */}
        <div className={styles.recordingPanel}>
          <h2 className={styles.recordingTitle}>Your Recording</h2>

          {/* Recording Status */}
          <div className={styles.recordingStatus}>
            {isPreparing && (
              <div className={styles.preparationTimer}>
                <ClockCircleOutlined className={styles.prepIcon} />
                <span className={styles.prepLabel}>Preparation Time</span>
                <span className={styles.prepTime}>{formatTime(prepTime)}</span>
                <Progress
                  percent={
                    (prepTime / (currentPart.preparationTime || 60)) * 100
                  }
                  showInfo={false}
                  strokeColor="#f59e0b"
                />
              </div>
            )}

            {isRecording && (
              <div className={styles.recordingIndicator}>
                <div className={styles.recordingDot}></div>
                <span>Recording...</span>
                <span className={styles.recordingTime}>
                  {formatTime(recordTime)}
                </span>
              </div>
            )}
          </div>

          {/* Microphone Visualization */}
          <div className={styles.microphoneArea}>
            {!audioUrl && !isRecording && !isPreparing && (
              <div className={styles.microphoneIcon}>
                <AudioOutlined />
              </div>
            )}

            {isRecording && (
              <div className={styles.waveformContainer}>
                <div className={styles.waveform}>
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className={styles.waveBar}
                      style={{
                        animationDelay: `${i * 0.05}s`,
                        height: `${Math.random() * 60 + 20}%`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {audioUrl && !isRecording && (
              <div className={styles.playbackArea}>
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={() => setIsPlaying(false)}
                />
                <Button
                  type="primary"
                  shape="circle"
                  size="large"
                  icon={isPlaying ? <PauseOutlined /> : <PlayCircleOutlined />}
                  onClick={togglePlayback}
                  className={styles.playButton}
                />
                <span className={styles.playbackLabel}>
                  {isPlaying ? "Playing..." : "Click to play your recording"}
                </span>
              </div>
            )}
          </div>

          {/* Recording Progress */}
          {(isRecording || audioUrl) && (
            <div className={styles.recordingProgress}>
              <Progress
                percent={recordingProgress}
                strokeColor={{
                  "0%": "#3b82f6",
                  "100%": "#10b981",
                }}
                format={() => (
                  <span>
                    {formatTime(recordTime)} /{" "}
                    {formatTime(currentPart.speakingTime)}
                  </span>
                )}
              />
            </div>
          )}

          {/* Control Buttons */}
          <div className={styles.controlButtons}>
            {!isRecording && !isPreparing && !audioUrl && (
              <Button
                type="primary"
                size="large"
                icon={<AudioOutlined />}
                onClick={
                  currentPart.preparationTime
                    ? startPreparation
                    : startRecording
                }
                className={styles.startButton}
              >
                {currentPart.preparationTime
                  ? "Start Preparation"
                  : "Start Recording"}
              </Button>
            )}

            {isPreparing && (
              <Button
                type="primary"
                size="large"
                icon={<AudioOutlined />}
                onClick={() => {
                  if (timerRef.current) clearInterval(timerRef.current);
                  setIsPreparing(false);
                  startRecording();
                }}
                className={styles.startButton}
              >
                Start Recording Now
              </Button>
            )}

            {isRecording && (
              <Button
                type="primary"
                danger
                size="large"
                icon={<PauseOutlined />}
                onClick={stopRecording}
                className={styles.stopButton}
              >
                Stop Recording
              </Button>
            )}

            {audioUrl && !isRecording && (
              <Button
                size="large"
                icon={<ReloadOutlined />}
                onClick={handleReRecord}
                className={styles.reRecordButton}
              >
                Re-record
              </Button>
            )}
          </div>

          {/* Instructions */}
          <div className={styles.recordingInstructions}>
            <h4>Instructions:</h4>
            <ul>
              <li>Make sure your microphone is working properly</li>
              <li>Speak clearly and at a natural pace</li>
              <li>You can re-record if needed</li>
              {currentPart.preparationTime && (
                <li>Use the preparation time to organize your thoughts</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className={styles.bottomNavigation}>
        <div className={styles.partInfo}>
          <span className={styles.currentPart}>
            Current: <strong>{currentPart.title}</strong>
          </span>
          <span className={styles.timeLimit}>
            Time limit: <strong>{formatTime(currentPart.speakingTime)}</strong>
          </span>
        </div>

        <div className={styles.partsProgress}>
          {parts.map((part) => (
            <div
              key={part.id}
              className={`${styles.partProgressItem} ${
                part.id === currentPart.id ? styles.activeProgress : ""
              }`}
            >
              <span className={styles.partProgressLabel}>
                Part {part.partNumber}:
              </span>
              <span
                className={`${styles.partProgressValue} ${
                  recordings[part.id] ? styles.complete : ""
                }`}
              >
                {recordings[part.id] ? "✓ Recorded" : "Not recorded"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SpeakingTest;
