import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button, Progress, Modal, message, Tabs, Empty } from "antd";
import {
  AudioOutlined,
  PauseOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useExamStore } from "../store/examStore";
import styles from "./SpeakingTest.module.css";

interface SpeakingTestProps {
  recordings: { [partId: number]: Blob };
  onRecordingChange: (partId: number, audioBlob: Blob) => void;
}

const SpeakingTest = ({ recordings, onRecordingChange }: SpeakingTestProps) => {
  const { examData } = useExamStore();
  const [activePartIndex, setActivePartIndex] = useState(0);
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

  // Get speaking parts from examData
  const parts = useMemo(() => examData?.speaking || [], [examData]);

  // Get current part
  const currentPart = parts[activePartIndex];

  // Default speaking times based on part number
  const getSpeakingTime = (part: typeof currentPart) => {
    if (!part) return 300;
    if (part.speakingTime) return part.speakingTime;
    switch (part.partNumber) {
      case 1:
        return 300; // 5 minutes
      case 2:
        return 120; // 2 minutes
      case 3:
        return 300; // 5 minutes
      default:
        return 300;
    }
  };

  const getPreparationTime = (part: typeof currentPart) => {
    if (!part) return 0;
    if (part.preparationTime) return part.preparationTime;
    return part.partNumber === 2 ? 60 : 0; // 1 minute prep for Part 2
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  // Reset when changing parts or examData
  useEffect(() => {
    stopRecording();
    setAudioUrl(null);
    setPrepTime(0);
    setRecordTime(0);
    setIsPreparing(false);

    // Check if there's existing recording
    if (currentPart) {
      const existingRecording = recordings[currentPart.id];
      if (existingRecording) {
        const url = URL.createObjectURL(existingRecording);
        setAudioUrl(url);
      }
    }
  }, [activePartIndex, currentPart?.id, recordings]);

  // Reset index when examData changes
  useEffect(() => {
    setActivePartIndex(0);
  }, [examData]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const speakingTime = getSpeakingTime(currentPart);
  const preparationTime = getPreparationTime(currentPart);

  // Preparation timer (for Part 2)
  const startPreparation = useCallback(() => {
    if (!preparationTime) {
      startRecording();
      return;
    }

    setIsPreparing(true);
    setPrepTime(preparationTime);

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
  }, [preparationTime]);

  // Start recording
  const startRecording = useCallback(async () => {
    if (!currentPart) return;

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
          if (prev >= speakingTime) {
            stopRecording();
            message.warning("Maximum speaking time reached.");
            return speakingTime;
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
  }, [currentPart?.id, speakingTime, onRecordingChange]);

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
        if (preparationTime) {
          startPreparation();
        } else {
          startRecording();
        }
      },
    });
  };

  if (!examData || parts.length === 0) {
    return (
      <div className={styles.containerWrapper}>
        <div className={styles.emptyState}>
          <Empty description="No speaking parts available" />
        </div>
      </div>
    );
  }

  const recordingProgress = (recordTime / speakingTime) * 100;

  return (
    <div className={styles.containerWrapper}>
      <div className={styles.container}>
        {/* Left Panel - Part Instructions */}
        <div className={styles.instructionPanel}>
          <div className={styles.partHeader}>
            <span className={styles.partBadge}>
              PART {currentPart?.partNumber || activePartIndex + 1}
            </span>
          </div>
          <h1 className={styles.partTitle}>
            {currentPart?.title || `Part ${activePartIndex + 1}`}
          </h1>
          <p className={styles.partDescription}>
            {currentPart?.description || ""}
          </p>

          {/* Questions/Prompts */}
          <div className={styles.questionCard}>
            <h3 className={styles.questionCardTitle}>
              {currentPart?.partNumber === 2 ? "Cue Card" : "Sample Questions"}
            </h3>
            <div className={styles.questionList}>
              {currentPart?.questions?.map((question, index) => (
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
              )) || <div>No questions available</div>}
            </div>
          </div>

          {/* Speaking Tips */}
          <div className={styles.tipsBox}>
            <h4>Speaking Tips</h4>
            <ul>
              {currentPart?.partNumber === 1 && (
                <>
                  <li>Speak naturally and don't memorize answers</li>
                  <li>Give extended answers, not just yes/no</li>
                  <li>Use a variety of vocabulary and structures</li>
                </>
              )}
              {currentPart?.partNumber === 2 && (
                <>
                  <li>Use the preparation time to make notes</li>
                  <li>Cover all the bullet points</li>
                  <li>Speak for the full 2 minutes if possible</li>
                </>
              )}
              {currentPart?.partNumber === 3 && (
                <>
                  <li>Give your opinion clearly</li>
                  <li>Support your ideas with examples</li>
                  <li>Discuss different perspectives</li>
                </>
              )}
              {(!currentPart?.partNumber || currentPart.partNumber > 3) && (
                <>
                  <li>Speak clearly and at a natural pace</li>
                  <li>Use a variety of vocabulary</li>
                  <li>Support your ideas with examples</li>
                </>
              )}
            </ul>
          </div>

          {/* Part Tabs */}
          <div className={styles.partTabs}>
            <Tabs
              activeKey={activePartIndex.toString()}
              onChange={(key) => setActivePartIndex(parseInt(key))}
              items={parts.map((part, index) => ({
                key: index.toString(),
                label: (
                  <span className={styles.tabLabel}>
                    {recordings[part.id] && (
                      <CheckCircleOutlined style={{ color: "#10b981" }} />
                    )}
                    Part {part.partNumber || index + 1}
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
                  percent={(prepTime / (preparationTime || 60)) * 100}
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
                    {formatTime(recordTime)} / {formatTime(speakingTime)}
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
                onClick={preparationTime ? startPreparation : startRecording}
                className={styles.startButton}
              >
                {preparationTime ? "Start Preparation" : "Start Recording"}
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
              {preparationTime > 0 && (
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
            Current:{" "}
            <strong>
              {currentPart?.title || `Part ${activePartIndex + 1}`}
            </strong>
          </span>
          <span className={styles.timeLimit}>
            Time limit: <strong>{formatTime(speakingTime)}</strong>
          </span>
        </div>

        <div className={styles.partsProgress}>
          {parts.map((part, index) => (
            <div
              key={part.id}
              className={`${styles.partProgressItem} ${
                index === activePartIndex ? styles.activeProgress : ""
              }`}
            >
              <span className={styles.partProgressLabel}>
                Part {part.partNumber || index + 1}:
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
