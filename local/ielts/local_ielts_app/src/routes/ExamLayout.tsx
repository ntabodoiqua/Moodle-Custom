import { useEffect, useState, Suspense, useMemo, useRef } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { Layout, Button, Spin, Modal, message } from "antd";
import {
  UserOutlined,
  RightOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  FullscreenOutlined,
} from "@ant-design/icons";
import { useExamStore } from "../store/examStore";
import { ROUTES } from "./routes";
import {
  ReadingTest,
  ListeningTest,
  WritingTest,
  SpeakingTest,
  ResultPage,
} from "./lazyComponents";
import styles from "../App.module.css";
import type { MoodleConfig, SkillType } from "../types";
import { getAvailableSkills, getNextSkill, getSkillDuration } from "../types";

const { Header, Content, Footer } = Layout;

interface ExamLayoutProps {
  config: MoodleConfig;
}

const ExamLayout = ({ config }: ExamLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    examData,
    currentSkill,
    setSkill,
    timeLeft,
    updateTimeLeft,
    isSubmitted,
    submitExam,
    answers,
    setAnswer,
    writingEssays,
    setEssay,
    speakingAudio,
    setRecording,
    // Async actions
    loadExam,
    submitAssessment,
    isLoading,
    error,
    isApiInitialized,
    // Review mode
    setReviewMode,
  } = useExamStore();

  const [loading, setLoading] = useState(true);
  // Track the previous timeLeft value to detect when it goes from >0 to 0
  const prevTimeLeftRef = useRef<number>(0);

  // Check if we're in review mode - use config as source of truth
  const isReviewMode = config.reviewMode === true;

  // REVIEW MODE: Immediately navigate to result page and prevent other navigations
  useEffect(() => {
    if (isReviewMode && location.pathname !== ROUTES.RESULT) {
      navigate(ROUTES.RESULT, { replace: true });
    }
  }, [isReviewMode, location.pathname, navigate]);

  // Get available skills from exam data
  const availableSkills = useMemo(
    () => getAvailableSkills(examData),
    [examData],
  );

  // Check if current skill is the last available skill
  const isLastSkill = useMemo(() => {
    if (availableSkills.length === 0) return true;
    return availableSkills.indexOf(currentSkill) === availableSkills.length - 1;
  }, [availableSkills, currentSkill]);

  // 1. INIT: Load exam data from API (only after API is initialized)
  useEffect(() => {
    if (!isApiInitialized) return; // Wait for API to be initialized
    if (isSubmitted && !isReviewMode) return; // Don't re-init after submission

    const initExam = async () => {
      // Get exam ID from MoodleConfig (instanceId)
      const examId =
        config.instanceId ||
        parseInt(
          new URLSearchParams(window.location.search).get("examid") || "1",
          10,
        );

      // If in review mode, first load exam data, then set review state
      if (isReviewMode && config.attemptData) {
        console.log(
          "Review mode: Loading exam and attempt data",
          config.attemptId,
        );

        // Set review mode FIRST to load answers
        setReviewMode(true, config.attemptData);

        // Load exam data (with preserveAnswers=true to keep the review answers)
        await loadExam(examId, true);

        setLoading(false);

        // Navigate to result page
        navigate(ROUTES.RESULT, { replace: true });
        return;
      }

      console.log("Loading exam with instanceId:", examId);

      // Load from API - no fallback to mock data
      await loadExam(examId);
      setLoading(false);
    };

    initExam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isApiInitialized,
    loadExam,
    config.instanceId,
    isReviewMode,
    config.attemptData,
    config.attemptId,
    setReviewMode,
    // Note: navigate and isSubmitted intentionally excluded to prevent re-init after submit
  ]);

  // Helper to get duration - uses examData.durations per skill, with fallback to defaults
  const getEffectiveDuration = (skill: SkillType): number => {
    return getSkillDuration(skill, examData);
  };

  // 2. Set initial skill and timer when exam loads (skip in review mode)
  useEffect(() => {
    // Skip skill initialization in review mode
    if (isReviewMode) return;
    if (loading || isSubmitted || !examData || availableSkills.length === 0)
      return;

    // If current skill is not available in this exam, switch to first available
    if (!availableSkills.includes(currentSkill)) {
      const firstSkill = availableSkills[0];
      setSkill(firstSkill, getEffectiveDuration(firstSkill));
    } else if (timeLeft === 0) {
      // Current skill is available but timer not set yet - initialize it
      setSkill(currentSkill, getEffectiveDuration(currentSkill));
    }
  }, [
    loading,
    isSubmitted,
    examData,
    availableSkills,
    currentSkill,
    setSkill,
    isReviewMode,
    timeLeft,
  ]);

  // 3. TIMER: Update timeLeft based on endTime (accurate even after tab switch)
  useEffect(() => {
    // Don't start timer until exam is loaded and has valid time
    if (loading || isSubmitted || !examData || timeLeft <= 0) return;

    const timer = setInterval(() => {
      updateTimeLeft();
    }, 1000);

    // Also update immediately when tab becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        updateTimeLeft();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loading, isSubmitted, examData, timeLeft > 0, updateTimeLeft]);

  // Handle timeout separately - only when timeLeft transitions from >0 to 0
  useEffect(() => {
    // Only trigger timeout if timeLeft was > 0 before and is now 0
    if (
      prevTimeLeftRef.current > 0 &&
      timeLeft === 0 &&
      !isSubmitted &&
      examData
    ) {
      handleTimeOut();
    }
    // Update the ref with current value
    prevTimeLeftRef.current = timeLeft;
  }, [timeLeft, isSubmitted, examData]);

  // Navigate based on current skill (only if skill is available)
  useEffect(() => {
    // Don't navigate if in review mode - stay on result page
    if (isReviewMode) return;
    // Don't navigate if already submitted or on result page
    if (loading || isSubmitted) return;
    // CRITICAL: Don't navigate away from result page
    if (location.pathname === ROUTES.RESULT) return;
    if (!availableSkills.includes(currentSkill)) return;

    const routeMap: Record<SkillType, string> = {
      READING: ROUTES.READING,
      LISTENING: ROUTES.LISTENING,
      WRITING: ROUTES.WRITING,
      SPEAKING: ROUTES.SPEAKING,
    };

    const targetRoute = routeMap[currentSkill];
    if (targetRoute) {
      navigate(targetRoute, { replace: true });
    }
  }, [
    currentSkill,
    loading,
    isSubmitted,
    navigate,
    availableSkills,
    location.pathname,
    isReviewMode,
  ]);

  const handleTimeOut = () => {
    message.warning("Time's up for this section!");
    handleNextSkill(true); // Pass true to indicate timeout
  };

  // Dynamic skill navigation based on available skills
  const handleNextSkill = (isTimeout = false) => {
    const nextSkill = getNextSkill(currentSkill, availableSkills);

    if (nextSkill) {
      setSkill(nextSkill, getEffectiveDuration(nextSkill));
    } else {
      // No more skills, submit the exam
      // If timeout, auto-submit without confirmation
      if (isTimeout) {
        handleAutoSubmit();
      } else {
        handleSubmit();
      }
    }
  };

  // Auto-submit when time runs out (no confirmation)
  const handleAutoSubmit = async () => {
    message.info("Time's up! Automatically submitting your exam...");

    // Mark as submitted locally first to calculate timeTaken
    submitExam();

    // Then try to submit to API
    const attemptId = await submitAssessment();

    if (attemptId) {
      message.success(`Exam submitted successfully! (Attempt #${attemptId})`);
    } else {
      message.success("Exam submitted successfully!");
    }

    // Navigate to result
    setTimeout(() => {
      navigate(ROUTES.RESULT, { replace: true });
    }, 50);
  };

  const handleSubmit = () => {
    Modal.confirm({
      title: "Submit Exam",
      content:
        "Are you sure you want to finish the test? You cannot change your answers after submitting.",
      okText: "Yes, Submit",
      cancelText: "No, keep working",
      onOk: async () => {
        // Mark as submitted locally first to calculate timeTaken
        submitExam();

        // Then try to submit to API
        const attemptId = await submitAssessment();

        if (attemptId) {
          message.success(
            `Exam submitted successfully! (Attempt #${attemptId})`,
          );
        } else {
          message.success("Exam submitted successfully!");
        }

        // Navigate to result
        setTimeout(() => {
          navigate(ROUTES.RESULT, { replace: true });
        }, 50);
      },
    });
  };

  // Retry loading exam
  const handleRetry = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const examId = parseInt(urlParams.get("examid") || "1", 10);
    loadExam(examId);
  };

  // Show loading spinner
  if (loading || isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" tip="Đang tải đề thi..." />
      </div>
    );
  }

  // Show error state - NO fallback to mock data
  if (error || !examData) {
    return (
      <div className={styles.loadingContainer}>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "48px",
              marginBottom: "16px",
              color: "#ff4d4f",
            }}
          >
            ⚠️
          </div>
          <p
            style={{
              fontSize: "20px",
              fontWeight: "600",
              marginBottom: "8px",
              color: "#262626",
            }}
          >
            Không thể tải đề thi
          </p>
          <p style={{ color: "#666", marginBottom: "24px", maxWidth: "400px" }}>
            {error ||
              "Đã xảy ra lỗi khi kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại."}
          </p>
          <Button
            type="primary"
            size="large"
            onClick={handleRetry}
            style={{ marginRight: "12px" }}
          >
            🔄 Thử lại
          </Button>
          <Button size="large" onClick={() => window.history.back()}>
            ← Quay lại
          </Button>
        </div>
      </div>
    );
  }

  // Remove automatic redirect - let navigate handle it
  // if (isSubmitted) {
  //   return <Navigate to={ROUTES.RESULT} replace />;
  // }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeDisplay = `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;

  // When submitted/result page, use different layout style for scrolling
  const layoutStyle = isSubmitted
    ? { minHeight: "100vh", overflow: "auto" }
    : {};

  return (
    <Layout className={styles.appLayout} style={layoutStyle}>
      {!isSubmitted && (
        <Header className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.logo}>IELTS Mock Test</div>
            <div className={styles.divider}></div>
            <div className={styles.userInfo}>
              <UserOutlined />
              <span>Candidate ID: {config.userId}</span>
            </div>
          </div>

          <div className={styles.timerSection}>
            <ClockCircleOutlined
              style={{ fontSize: "20px", color: "#059669" }}
            />
            <span className={styles.timerLabel}>
              {minutes} minutes remaining
            </span>
            <div
              className={`${styles.timerValue} ${
                timeLeft < 300 ? styles.warning : ""
              }`}
            >
              {timeDisplay}
            </div>
          </div>

          <div className={styles.headerRight}>
            <Button icon={<FullscreenOutlined />} type="text" />
            <Button
              type="default"
              style={{
                backgroundColor: "#16a34a",
                borderColor: "#16a34a",
                color: "#ffffff",
                fontWeight: 600,
              }}
              onClick={handleSubmit}
            >
              Submit
            </Button>
          </div>
        </Header>
      )}

      <Content
        className={styles.content}
        style={
          isSubmitted
            ? { height: "auto", minHeight: "100vh", overflow: "visible" }
            : {}
        }
      >
        <Suspense
          key={currentSkill}
          fallback={
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "40px",
              }}
            >
              <Spin size="large" />
            </div>
          }
        >
          <Routes>
            <Route
              path={ROUTES.READING}
              element={
                <ReadingTest answers={answers} onAnswerChange={setAnswer} />
              }
            />
            <Route
              path={ROUTES.LISTENING}
              element={
                <ListeningTest answers={answers} onAnswerChange={setAnswer} />
              }
            />
            <Route
              path={ROUTES.WRITING}
              element={
                <WritingTest essays={writingEssays} onEssayChange={setEssay} />
              }
            />
            <Route
              path={ROUTES.SPEAKING}
              element={
                <SpeakingTest
                  recordings={speakingAudio}
                  onRecordingChange={setRecording}
                />
              }
            />
            <Route
              path={ROUTES.RESULT}
              element={<ResultPage config={config} />}
            />
            <Route
              path="*"
              element={<Navigate to={ROUTES.READING} replace />}
            />
          </Routes>
        </Suspense>
      </Content>

      {!isSubmitted && (
        <Footer className={styles.footer}>
          <div className={styles.footerLeft}>
            Current Section:
            <span className={styles.footerCurrentSkill}>{currentSkill}</span>
            <span
              style={{ marginLeft: "16px", color: "#666", fontSize: "13px" }}
            >
              ({availableSkills.indexOf(currentSkill) + 1} /{" "}
              {availableSkills.length})
            </span>
          </div>

          <div className={styles.footerRight}>
            {!isLastSkill ? (
              <Button
                type="primary"
                icon={<RightOutlined />}
                onClick={() => handleNextSkill(false)}
                style={{
                  backgroundColor: "#2563eb",
                  borderColor: "#2563eb",
                  height: "44px",
                  padding: "0 28px",
                  fontWeight: "600",
                  fontSize: "15px",
                }}
              >
                Next Skill
              </Button>
            ) : (
              <Button
                type="primary"
                danger
                icon={<CheckOutlined />}
                onClick={handleSubmit}
                style={{
                  height: "44px",
                  padding: "0 28px",
                  fontWeight: "600",
                  fontSize: "15px",
                }}
              >
                Finish Test
              </Button>
            )}
          </div>
        </Footer>
      )}
    </Layout>
  );
};

export default ExamLayout;
