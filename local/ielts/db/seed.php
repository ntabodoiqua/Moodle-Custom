<?php
// FILE: local/ielts/db/seed.php

// 1. Đặt mode là AJAX để chạy được trên trình duyệt
define('AJAX_SCRIPT', true);

// 2. Load config Moodle (Lùi ra 3 cấp thư mục: db -> ielts -> local -> root)
require_once(__DIR__ . '/../../../config.php');

// 3. Bắt buộc đăng nhập Admin
require_login();
require_capability('moodle/site:config', context_system::instance());

// Thiết lập output
header('Content-Type: text/html; charset=utf-8');
global $DB;

echo "<h1>Starting IELTS Exam Seeding...</h1><hr>";

// ============================================================
// MOCK DATA - IELTS Full Mock Test 01 (Academic)
// Based on data from TSX components
// ============================================================

// --------------------------------------------------------
// 1. READING DATA (from ReadingTest.tsx)
// --------------------------------------------------------
$reading_data = [
    [
        'id' => 101,
        'title' => 'READING PASSAGE 1: Money Transfers by Mobile',
        'content' => '
            <p><strong>A.</strong> The ping of a text message has never sounded so sweet. In what is being touted as a world first in the mobile phone industry, Kenyans are being offered the chance to transfer money to each other using their mobile phones. The technology allows funds to be transferred from one account to another through a simple text message, and it can be done remotely without the need for a bank.</p>

            <p><strong>B.</strong> The system, known as M-Pesa (the M stands for mobile, while pesa is Swahili for money), costs about 35 Kenyan shillings (35p) to send 1,000 shillings and reduces to about 75 shillings for 35,000 shillings. For many Kenyans, who earn an average of 3,000 shillings a month, it is a fee worth paying. The service has proved so popular that since its launch in March, 1.2 million customers have signed up.</p>

            <p><strong>C.</strong> The driving force behind the scheme is Safaricom, Kenya\'s largest mobile phone operator, which has more than eight million subscribers. Michael Joseph, Safaricom\'s chief executive, says the company identified a huge gap in the market. "Only about 20% of the population have bank accounts and yet, when we surveyed our customers, we found that about 50% were transferring money via friends or using the only other option - the public transport system."</p>

            <p><strong>D.</strong> M-Pesa is not alone. Similar services have been launched in the Philippines, South Africa and Afghanistan. In the UK, Barclaycard announced in September that its customers would be able to use their mobile phones to pay for goods worth less than £10. But the Kenyan version is seen as the first real roll-out of the technology.</p>

            <p><strong>E.</strong> However, security remains a concern. "The idea is good but not safe," says David Mugambi, a sales executive in Nairobi. "It\'s basically like sending cash in the post." Safaricom says it has addressed these concerns by introducing a secure PIN system and giving customers instant confirmation when money is received. The company is also working with Vodafone, its majority shareholder, to improve the technology.</p>
        ',
        'groups' => [
            [
                'id' => 1,
                'title' => 'Questions 1-4',
                'instruction' => 'The text has 5 paragraphs (A - E). Which paragraph contains each of the following pieces of information?',
                'questions' => [
                    [
                        'id' => 1,
                        'number' => '1',
                        'text' => 'A possible security problem',
                        'type' => 'MULTIPLE_CHOICE',
                        'options' => ['A', 'B', 'C', 'D', 'E'],
                        'correctAnswer' => 'E',
                        'explanation' => 'Paragraph E discusses security concerns: "However, security remains a concern. The idea is good but not safe."',
                        'referenceText' => 'However, security remains a concern. "The idea is good but not safe," says David Mugambi.',
                    ],
                    [
                        'id' => 2,
                        'number' => '2',
                        'text' => 'The cost of M-Pesa',
                        'type' => 'MULTIPLE_CHOICE',
                        'options' => ['A', 'B', 'C', 'D', 'E'],
                        'correctAnswer' => 'B',
                        'explanation' => 'Paragraph B mentions the cost: "costs about 35 Kenyan shillings (35p) to send 1,000 shillings."',
                        'referenceText' => 'The system, known as M-Pesa, costs about 35 Kenyan shillings (35p) to send 1,000 shillings.',
                    ],
                    [
                        'id' => 3,
                        'number' => '3',
                        'text' => 'An international service similar to M-Pesa',
                        'type' => 'MULTIPLE_CHOICE',
                        'options' => ['A', 'B', 'C', 'D', 'E'],
                        'correctAnswer' => 'D',
                        'explanation' => 'Paragraph D mentions similar services in other countries: "Similar services have been launched in the Philippines, South Africa and Afghanistan."',
                        'referenceText' => 'M-Pesa is not alone. Similar services have been launched in the Philippines, South Africa and Afghanistan.',
                    ],
                    [
                        'id' => 4,
                        'number' => '4',
                        'text' => 'The fact that most Kenyans do not have a bank account',
                        'type' => 'MULTIPLE_CHOICE',
                        'options' => ['A', 'B', 'C', 'D', 'E'],
                        'correctAnswer' => 'C',
                        'explanation' => 'Paragraph C states: "Only about 20% of the population have bank accounts," meaning 80% do not have bank accounts.',
                        'referenceText' => 'Only about 20% of the population have bank accounts.',
                    ],
                ],
            ],
            [
                'id' => 2,
                'title' => 'Questions 5-8',
                'instruction' => 'Complete the following sentences using NO MORE THAN THREE WORDS from the text for each gap.',
                'questions' => [
                    [
                        'id' => 5,
                        'number' => '5',
                        'text' => 'M-Pesa allows funds to be transferred through a simple _______.',
                        'type' => 'GAP_FILL',
                        'correctAnswer' => 'text message',
                        'explanation' => 'The passage states: "The technology allows funds to be transferred from one account to another through a simple text message."',
                        'referenceText' => 'The technology allows funds to be transferred from one account to another through a simple text message.',
                    ],
                    [
                        'id' => 6,
                        'number' => '6',
                        'text' => 'Since March, _______ customers have signed up for M-Pesa.',
                        'type' => 'GAP_FILL',
                        'correctAnswer' => '1.2 million',
                        'explanation' => 'Paragraph B states: "The service has proved so popular that since its launch in March, 1.2 million customers have signed up."',
                        'referenceText' => 'The service has proved so popular that since its launch in March, 1.2 million customers have signed up.',
                    ],
                    [
                        'id' => 7,
                        'number' => '7',
                        'text' => 'Safaricom has more than _______ subscribers.',
                        'type' => 'GAP_FILL',
                        'correctAnswer' => 'eight million',
                        'explanation' => 'Paragraph C mentions: "Safaricom, Kenya\'s largest mobile phone operator, which has more than eight million subscribers."',
                        'referenceText' => 'Safaricom, Kenya\'s largest mobile phone operator, which has more than eight million subscribers.',
                    ],
                    [
                        'id' => 8,
                        'number' => '8',
                        'text' => 'Safaricom introduced a secure _______ system to address security concerns.',
                        'type' => 'GAP_FILL',
                        'correctAnswer' => 'PIN',
                        'explanation' => 'Paragraph E states: "Safaricom says it has addressed these concerns by introducing a secure PIN system."',
                        'referenceText' => 'Safaricom says it has addressed these concerns by introducing a secure PIN system.',
                    ],
                ],
            ],
        ],
    ],
];

