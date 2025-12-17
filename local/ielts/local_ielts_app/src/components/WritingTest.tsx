import { useState, useEffect, useMemo } from "react";
import { Tabs, Progress, Tooltip, Empty } from "antd";
import {
  FileTextOutlined,
  BarChartOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useExamStore } from "../store/examStore";
import styles from "./WritingTest.module.css";

interface WritingTestProps {
  essays: { [taskId: number]: string };
  onEssayChange: (taskId: number, content: string) => void;
}

const WritingTest = ({ essays, onEssayChange }: WritingTestProps) => {
  const { examData } = useExamStore();
  const [activeTaskIndex, setActiveTaskIndex] = useState(0);
  const [localEssays, setLocalEssays] = useState<{ [taskId: number]: string }>(
    {}
  );

  // Get writing tasks from examData
  const tasks = useMemo(() => examData?.writing || [], [examData]);

  // Sync local state with props
  useEffect(() => {
    setLocalEssays(essays);
  }, [essays]);

  // Reset state when component mounts or examData changes
  useEffect(() => {
    setActiveTaskIndex(0);
  }, [examData]);

  // Handle essay change - update both local and parent state
  const handleEssayChange = (taskId: number, content: string) => {
    setLocalEssays((prev) => ({ ...prev, [taskId]: content }));
    onEssayChange(taskId, content);
  };

  // Word count function
  const countWords = (text: string): number => {
    if (!text) return 0;
    const trimmed = text.trim();
    if (!trimmed) return 0;
    const words = trimmed.match(/\S+/g);
    return words ? words.length : 0;
  };

  if (!examData || tasks.length === 0) {
    return (
      <div className={styles.containerWrapper}>
        <div className={styles.emptyState}>
          <Empty description="No writing tasks available" />
        </div>
      </div>
    );
  }

  const currentTask = tasks[activeTaskIndex];
  const currentEssay = localEssays[currentTask.id] || "";
  const wordCount = countWords(currentEssay);
  const minWords =
    currentTask.minWords || (currentTask.type === "TASK_1" ? 150 : 250);
  const progressPercent = Math.min((wordCount / minWords) * 100, 100);

  const getProgressStatus = () => {
    if (wordCount >= minWords) return "success";
    if (wordCount >= minWords * 0.7) return "active";
    return "exception";
  };

  const getWordCountColor = () => {
    if (wordCount >= minWords) return "#10b981";
    if (wordCount >= minWords * 0.7) return "#f59e0b";
    return "#ef4444";
  };

  const timeRecommendation =
    currentTask.type === "TASK_1"
      ? "You should spend about 20 minutes on this task."
      : "You should spend about 40 minutes on this task.";

  return (
    <div className={styles.containerWrapper}>
      <div className={styles.container}>
        {/* Left Panel - Task Instructions */}
        <div className={styles.taskPanel}>
          <div className={styles.taskHeader}>
            <span className={styles.taskBadge}>
              {currentTask.type.replace("_", " ")}
            </span>
          </div>
          <h1 className={styles.taskTitle}>{currentTask.title}</h1>

          <div className={styles.timeRecommendation}>
            <InfoCircleOutlined />
            <span>{timeRecommendation}</span>
          </div>

          {/* Task Image (for Task 1) */}
          {currentTask.imageUrl && (
            <div className={styles.taskImageContainer}>
              <img
                src={currentTask.imageUrl}
                alt="Task visual"
                className={styles.taskImage}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          )}

          {/* Task Prompt */}
          <div className={styles.taskPrompt}>
            {currentTask.prompt.split("\n\n").map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          {/* Writing Tips */}
          <div className={styles.tipsBox}>
            <h4>
              <FileTextOutlined /> Writing Tips
            </h4>
            <ul>
              {currentTask.type === "TASK_1" ? (
                <>
                  <li>Introduction: Paraphrase the question</li>
                  <li>Overview: Summarize the main trends</li>
                  <li>Body paragraphs: Describe specific data</li>
                  <li>Use data comparisons and percentages</li>
                </>
              ) : (
                <>
                  <li>Introduction: State both views clearly</li>
                  <li>Body 1: First viewpoint with examples</li>
                  <li>Body 2: Second viewpoint with examples</li>
                  <li>Conclusion: Your opinion with reasons</li>
                </>
              )}
            </ul>
          </div>

          {/* Task Tabs */}
          <div className={styles.taskTabs}>
            <Tabs
              activeKey={activeTaskIndex.toString()}
              onChange={(key) => setActiveTaskIndex(parseInt(key))}
              items={tasks.map((task, index) => ({
                key: index.toString(),
                label: (
                  <span className={styles.tabLabel}>
                    {task.type === "TASK_1" ? (
                      <BarChartOutlined />
                    ) : (
                      <FileTextOutlined />
                    )}
                    {task.title}
                  </span>
                ),
              }))}
            />
          </div>
        </div>

        {/* Right Panel - Text Editor */}
        <div className={styles.editorPanel}>
          <div className={styles.editorHeader}>
            <h3>Your Response</h3>
            <div className={styles.wordCountDisplay}>
              <Tooltip title={`Target: ${minWords} words minimum`}>
                <span
                  className={styles.wordCount}
                  style={{ color: getWordCountColor() }}
                >
                  {wordCount} / {minWords} words
                </span>
              </Tooltip>
            </div>
          </div>

          <div className={styles.editorContainer}>
            <textarea
              className={styles.textEditor}
              placeholder={`Start writing your ${currentTask.type
                .replace("_", " ")
                .toLowerCase()} response here...`}
              value={currentEssay}
              onChange={(e) =>
                handleEssayChange(currentTask.id, e.target.value)
              }
            />
          </div>

          {/* Progress Bar */}
          <div className={styles.progressContainer}>
            <Progress
              percent={progressPercent}
              status={getProgressStatus()}
              strokeColor={getWordCountColor()}
              format={() => (
                <span style={{ color: getWordCountColor() }}>
                  {wordCount >= minWords
                    ? "✓ Minimum reached"
                    : `${minWords - wordCount} more words needed`}
                </span>
              )}
            />
          </div>

          {/* Character/Paragraph Stats */}
          <div className={styles.statsRow}>
            <div className={styles.statItem}>
              <strong>Characters:</strong> {currentEssay.length}
            </div>
            <div className={styles.statItem}>
              <strong>Paragraphs:</strong>{" "}
              {currentEssay.split(/\n\n+/).filter((p) => p.trim()).length || 0}
            </div>
            <div className={styles.statItem}>
              <strong>Sentences:</strong>{" "}
              {currentEssay.split(/[.!?]+/).filter((s) => s.trim()).length || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className={styles.bottomNavigation}>
        <div className={styles.taskInfo}>
          <span className={styles.currentTask}>
            Current: <strong>{currentTask.title}</strong>
          </span>
          <span className={styles.wordRequirement}>
            Minimum: <strong>{minWords} words</strong>
          </span>
        </div>

        <div className={styles.taskProgress}>
          {tasks.map((task, index) => {
            const taskWords = countWords(localEssays[task.id] || "");
            const taskMinWords =
              task.minWords || (task.type === "TASK_1" ? 150 : 250);
            const isComplete = taskWords >= taskMinWords;
            return (
              <div
                key={task.id}
                className={`${styles.taskProgressItem} ${
                  index === activeTaskIndex ? styles.activeProgress : ""
                }`}
              >
                <span className={styles.taskProgressLabel}>{task.title}:</span>
                <span
                  className={`${styles.taskProgressValue} ${
                    isComplete ? styles.complete : ""
                  }`}
                >
                  {taskWords} words {isComplete && "✓"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WritingTest;
