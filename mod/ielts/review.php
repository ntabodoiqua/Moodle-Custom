<?php
/**
 * Trang review attempt
 */

require_once('../../config.php');
require_once($CFG->dirroot . '/mod/ielts/lib.php');

$id = required_param('id', PARAM_INT); // Course Module.
$attemptid = required_param('attemptid', PARAM_INT);

// query db lấy course module, course và instance của ielts
$cm = get_coursemodule_from_id('ielts', $id, 0, false, MUST_EXIST);
$course = $DB->get_record('course', ['id' => $cm->course], '*', MUST_EXIST);
$ielts = $DB->get_record('ielts', ['id' => $cm->instance], '*', MUST_EXIST);

require_login($course, true, $cm);

// lấy context
$context = context_module::instance($cm->id);

// kiểm tra quyền với bài thi
require_capability('mod/ielts:view', $context);

// query db lấy attempt.
$attempt = $DB->get_record('ielts_attempts', ['id' => $attemptid], '*', MUST_EXIST);

// kiểm tra attempt là đúng của bài thi.
if ($attempt->ieltsid != $ielts->id) {
    throw new moodle_exception('invalidattempt', 'mod_ielts');
}

// kiểm tra xem người dùng có thể xem attempt này (là attempt của chính họ hoặc có quyền chấm điểm).
if ($attempt->userid != $USER->id && !has_capability('mod/ielts:grade', $context)) {
    throw new moodle_exception('nopermission', 'mod_ielts');
}

// chuẩn bị cấu hình Moodle cho ứng dụng React ở chế độ review.
$scoredata = json_decode($attempt->score_data, true) ?: [];
$answersdata = [];
$scoringdata = null;
$questionresults = null;
$writingessays = null;
$speakingaudio = null;

// kiểm tra xem có phải định dạng chi tiết mới không
if (isset($scoredata['answers'])) {
    // định dạng chi tiết mới
    $answersdata = $scoredata['answers'];
    $scoringdata = $scoredata['scoring'] ?? null;
    $questionresults = $scoredata['questionResults'] ?? null;
    $writingessays = $scoredata['writingEssays'] ?? null;
    $speakingaudio = $scoredata['speakingAudio'] ?? null;
} else {
    // định dạng cũ - score_data chỉ là đối tượng answers
    $answersdata = $scoredata;
}

// nếu có thông tin chấm điểm, chuẩn bị dữ liệu chấm điểm.
$gradinginfo = null;
if (property_exists($attempt, 'writing_band') || property_exists($attempt, 'speaking_band')) {
    $gradinginfo = [
        'writing_band' => isset($attempt->writing_band) && $attempt->writing_band !== null ? (float) $attempt->writing_band : null,
        'speaking_band' => isset($attempt->speaking_band) && $attempt->speaking_band !== null ? (float) $attempt->speaking_band : null,
        'writing_feedback' => $attempt->writing_feedback ?? null,
        'speaking_feedback' => $attempt->speaking_feedback ?? null,
        'graded_by' => !empty($attempt->graded_by) ? (int) $attempt->graded_by : null,
        'timegraded' => !empty($attempt->timegraded) ? (int) $attempt->timegraded : null,
    ];
}

$moodleconfig = [
    'userId' => $USER->id,
    'sesskey' => sesskey(),
    'wwwroot' => $CFG->wwwroot,
    'apiEndpoint' => $CFG->wwwroot . '/mod/ielts/api.php',
    'instanceId' => (int) $ielts->id,
    'cmId' => (int) $cm->id,
    'courseId' => (int) $course->id,
    'examName' => $ielts->name,
    'canSubmit' => false,
    'reviewMode' => true,
    'attemptId' => (int) $attemptid,
    'attemptData' => [
        'band' => (float) $attempt->final_band,
        'timecreated' => (int) $attempt->timecreated,
        'timefinished' => (int) $attempt->timefinished,
        'answers' => $answersdata,
        'scoring' => $scoringdata,
        'questionResults' => $questionresults,
        'writingEssays' => $writingessays,
        'speakingAudio' => $speakingaudio,
        'grading' => $gradinginfo,
    ],
    'backUrl' => (new moodle_url('/mod/ielts/view.php', ['id' => $cm->id]))->out(false),
];

$configjson = json_encode($moodleconfig, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP);

// tìm file được tạo ra sau khi build React
$mainjs = '';
$maincss = '';
$indexhtml = file_get_contents($CFG->dirroot . '/mod/ielts/build/index.html');
if (preg_match('/src="[^"]*\/assets\/(index-[^"]+\.js)"/', $indexhtml, $matches)) {
    $mainjs = $matches[1];
}
if (preg_match('/href="[^"]*\/assets\/(index-[^"]+\.css)"/', $indexhtml, $matches)) {
    $maincss = $matches[1];
}

$cssurl = $maincss ? $CFG->wwwroot . '/mod/ielts/build/assets/' . $maincss : '';
$jsurl = $mainjs ? $CFG->wwwroot . '/mod/ielts/build/assets/' . $mainjs : '';

// xuất trang HTML
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo format_string($ielts->name); ?> - <?php echo get_string('review', 'mod_ielts'); ?></title>
    <?php if ($cssurl): ?>
    <!-- nhập css -->
    <link rel="stylesheet" href="<?php echo $cssurl; ?>"> 
    <?php endif; ?>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body, #root { height: 100%; width: 100%; }
    </style>
</head>
<body>
    <script>window.MoodleConfig = <?php echo $configjson; ?>;</script>
    <div id="root" data-moodle-config="<?php echo htmlspecialchars($configjson, ENT_QUOTES); ?>"></div>
    <!-- nhập js -->
    <?php if ($jsurl): ?>
    <script type="module" src="<?php echo $jsurl; ?>"></script>
    <?php endif; ?>
</body>
</html>
