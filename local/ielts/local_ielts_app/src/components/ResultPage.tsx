// src/components/ResultPage.tsx
import { useExamStore } from "../store/examStore";
import { MOCK_ANSWERS } from "../data/mockData";
import { Button, Card, Statistic, Row, Col } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";

const ResultPage = () => {
  const { answers } = useExamStore(); // Lấy bài làm của user

  // 1. Logic tính điểm Reading/Listening
  const calculateScore = () => {
    let correctCount = 0;
    let totalQuestions = Object.keys(MOCK_ANSWERS).length;

    Object.keys(MOCK_ANSWERS).forEach((qId) => {
      const id = Number(qId);
      // So sánh đáp án (Chuyển về chữ thường, xóa khoảng trắng thừa để so sánh chính xác hơn)
      const userAns = (answers[id] || "").toString().trim().toLowerCase();
      const correctAns = (MOCK_ANSWERS[id] || "")
        .toString()
        .trim()
        .toLowerCase();

      if (userAns === correctAns) {
        correctCount++;
      }
    });

    return { correctCount, totalQuestions };
  };

  const { correctCount, totalQuestions } = calculateScore();

  // Công thức tính Band Score giả định (Ví dụ đơn giản: số câu đúng / tổng số * 9)
  const bandScore = ((correctCount / totalQuestions) * 9).toFixed(1);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-blue-800">Test Result</h1>
        <p className="text-gray-500">Candidate: Demo User</p>
      </div>

      {/* Hiển thị điểm số tổng quan */}
      <Row gutter={16} className="mb-8">
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Correct"
              value={correctCount}
              suffix={`/ ${totalQuestions}`}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Estimated Band Score"
              value={bandScore}
              precision={1}
              valueStyle={{ color: "#cf1322", fontWeight: "bold" }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="Time Taken" value="58:20" /> {/* Giả định */}
          </Card>
        </Col>
      </Row>

      {/* Chi tiết từng câu (Review) */}
      <Card title="Detailed Review" className="shadow-sm">
        <div className="space-y-4">
          {Object.keys(MOCK_ANSWERS).map((qId) => {
            const id = Number(qId);
            const userAns = answers[id] || "No Answer";
            const correctAns = MOCK_ANSWERS[id];
            const isCorrect =
              userAns.toString().trim().toLowerCase() ===
              correctAns.toString().trim().toLowerCase();

            return (
              <div
                key={id}
                className={`p-3 border rounded flex justify-between items-center ${
                  isCorrect
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div>
                  <span className="font-bold mr-2">Question {id}:</span>
                  <span>
                    Your answer: <strong>{userAns}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  {!isCorrect && (
                    <span className="text-gray-500 text-sm">
                      Correct: {correctAns}
                    </span>
                  )}
                  {isCorrect ? (
                    <CheckCircleOutlined className="text-green-600 text-xl" />
                  ) : (
                    <CloseCircleOutlined className="text-red-600 text-xl" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="mt-8 text-center">
        <Button
          type="primary"
          size="large"
          onClick={() => window.location.reload()}
        >
          Retake Test
        </Button>
      </div>
    </div>
  );
};

export default ResultPage;
