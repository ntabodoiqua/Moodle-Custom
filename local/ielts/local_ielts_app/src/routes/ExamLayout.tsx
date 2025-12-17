import { useEffect, useState, Suspense } from "react";
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
import { MOCK_EXAM } from "../data/mockData";
import { ROUTES } from "./routes";
import {
  ReadingTest,
  ListeningTest,
  WritingTest,
  SpeakingTest,
  ResultPage,
} from "./lazyComponents";
import styles from "../App.module.css";

const { Header, Content, Footer } = Layout;

interface MoodleConfig {
  userId: number;
  sesskey: string;
  wwwroot: string;
  apiEndpoint: string;
  fullName?: string;
}

interface ExamLayoutProps {
  config: MoodleConfig;
}

const ExamLayout = ({ config }: ExamLayoutProps) => {
  const navigate = useNavigate();
  const {
    setExamData,
    currentSkill,
    setSkill,
    timeLeft,
    tickTimer,
    isSubmitted,
    submitExam,
    answers,
    setAnswer,
  } = useExamStore();

  const [loading, setLoading] = useState(true);

  // 1. INIT: Load exam data
  useEffect(() => {
    setTimeout(() => {
      setExamData(MOCK_EXAM, "READING");
      setLoading(false);
    }, 1000);
  }, [setExamData]);

  // 2. TIMER: Countdown
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

  // Navigate based on current skill
  useEffect(() => {
    if (loading) return;

    const routeMap = {
      READING: ROUTES.READING,
      LISTENING: ROUTES.LISTENING,
      WRITING: ROUTES.WRITING,
      SPEAKING: ROUTES.SPEAKING,
    };

    const targetRoute = routeMap[currentSkill as keyof typeof routeMap];
    if (targetRoute) {
      navigate(targetRoute, { replace: true });
    }
  }, [currentSkill, loading, navigate]);

  const handleTimeOut = () => {
    message.warning("Time's up for this section!");
    handleNextSkill();
  };

  const handleNextSkill = () => {
    switch (currentSkill) {
      case "READING":
        setSkill("LISTENING", 40 * 60);
        break;
      case "LISTENING":
        setSkill("WRITING", 60 * 60);
        break;
      case "WRITING":
        setSkill("SPEAKING", 15 * 60);
        break;
      case "SPEAKING":
        handleSubmit();
        break;
    }
  };

  const handleSubmit = () => {
    Modal.confirm({
      title: "Submit Exam",
      content:
        "Are you sure you want to finish the test? You cannot change your answers after submitting.",
      okText: "Yes, Submit",
      cancelText: "No, keep working",
      onOk: () => {
        submitExam();
        navigate(ROUTES.RESULT);
        message.success("Exam submitted successfully!");
      },
    });
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" tip="Loading Exam..." />
      </div>
    );
  }

  if (isSubmitted) {
    return <Navigate to={ROUTES.RESULT} replace />;
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeDisplay = `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;

  return (
    <Layout className={styles.appLayout}>
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
          <ClockCircleOutlined style={{ fontSize: "20px", color: "#059669" }} />
          <span className={styles.timerLabel}>{minutes} minutes remaining</span>
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
            <Route path={ROUTES.LISTENING} element={<ListeningTest />} />
            <Route path={ROUTES.WRITING} element={<WritingTest />} />
            <Route path={ROUTES.SPEAKING} element={<SpeakingTest />} />
            <Route path={ROUTES.RESULT} element={<ResultPage />} />
            <Route
              path="*"
              element={<Navigate to={ROUTES.READING} replace />}
            />
          </Routes>
        </Suspense>
      </Content>

      <Footer className={styles.footer}>
        <div className={styles.footerLeft}>
          Current Section:
          <span className={styles.footerCurrentSkill}>{currentSkill}</span>
        </div>

        <div className={styles.footerRight}>
          {currentSkill !== "SPEAKING" ? (
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
    </Layout>
  );
};

export default ExamLayout;
