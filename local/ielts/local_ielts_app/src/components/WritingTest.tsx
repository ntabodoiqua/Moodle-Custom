import { useState, useEffect } from "react";
import { Tabs, Progress, Tooltip } from "antd";
import {
  FileTextOutlined,
  BarChartOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import styles from "./WritingTest.module.css";

interface WritingTask {
  id: number;
  type: "TASK_1" | "TASK_2";
  title: string;
  prompt: string;
  imageUrl?: string;
  minWords: number;
  timeRecommendation: string;
}

interface WritingTestProps {
  essays: { [taskId: number]: string };
  onEssayChange: (taskId: number, content: string) => void;
}

const WritingTest = ({ essays, onEssayChange }: WritingTestProps) => {
  const [activeTask, setActiveTask] = useState("1");
  const [localEssays, setLocalEssays] = useState<{ [taskId: number]: string }>(
    {}
  );

  // Sync local state with props
  useEffect(() => {
    setLocalEssays(essays);
  }, [essays]);

  // Reset state when component mounts
  useEffect(() => {
    setActiveTask("1");
  }, []);

  // Handle essay change - update both local and parent state
  const handleEssayChange = (taskId: number, content: string) => {
    setLocalEssays((prev) => ({ ...prev, [taskId]: content }));
    onEssayChange(taskId, content);
  };

  // Word count function - simple function, not memoized
  const countWords = (text: string): number => {
    if (!text) return 0;
    const trimmed = text.trim();
    if (!trimmed) return 0;
    // Match all word characters (including Unicode letters)
    const words = trimmed.match(/\S+/g);
    return words ? words.length : 0;
  };

  // Mock data - sẽ thay bằng data thật từ API
  const tasks: WritingTask[] = [
    {
      id: 1,
      type: "TASK_1",
      title: "Writing Task 1",
      prompt: `The chart below shows the percentage of households in owned and rented accommodation in England and Wales between 1918 and 2011.

Summarise the information by selecting and reporting the main features, and make comparisons where relevant.

Write at least 150 words.`,
      imageUrl: "/images/chart-task1.png",
      minWords: 150,
      timeRecommendation: "You should spend about 20 minutes on this task.",
    },
    {
      id: 2,
      type: "TASK_2",
      title: "Writing Task 2",
      prompt: `Some people think that the best way to reduce crime is to give longer prison sentences. Others, however, believe there are better alternative ways of reducing crime.

Discuss both views and give your opinion.

Give reasons for your answer and include any relevant examples from your own knowledge or experience.

Write at least 250 words.`,
      minWords: 250,
      timeRecommendation: "You should spend about 40 minutes on this task.",
    },
  ];

  const currentTask =
    tasks.find((t) => t.id === parseInt(activeTask)) || tasks[0];
  const currentEssay = localEssays[currentTask.id] || "";
  const wordCount = countWords(currentEssay);
  const progressPercent = Math.min(
    (wordCount / currentTask.minWords) * 100,
    100
  );

  const getProgressStatus = () => {
    if (wordCount >= currentTask.minWords) return "success";
    if (wordCount >= currentTask.minWords * 0.7) return "active";
    return "exception";
  };

  const getWordCountColor = () => {
    if (wordCount >= currentTask.minWords) return "#10b981";
    if (wordCount >= currentTask.minWords * 0.7) return "#f59e0b";
    return "#ef4444";
  };

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
            <span>{currentTask.timeRecommendation}</span>
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
              activeKey={activeTask}
              onChange={setActiveTask}
              items={tasks.map((task) => ({
                key: task.id.toString(),
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
              <Tooltip title={`Target: ${currentTask.minWords} words minimum`}>
                <span
                  className={styles.wordCount}
                  style={{ color: getWordCountColor() }}
                >
                  {wordCount} / {currentTask.minWords} words
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
                  {wordCount >= currentTask.minWords
                    ? "✓ Minimum reached"
                    : `${currentTask.minWords - wordCount} more words needed`}
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
            Minimum: <strong>{currentTask.minWords} words</strong>
          </span>
        </div>

        <div className={styles.taskProgress}>
          {tasks.map((task) => {
            const taskWords = countWords(localEssays[task.id] || "");
            const isComplete = taskWords >= task.minWords;
            return (
              <div
                key={task.id}
                className={`${styles.taskProgressItem} ${
                  task.id === currentTask.id ? styles.activeProgress : ""
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