// --------------------------------------------------------
// 2. LISTENING DATA (from ListeningTest.tsx)
// --------------------------------------------------------
$listening_data = [
    [
        'id' => 201,
        'title' => 'Section 1',
        'instruction' => 'A conversation between two people set in an everyday social context',
        'audioUrl' => '/audio/section1.mp3',
        'groups' => [
            [
                'id' => 3,
                'title' => 'Questions 9-13',
                'instruction' => 'Complete the form below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.',
                'questions' => [
                    [
                        'id' => 9,
                        'number' => '9',
                        'type' => 'GAP_FILL',
                        'text' => 'Name: Sarah _______',
                        'correctAnswer' => 'Thompson',
                        'explanation' => 'The speaker clearly spells out "T-H-O-M-P-S-O-N" when asked for her surname.',
                    ],
                    [
                        'id' => 10,
                        'number' => '10',
                        'type' => 'GAP_FILL',
                        'text' => 'Phone number: _______',
                        'correctAnswer' => '07845 123456',
                        'explanation' => 'The phone number is dictated digit by digit in the conversation.',
                    ],
                    [
                        'id' => 11,
                        'number' => '11',
                        'type' => 'GAP_FILL',
                        'text' => 'Address: _______ Street',
                        'correctAnswer' => 'Oak',
                        'explanation' => 'Sarah mentions she lives on "Oak Street" when giving her address.',
                    ],
                    [
                        'id' => 12,
                        'number' => '12',
                        'type' => 'GAP_FILL',
                        'text' => 'Postcode: _______',
                        'correctAnswer' => 'SW1 4TA',
                        'explanation' => 'The postcode is spelled out as "S-W-1, space, 4-T-A".',
                    ],
                    [
                        'id' => 13,
                        'number' => '13',
                        'type' => 'GAP_FILL',
                        'text' => 'Email: sarah@_______',
                        'correctAnswer' => 'gmail.com',
                        'explanation' => 'Sarah provides her email as "sarah@gmail.com".',
                    ],
                ],
            ],
            [
                'id' => 4,
                'title' => 'Questions 14-18',
                'instruction' => 'Choose the correct letter, A, B or C.',
                'questions' => [
                    [
                        'id' => 14,
                        'number' => '14',
                        'type' => 'MULTIPLE_CHOICE',
                        'text' => 'What time does the tour start?',
                        'options' => ['A. 9:00 AM', 'B. 10:00 AM', 'C. 11:00 AM'],
                        'correctAnswer' => 'B. 10:00 AM',
                        'explanation' => 'The guide says "The tour begins at 10 o\'clock sharp, so please arrive a few minutes early."',
                    ],
                    [
                        'id' => 15,
                        'number' => '15',
                        'type' => 'MULTIPLE_CHOICE',
                        'text' => 'How long does the tour take?',
                        'options' => ['A. 1 hour', 'B. 2 hours', 'C. 3 hours'],
                        'correctAnswer' => 'B. 2 hours',
                        'explanation' => 'The speaker mentions "The whole tour lasts approximately two hours, including a short break."',
                    ],
                    [
                        'id' => 16,
                        'number' => '16',
                        'type' => 'MULTIPLE_CHOICE',
                        'text' => 'What is the cost per person?',
                        'options' => ['A. $15', 'B. $20', 'C. $25'],
                        'correctAnswer' => 'B. $20',
                        'explanation' => 'The price is stated as "twenty dollars per person" for the standard tour.',
                    ],
                    [
                        'id' => 17,
                        'number' => '17',
                        'type' => 'MULTIPLE_CHOICE',
                        'text' => 'What should visitors bring?',
                        'options' => ['A. Camera', 'B. Water bottle', 'C. Both A and B'],
                        'correctAnswer' => 'C. Both A and B',
                        'explanation' => 'The guide recommends "Don\'t forget to bring a camera for photos and a water bottle as we\'ll be walking quite a bit."',
                    ],
                    [
                        'id' => 18,
                        'number' => '18',
                        'type' => 'MULTIPLE_CHOICE',
                        'text' => 'Where do they meet?',
                        'options' => ['A. Main entrance', 'B. Café', 'C. Gift shop'],
                        'correctAnswer' => 'A. Main entrance',
                        'explanation' => 'The meeting point is specified: "We\'ll meet at the main entrance, just by the information desk."',
                    ],
                ],
            ],
        ],
    ],
];

