import { useState, useEffect } from "react";
import { Select } from "antd";
import styles from "./ReadingTest.module.css";

interface Question {
  id: number;
  type: "dropdown" | "input";
  text: string;
  options?: string[];
}

interface QuestionGroup {
  title: string;
  instruction?: string;
  questions: Question[];
}

interface ReadingTestProps {
  answers: { [key: number]: string };
  onAnswerChange: (questionId: number, value: string) => void;
}

const ReadingTest = ({ answers, onAnswerChange }: ReadingTestProps) => {
  const [currentPart, setCurrentPart] = useState(1);

  // Reset currentPart when component mounts
  useEffect(() => {
    setCurrentPart(1);
  }, []);

  // Function to scroll to a specific question
  const scrollToQuestion = (questionId: number) => {
    const element = document.getElementById(`question-${questionId}`);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      setCurrentPart(questionId);
    }
  };

  // Mock data - sẽ thay bằng data thật từ API
  const questionGroups: QuestionGroup[] = [
    {
      title: "Questions 1-4",
      instruction:
        "The text has 5 paragraphs (A - E). Which paragraph contains each of the following pieces of information?",
      questions: [
        {
          id: 1,
          type: "dropdown",
          text: "A possible security problem",
          options: ["A", "B", "C", "D", "E"],
        },
        {
          id: 2,
          type: "dropdown",
          text: "The cost of M-Pesa",
          options: ["A", "B", "C", "D", "E"],
        },
        {
          id: 3,
          type: "dropdown",
          text: "An international service similar to M-Pesa",
          options: ["A", "B", "C", "D", "E"],
        },
        {
          id: 4,
          type: "dropdown",
          text: "The fact that most Kenyans do not have a bank account",
          options: ["A", "B", "C", "D", "E"],
        },
      ],
    },
    {
      title: "Questions 5-8",
      instruction:
        "Complete the following sentences using NO MORE THAN THREE WORDS from the text for each gap.",
      questions: [
        {
          id: 5,
          type: "input",
          text: "The ping of a text message has never sounded so sweet...",
        },
        {
          id: 6,
          type: "input",
          text: "M-Pesa is now used by _______ of Kenyan adults.",
        },
        {
          id: 7,
          type: "input",
          text: "Money can be collected from _______ across Kenya.",
        },
        {
          id: 8,
          type: "input",
          text: "The service has helped reduce _______ in rural areas.",
        },
      ],
    },
  ];

  return (
    <div className={styles.containerWrapper}>
      <div className={styles.container}>
        {/* Left Panel - Reading Passage */}
        <div className={styles.passagePanel}>
          <div className={styles.partHeader}>PART 1</div>
          <h1 className={styles.passageTitle}>READING PASSAGE 1</h1>
          <p className={styles.passageSubtitle}>
            You should spend about 20 minutes on <strong>Questions 1-13</strong>
            , which are based on Reading Passage 1 below.
          </p>

          <img
            src="/placeholder-reading-image.svg"
            alt="Money Transfers by Mobile"
            className={styles.passageImage}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />

          <h2 className={styles.passageTitle}>Money Transfers by Mobile</h2>

          <div className={styles.passageContent}>
            <p>
              <strong>A.</strong> The ping of a text message has never sounded
              so sweet. In what is being touted as a world first in the mobile
              phone industry, Kenyans are being offered the chance to transfer
              money to each other using their mobile phones. The technology
              allows funds to be transferred from one account to another through
              a simple text message, and it can be done remotely without the
              need for a bank.
            </p>

            <p>
              <strong>B.</strong> The system, known as M-Pesa (the M stands for
              mobile, while pesa is Swahili for money), costs about 35 Kenyan
              shillings (35p) to send 1,000 shillings and reduces to about 75
              shillings for 35,000 shillings. For many Kenyans, who earn an
              average of 3,000 shillings a month, it is a fee worth paying. The
              service has proved so popular that since its launch in March, 1.2
              million customers have signed up.
            </p>

            <p>
              <strong>C.</strong> The driving force behind the scheme is
              Safaricom, Kenya's largest mobile phone operator, which has more
              than eight million subscribers. Michael Joseph, Safaricom's chief
              executive, says the company identified a huge gap in the market.
              "Only about 20% of the population have bank accounts and yet, when
              we surveyed our customers, we found that about 50% were
              transferring money via friends or using the only other option -
              the public transport system."
            </p>

            <p>
              <strong>D.</strong> M-Pesa is not alone. Similar services have
              been launched in the Philippines, South Africa and Afghanistan. In
              the UK, Barclaycard announced in September that its customers
              would be able to use their mobile phones to pay for goods worth
              less than £10. But the Kenyan version is seen as the first real
              roll-out of the technology.
            </p>

            <p>
              <strong>E.</strong> However, security remains a concern. "The idea
              is good but not safe," says David Mugambi, a sales executive in
              Nairobi. "It's basically like sending cash in the post." Safaricom
              says it has addressed these concerns by introducing a secure PIN
              system and giving customers instant confirmation when money is
              received. The company is also working with Vodafone, its majority
              shareholder, to improve the technology.
            </p>
          </div>
        </div>

        {/* Right Panel - Questions */}
        <div className={styles.questionsPanel}>
          {questionGroups.map((group, groupIndex) => (
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
                  id={`question-${question.id}`}
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

      {/* Part Navigation - Fixed at bottom */}
      <div className={styles.partNavigation}>
        <span className={styles.partLabel}>Part 1</span>
        <div className={styles.partButtons}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((num) => (
            <button
              key={num}
              className={`${styles.partButton} ${
                num === currentPart ? styles.active : ""
              } ${answers[num] ? styles.completed : ""}`}
              onClick={() => scrollToQuestion(num)}
            >
              {num}
            </button>
          ))}
        </div>

        <div className={styles.progressInfo}>
          <div className={styles.progressItem}>
            <strong>Part 2:</strong> 0 of 13 questions
          </div>
          <div className={styles.progressItem}>
            <strong>Part 3:</strong> 0 of 14 questions
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReadingTest;
