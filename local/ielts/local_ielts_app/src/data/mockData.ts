// src/data/mockData.ts
import type { ExamData } from "../types";

export const MOCK_EXAM: ExamData = {
  id: 1,
  title: "IELTS Full Mock Test 01 (Academic)",
  duration: 10000, // Tổng thời gian tượng trưng

  // --------------------------------------------------------
  // 1. KỸ NĂNG ĐỌC (READING)
  // --------------------------------------------------------
  reading: [
    {
      id: 101,
      title: "Passage 1: The History of Tea",
      content: `
        <h3 class="text-xl font-bold mb-2">The Origins of Tea</h3>
        <p class="mb-4">Tea is an aromatic beverage prepared by pouring hot or boiling water over cured or fresh leaves of <strong>Camellia sinensis</strong>, an evergreen shrub native to East Asia.</p>
        <p class="mb-4">After water, it is the most widely consumed drink in the world. There are many different types of tea; some, like Darjeeling and Chinese greens, have a cooling, slightly bitter, and astringent flavour, while others have vastly different profiles that include sweet, nutty, floral, or grassy notes.</p>
        <p class="mb-4">Tea has a stimulating effect in humans primarily due to its caffeine content.</p>
      `,
      groups: [
        {
          id: 1,
          title: "Questions 1-3",
          instruction: "Choose the correct letter, A, B, C or D.",
          questions: [
            {
              id: 1, // ID duy nhất
              number: "1",
              text: "Where did tea originate?",
              type: "MULTIPLE_CHOICE",
              options: ["China", "India", "Japan", "Vietnam"],
            },
            {
              id: 2,
              number: "2",
              text: "Which component causes the stimulating effect?",
              type: "MULTIPLE_CHOICE",
              options: ["Sugar", "Caffeine", "Water", "Herbs"],
            },
          ],
        },
        {
          id: 2,
          title: "Questions 3-4",
          instruction:
            "Do the following statements agree with the information given in the Reading Passage?",
          questions: [
            {
              id: 3,
              number: "3",
              text: "Tea is the most consumed drink after water.",
              type: "TRUE_FALSE",
            },
            {
              id: 4,
              number: "4",
              text: "All tea tastes the same.",
              type: "TRUE_FALSE",
            },
          ],
        },
      ],
    },
  ],

  // --------------------------------------------------------
  // 2. KỸ NĂNG NGHE (LISTENING)
  // --------------------------------------------------------
  listening: [
    {
      id: 201,
      title: "Section 1: Library Registration",
      // Link MP3 test online (hoặc thay bằng link local của bạn)
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      groups: [
        {
          id: 3,
          title: "Questions 5-8",
          instruction:
            "Complete the form below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER.",
          questions: [
            {
              id: 5,
              number: "5",
              text: "First Name: <strong>James</strong><br/>Surname: ___________",
              type: "SHORT_ANSWER",
            },
            {
              id: 6,
              number: "6",
              text: "Address: Flat 4, ___________ Road",
              type: "SHORT_ANSWER",
            },
            {
              id: 7,
              number: "7",
              text: "Postcode: ___________",
              type: "SHORT_ANSWER",
            },
          ],
        },
      ],
    },
  ],

  // --------------------------------------------------------
  // 3. KỸ NĂNG VIẾT (WRITING)
  // --------------------------------------------------------
  writing: [
    {
      id: 301,
      type: "TASK_1",
      title: "Writing Task 1",
      minWords: 150,
      prompt: `
        <p>The chart below shows the number of men and women in further education in Britain in three periods and whether they were studying full-time or part-time.</p>
        <p>Summarise the information by selecting and reporting the main features, and make comparisons where relevant.</p>
      `,
      // Link ảnh biểu đồ mẫu (Placeholder image)
      imageUrl: "https://placehold.co/600x400/png?text=Chart+Task+1+Example",
    },
    {
      id: 302,
      type: "TASK_2",
      title: "Writing Task 2",
      minWords: 250,
      prompt: `
        <p>Some people believe that unpaid community service should be a compulsory part of high school programmes (for example working for a charity, improving the neighbourhood or teaching sports to younger children).</p>
        <p>To what extent do you agree or disagree?</p>
      `,
    },
  ],

  // --------------------------------------------------------
  // 4. KỸ NĂNG NÓI (SPEAKING)
  // --------------------------------------------------------
  speaking: [
    {
      id: 401,
      partNumber: 1,
      title: "Part 1: Introduction & Interview",
      questions: [
        "What is your full name?",
        "Can I see your ID?",
        "Do you work or are you a student?",
        "Do you like your job?",
      ],
    },
    {
      id: 402,
      partNumber: 2,
      title: "Part 2: Cue Card",
      preparationTime: 60, // 60 giây chuẩn bị
      questions: [
        "Describe a book you have recently read.",
        "You should say:",
        "- What kind of book it is",
        "- What it is about",
        "- Why you read it",
        "And explain what effect the book had on you.",
      ],
    },
    {
      id: 403,
      partNumber: 3,
      title: "Part 3: Discussion",
      questions: [
        "Do people in your country like reading?",
        "Do you think electronic books will replace paper books in the future?",
        "How should children be encouraged to read?",
      ],
    },
  ],
};

export const MOCK_ANSWERS: Record<number, string> = {
  // Reading
  1: "China", // Câu 1 chọn China
  2: "Caffeine", // Câu 2 chọn Caffeine
  3: "TRUE", // Câu 3
  4: "FALSE", // Câu 4

  // Listening
  5: "Black", // Surname
  6: "21", // Road number
  7: "SW1 4TA", // Postcode
};