// --------------------------------------------------------
// 3. WRITING DATA (from WritingTest.tsx)
// --------------------------------------------------------
$writing_data = [
    [
        'id' => 301,
        'type' => 'TASK_1',
        'title' => 'Writing Task 1',
        'minWords' => 150,
        'timeRecommendation' => 'You should spend about 20 minutes on this task.',
        'prompt' => 'The chart below shows the percentage of households in owned and rented accommodation in England and Wales between 1918 and 2011.

Summarise the information by selecting and reporting the main features, and make comparisons where relevant.

Write at least 150 words.',
        'imageUrl' => '/images/chart-task1.png',
    ],
    [
        'id' => 302,
        'type' => 'TASK_2',
        'title' => 'Writing Task 2',
        'minWords' => 250,
        'timeRecommendation' => 'You should spend about 40 minutes on this task.',
        'prompt' => 'Some people think that the best way to reduce crime is to give longer prison sentences. Others, however, believe there are better alternative ways of reducing crime.

Discuss both views and give your opinion.

Give reasons for your answer and include any relevant examples from your own knowledge or experience.

Write at least 250 words.',
    ],
];

// --------------------------------------------------------
// 4. SPEAKING DATA (from SpeakingTest.tsx)
// --------------------------------------------------------
$speaking_data = [
    [
        'id' => 401,
        'partNumber' => 1,
        'title' => 'Part 1: Introduction & Interview',
        'description' => 'The examiner will ask you general questions about yourself and a range of familiar topics.',
        'speakingTime' => 300, // 5 minutes
        'questions' => [
            'What is your full name?',
            'Where are you from?',
            'Do you work or study?',
            'What do you like about your job/studies?',
            'Let\'s talk about your hometown. What\'s special about it?',
            'Is there anything you would like to change about your hometown?',
        ],
    ],
    [
        'id' => 402,
        'partNumber' => 2,
        'title' => 'Part 2: Long Turn (Cue Card)',
        'description' => 'You will be given a topic card. You have 1 minute to prepare, then speak for 1-2 minutes.',
        'preparationTime' => 60, // 1 minute prep
        'speakingTime' => 120, // 2 minutes
        'questions' => [
            'Describe a place you have visited that you particularly liked.',
            '',
            'You should say:',
            '• where it was',
            '• when you went there',
            '• what you did there',
            '• and explain why you liked it so much',
        ],
    ],
    [
        'id' => 403,
        'partNumber' => 3,
        'title' => 'Part 3: Discussion',
        'description' => 'The examiner will ask further questions connected to the topic in Part 2.',
        'speakingTime' => 300, // 5 minutes
        'questions' => [
            'What types of places are popular for tourists in your country?',
            'Do you think tourism has a positive or negative impact on local communities?',
            'How do you think tourism will change in the future?',
            'What can be done to make tourism more sustainable?',
            'Do you think virtual tourism could replace real travel?',
        ],
    ],
];

