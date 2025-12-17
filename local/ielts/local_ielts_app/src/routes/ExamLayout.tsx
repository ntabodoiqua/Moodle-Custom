import { useEffect, useState, Suspense, useMemo } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
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
  const {
    examData,
    currentSkill,
    setSkill,
    timeLeft,
    tickTimer,
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
  } = useExamStore();

  const [loading, setLoading] = useState(true);

  // Get available skills from exam data
  const availableSkills = useMemo(
    () => getAvailableSkills(examData),
    [examData]
  );

  // Check if current skill is the last available skill
  const isLastSkill = useMemo(() => {
    if (availableSkills.length === 0) return true;
    return availableSkills.indexOf(currentSkill) === availableSkills.length - 1;
  }, [availableSkills, currentSkill]);

  // 1. INIT: Load exam data from API
  useEffect(() => {
    const initExam = async () => {
      // Get exam ID from URL params (required)
      const urlParams = new URLSearchParams(window.location.search);
      const examId = parseInt(urlParams.get("examid") || "1", 10);

      // Load from API - no fallback to mock data
      await loadExam(examId);
      setLoading(false);
    };

    initExam();
  }, [loadExam]);

  // 2. Set initial skill to first available skill
  useEffect(() => {
    if (loading || !examData || availableSkills.length === 0) return;

    // If current skill is not available in this exam, switch to first available
    if (!availableSkills.includes(currentSkill)) {
      const firstSkill = availableSkills[0];
      setSkill(firstSkill, getSkillDuration(firstSkill));
    }
  }, [loading, examData, availableSkills, currentSkill, setSkill]);

  // 3. TIMER: Countdown
  useEffect(() => {
    if (loading || isSubmitted) return;

    const timer = setInterval(() => {
      tickTimer();
    }, 1000);

    if (timeLeft === 0 && !loading) {
      handleTimeOut();
    }

    return () => clearInterval(timer);
  }, [timeLeft, loading, isSubmitted, tickTimer]);

  // Navigate based on current skill (only if skill is available)
  useEffect(() => {
    if (loading || isSubmitted) return;
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
  }, [currentSkill, loading, isSubmitted, navigate, availableSkills]);

  const handleTimeOut = () => {
    message.warning("Time's up for this section!");
    handleNextSkill();
  };

  // Dynamic skill navigation based on available skills
  const handleNextSkill = () => {
    const nextSkill = getNextSkill(currentSkill, availableSkills);

    if (nextSkill) {
      setSkill(nextSkill, getSkillDuration(nextSkill));
    } else {
      // No more skills, submit the exam
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    Modal.confirm({
      title: "Submit Exam",
      content:
        "Are you sure you want to finish the test? You cannot change your answers after submitting.",
      okText: "Yes, Submit",
      cancelText: "No, keep working",
      onOk: async () => {
        // Try to submit to API first
        const attemptId = await submitAssessment();

        if (attemptId) {
          message.success(
            `Exam submitted successfully! (Attempt #${attemptId})`
          );
        } else {
          // Fallback: just mark as submitted locally
          submitExam();
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

  return (
    <Layout className={styles.appLayout}>
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

      <Content className={styles.content}>
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
                onClick={handleNextSkill}
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