// --------------------------------------------------------
// FULL EXAM DATA
// --------------------------------------------------------
$exam_data = [
    'id' => 1,
    'title' => 'IELTS Full Mock Test 01 (Academic)',
    'duration' => 10800, // 3 hours in seconds (deprecated, use durations instead)
    'durations' => [
        'reading' => 3600,   // 60 minutes
        'listening' => 2400, // 40 minutes
        'writing' => 3600,   // 60 minutes
        'speaking' => 900,   // 15 minutes
    ],
    'reading' => $reading_data,
    'listening' => $listening_data,
    'writing' => $writing_data,
    'speaking' => $speaking_data,
];

// ============================================================
// INSERT / UPDATE LOGIC
// ============================================================

$now = time();

// Helper function để in ra trình duyệt
function web_log($msg, $color = 'black') {
    echo "<div style='color: {$color}; margin-bottom: 5px;'>{$msg}</div>";
    flush(); // Đẩy output ra ngay lập tức
}

// 1. Process Main Exam
$existing = $DB->get_record('local_ielts_exams', ['name' => $exam_data['title']]);

if ($existing) {
    $record = new stdClass();
    $record->id = $existing->id;
    $record->name = $exam_data['title'];
    $record->content_json = json_encode($exam_data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    $record->timemodified = $now;

    $DB->update_record('local_ielts_exams', $record);
    web_log("Updated FULL exam: <b>{$exam_data['title']}</b> (ID: {$existing->id})", 'green');
} else {
    $record = new stdClass();
    $record->name = $exam_data['title'];
    $record->content_json = json_encode($exam_data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    $record->timecreated = $now;
    $record->timemodified = $now;

    // Cố gắng ép ID = 1 nếu chưa có (để React dễ gọi)
    if (!$DB->record_exists('local_ielts_exams', ['id' => 1])) {
        $record->id = 1;
        $id = $DB->insert_record_raw('local_ielts_exams', $record); // Dùng raw để ép ID
    } else {
        $id = $DB->insert_record('local_ielts_exams', $record);
    }
    
    web_log("Inserted FULL exam: <b>{$exam_data['title']}</b> (ID: {$id})", 'blue');
}

// 2. Process Individual Skill Exams
$skill_exams = [
    [
        'id' => 2, 
        'title' => 'IELTS Reading Practice Test 01', 
        'durations' => ['reading' => 3600], // 60 minutes
        'reading' => $exam_data['reading']
    ],
    [
        'id' => 3, 
        'title' => 'IELTS Listening Practice Test 01', 
        'durations' => ['listening' => 2400], // 40 minutes
        'listening' => $exam_data['listening']
    ],
    [
        'id' => 4,
        'title' => 'IELTS Writing Practice Test 01',
        'durations' => ['writing' => 3600], // 60 minutes
        'writing' => $exam_data['writing']
    ],
    [
        'id' => 5,
        'title' => 'IELTS Speaking Practice Test 01',
        'durations' => ['speaking' => 900], // 15 minutes
        'speaking' => $exam_data['speaking']
    ],
];

foreach ($skill_exams as $exam) {
    $existing = $DB->get_record('local_ielts_exams', ['name' => $exam['title']]);

    if ($existing) {
        $record = new stdClass();
        $record->id = $existing->id;
        $record->content_json = json_encode($exam, JSON_UNESCAPED_UNICODE);
        $record->timemodified = $now;
        $DB->update_record('local_ielts_exams', $record);
        web_log("Updated skill exam: {$exam['title']}", 'green');
    } else {
        $record = new stdClass();
        $record->name = $exam['title'];
        $record->content_json = json_encode($exam, JSON_UNESCAPED_UNICODE);
        $record->timecreated = $now;
        $record->timemodified = $now;
        $DB->insert_record('local_ielts_exams', $record);
        web_log("Inserted skill exam: {$exam['title']}", 'blue');
    }
}

echo "<hr><h3>✅ Seeding completed successfully!</h3>";
echo "<p><a href='../../index.php'>Go back to Plugin Page</a></p>";