<?php
/**
 * Thư viện chức năng cho module IELTS.
 */

defined('MOODLE_INTERNAL') || die();


// Trả về thông tin về việc module có hỗ trợ một tính năng hay không.
function ielts_supports($feature) {
    switch ($feature) {
        case FEATURE_MOD_INTRO:
            return true;
        case FEATURE_SHOW_DESCRIPTION:
            return true;
        case FEATURE_GRADE_HAS_GRADE:
            return true;
        case FEATURE_GRADE_OUTCOMES:
            return false;
        case FEATURE_BACKUP_MOODLE2:
            return true;
        case FEATURE_COMPLETION_TRACKS_VIEWS:
            return true;
        case FEATURE_COMPLETION_HAS_RULES:
            return true;
        case FEATURE_PLAGIARISM:
            return false;
        case FEATURE_ADVANCED_GRADING:
            return false;
        case FEATURE_GROUPS:
            return false;
        case FEATURE_GROUPINGS:
            return false;
        case FEATURE_MOD_PURPOSE:
            return MOD_PURPOSE_ASSESSMENT;
        default:
            return null;
    }
}

// Thêm một instance mới của activity IELTS.
function ielts_add_instance($ielts, $mform = null) {
    global $DB;

    $ielts->timecreated = time();
    $ielts->timemodified = time();

    // Ensure grade is set (default to 9 for IELTS band scale).
    if (!isset($ielts->grade)) {
        $ielts->grade = 9;
    }

    // Insert the record.
    $ielts->id = $DB->insert_record('ielts', $ielts);

    // Update grade item in gradebook.
    ielts_grade_item_update($ielts);

    return $ielts->id;
}

// cập nhật một instance IELTS đã tồn tại.

function ielts_update_instance($ielts, $mform = null) {
    global $DB;

    $ielts->timemodified = time();
    $ielts->id = $ielts->instance;

    // Update the record.
    $result = $DB->update_record('ielts', $ielts);

    // Update grade item in gradebook.
    ielts_grade_item_update($ielts);

    return $result;
}

// Xoá một instance của activity IELTS.
function ielts_delete_instance($id) {
    global $DB;

    if (!$ielts = $DB->get_record('ielts', ['id' => $id])) {
        return false;
    }

    // Delete all attempts for this instance.
    $DB->delete_records('ielts_attempts', ['ieltsid' => $id]);

    // Delete the instance.
    $DB->delete_records('ielts', ['id' => $id]);

    // Delete grade item.
    ielts_grade_item_delete($ielts);

    return true;
}

// trả về thông tin tóm tắt về những gì người dùng đã làm với một instance cụ thể của module này.
function ielts_user_outline($course, $user, $mod, $ielts) {
    global $DB;

    $result = new stdClass();

    // Get user's best attempt.
    $attempts = $DB->get_records('ielts_attempts', [
        'ieltsid' => $ielts->id,
        'userid' => $user->id,
    ], 'final_band DESC', 'id, final_band, timefinished', 0, 1);

    if ($attempts) {
        $bestattempt = reset($attempts);
        $result->info = get_string('band', 'mod_ielts') . ': ' . $bestattempt->final_band;
        $result->time = $bestattempt->timefinished;
    } else {
        $result->info = get_string('noattempts', 'mod_ielts');
    }

    return $result;
}

// in ra một bản chi tiết về những gì người dùng đã làm với một instance cụ thể của module này.
function ielts_user_complete($course, $user, $mod, $ielts) {
    global $DB, $OUTPUT;

    $attempts = $DB->get_records('ielts_attempts', [
        'ieltsid' => $ielts->id,
        'userid' => $user->id,
    ], 'timecreated DESC');

    if ($attempts) {
        echo $OUTPUT->heading(get_string('yourattempts', 'mod_ielts'), 3);

        $table = new html_table();
        $table->head = [
            get_string('attempt', 'mod_ielts'),
            get_string('band', 'mod_ielts'),
            get_string('date', 'mod_ielts'),
        ];

        $i = count($attempts);
        foreach ($attempts as $attempt) {
            $table->data[] = [
                $i--,
                $attempt->final_band,
                userdate($attempt->timefinished ?? $attempt->timecreated),
            ];
        }

        echo html_writer::table($table);
    } else {
        echo get_string('noattempts', 'mod_ielts');
    }
}

/**
 * lấy thông tin course module cho ielts.
 */
function ielts_get_coursemodule_info($coursemodule) {
    global $DB;

    $ielts = $DB->get_record('ielts', ['id' => $coursemodule->instance],
        'id, name, intro, introformat');

    if (!$ielts) {
        return null;
    }

    $info = new cached_cm_info();
    $info->name = $ielts->name;

    if ($coursemodule->showdescription) {
        $info->content = format_module_intro('ielts', $ielts, $coursemodule->id, false);
    }

    return $info;
}

// tao hoặc cập nhật mục đánh giá cho activity IELTS đã cho.
function ielts_grade_item_update($ielts, $grades = null) {
    global $CFG;
    require_once($CFG->libdir . '/gradelib.php');

    $params = [
        'itemname' => $ielts->name,
    ];

    if (property_exists($ielts, 'cmidnumber')) {
        $params['idnumber'] = $ielts->cmidnumber;
    }

    // IELTS uses a 0-9 band scale.
    $maxgrade = isset($ielts->grade) ? $ielts->grade : 9;

    if ($maxgrade > 0) {
        $params['gradetype'] = GRADE_TYPE_VALUE;
        $params['grademax'] = $maxgrade;
        $params['grademin'] = 0;
    } else {
        $params['gradetype'] = GRADE_TYPE_NONE;
    }

    if ($grades === 'reset') {
        $params['reset'] = true;
        $grades = null;
    }

    return grade_update(
        'mod/ielts',
        $ielts->course,
        'mod',
        'ielts',
        $ielts->id,
        0,
        $grades,
        $params
    );
}

// Xoá mục đánh giá cho activity IELTS đã cho.
function ielts_grade_item_delete($ielts) {
    global $CFG;
    require_once($CFG->libdir . '/gradelib.php');

    return grade_update(
        'mod/ielts',
        $ielts->course,
        'mod',
        'ielts',
        $ielts->id,
        0,
        null,
        ['deleted' => 1]
    );
}

/**
 * Cập nhật điểm cho người dùng cụ thể hoặc tất cả người dùng.
 */
function ielts_update_grades($ielts, $userid = 0, $nullifnone = true) {
    global $CFG, $DB;
    require_once($CFG->libdir . '/gradelib.php');

    if ($grades = ielts_get_user_grades($ielts, $userid)) {
        ielts_grade_item_update($ielts, $grades);
    } else if ($userid && $nullifnone) {
        $grade = new stdClass();
        $grade->userid = $userid;
        $grade->rawgrade = null;
        ielts_grade_item_update($ielts, $grade);
    } else {
        ielts_grade_item_update($ielts);
    }
}

/**
 * Lấy điểm của người dùng cho một hoạt động IELTS cụ thể.
 * Trả về điểm cao nhất từ các lần thử của người dùng.
 */
function ielts_get_user_grades($ielts, $userid = 0) {
    global $DB;

    $grades = [];

    $params = ['ieltsid' => $ielts->id];
    $userwhere = '';

    if ($userid) {
        $params['userid'] = $userid;
        $userwhere = 'AND userid = :userid';
    }

    // Lấy điểm cao nhấtcho mỗi người dùng.
    $sql = "SELECT userid, MAX(final_band) as rawgrade, MAX(timefinished) as datesubmitted
              FROM {ielts_attempts}
             WHERE ieltsid = :ieltsid
                   AND final_band IS NOT NULL
                   $userwhere
          GROUP BY userid";

    $userresults = $DB->get_records_sql($sql, $params);

    foreach ($userresults as $result) {
        $grades[$result->userid] = (object) [
            'userid' => $result->userid,
            'rawgrade' => $result->rawgrade,
            'datesubmitted' => $result->datesubmitted,
        ];
    }

    return $grades;
}

// tính toán lại điểm khi thay đổi thang điểm của activity.
function ielts_rescale_activity_grades($ielts, $oldgrade, $newgrade) {
    global $DB;

    if ($oldgrade == 0 || $newgrade == 0) {
        return true;
    }

    // Rescale all band scores.
    $factor = $newgrade / $oldgrade;

    $sql = "UPDATE {ielts_attempts}
               SET final_band = final_band * :factor
             WHERE ieltsid = :ieltsid";

    $DB->execute($sql, ['factor' => $factor, 'ieltsid' => $ielts->id]);

    // Update all grades in gradebook.
    ielts_update_grades($ielts);

    return true;
}

/**
 * phục vụ các file từ các khu vực tệp của module IELTS.
 */
function ielts_pluginfile($course, $cm, $context, $filearea, $args, $forcedownload, array $options = []) {
    if ($context->contextlevel != CONTEXT_MODULE) {
        return false;
    }

    require_login($course, true, $cm);

    if ($filearea !== 'intro') {
        return false;
    }

    $fs = get_file_storage();
    $relativepath = implode('/', $args);
    $fullpath = "/{$context->id}/mod_ielts/$filearea/0/$relativepath";

    $file = $fs->get_file_by_hash(sha1($fullpath));
    if (!$file || $file->is_directory()) {
        return false;
    }

    send_stored_file($file, 0, 0, $forcedownload, $options);
}

/**
 * lấy trạng thái hoàn thành của người dùng cho activity IELTS cụ thể.
 */
function ielts_get_completion_state($course, $cm, $userid, $type) {
    global $DB;

    // Get the IELTS instance.
    $ielts = $DB->get_record('ielts', ['id' => $cm->instance], '*', MUST_EXIST);
    
    $result = $type; // Default to passed type (or/and)

    // Basic completion: check if user has at least one completed attempt.
    if (!empty($cm->customdata['customcompletionrules']['completionsubmit'])) {
        $hasattempt = $DB->record_exists('ielts_attempts', [
            'ieltsid' => $cm->instance,
            'userid' => $userid,
        ]);
        $result = $result && $hasattempt;
    }

    // Completion rule: minimum grade/band score required.
    if (!empty($cm->customdata['customcompletionrules']['completionusegrade'])) {
        $requiredgrade = floatval($cm->customdata['customcompletionrules']['completionmingrade'] ?? 0);
        
        if ($requiredgrade > 0) {
            // Get user's best attempt.
            $bestband = $DB->get_field('ielts_attempts', 'MAX(final_band)', [
                'ieltsid' => $cm->instance,
                'userid' => $userid,
            ]);
            
            $gradeachieved = ($bestband && $bestband >= $requiredgrade);
            $result = $result && $gradeachieved;
        }
    }

    // Completion rule: pass grade required.
    if (!empty($cm->customdata['customcompletionrules']['completionpassgrade'])) {
        $passgrade = grade_get_setting($course->id, 'mingradetopass', $cm->instance, $ielts->grade * 0.6); // Default 60%
        
        // Get user's best attempt.
        $bestband = $DB->get_field('ielts_attempts', 'MAX(final_band)', [
            'ieltsid' => $cm->instance,
            'userid' => $userid,
        ]);
        
        $passachieved = ($bestband && $bestband >= $passgrade);
        $result = $result && $passachieved;
    }

    return $result;
}

/**
 * Lấy mô tả các quy tắc hoàn thành đang hoạt động cho activity IELTS cụ thể.
 */
function ielts_completion_get_active_rule_descriptions($cm) {
    if (empty($cm->customdata['customcompletionrules']) || $cm->completion != COMPLETION_TRACKING_AUTOMATIC) {
        return [];
    }

    $descriptions = [];
    
    // Submit attempt rule.
    if (!empty($cm->customdata['customcompletionrules']['completionsubmit'])) {
        $descriptions[] = get_string('completiondetail:submit', 'mod_ielts');
    }
    
    // Minimum grade rule.
    if (!empty($cm->customdata['customcompletionrules']['completionusegrade'])) {
        $mingrade = $cm->customdata['customcompletionrules']['completionmingrade'] ?? 0;
        $descriptions[] = get_string('completiondetail:grade', 'mod_ielts', $mingrade);
    }
    
    // Pass grade rule.
    if (!empty($cm->customdata['customcompletionrules']['completionpassgrade'])) {
        $descriptions[] = get_string('completiondetail:passgrade', 'mod_ielts');
    }
    
    return $descriptions;
}


/**
 * Đánh dấu hoạt động đã được xem và kích hoạt sự kiện course_module_viewed.
 */
function ielts_view($ielts, $course, $cm, $context) {
    // Trigger course_module_viewed event.
    $params = [
        'context' => $context,
        'objectid' => $ielts->id,
    ];

    $event = \mod_ielts\event\course_module_viewed::create($params);
    $event->add_record_snapshot('course_modules', $cm);
    $event->add_record_snapshot('course', $course);
    $event->add_record_snapshot('ielts', $ielts);
    $event->trigger();

    // Mark viewed for completion tracking.
    $completion = new completion_info($course);
    $completion->set_module_viewed($cm);
}

/**
 * Trả về tất cả các quyền khác được sử dụng trong module.
 */
function ielts_get_extra_capabilities() {
    return ['moodle/site:accessallgroups'];
}

/**
 * triển khai 
 */
function ielts_reset_course_form_definition(&$mform) {
    $mform->addElement('header', 'ieltsheader', get_string('modulenameplural', 'mod_ielts'));
    $mform->addElement('checkbox', 'reset_ielts_attempts', get_string('deleteallattempts', 'mod_ielts'));
}

/**
 * Course reset form defaults.
 *
 * @param stdClass $course The course object
 * @return array Array of defaults
 */
function ielts_reset_course_form_defaults($course) {
    return ['reset_ielts_attempts' => 1];
}

/**
 * Actual implementation of the reset course functionality.
 *
 * @param stdClass $data The data submitted from the reset course form
 * @return array Status array
 */
function ielts_reset_userdata($data) {
    global $DB;

    $status = [];

    if (!empty($data->reset_ielts_attempts)) {
        // Get all ielts instances in the course.
        $ieltsinstances = $DB->get_records('ielts', ['course' => $data->courseid], '', 'id');

        foreach ($ieltsinstances as $ielts) {
            // Delete attempts.
            $DB->delete_records('ielts_attempts', ['ieltsid' => $ielts->id]);

            // Reset grades in gradebook.
            ielts_grade_item_update((object) ['id' => $ielts->id, 'course' => $data->courseid, 'name' => '', 'grade' => 9], 'reset');
        }

        $status[] = [
            'component' => get_string('modulenameplural', 'mod_ielts'),
            'item' => get_string('deleteallattempts', 'mod_ielts'),
            'error' => false,
        ];
    }

    return $status;
}

// ============================================================
// FILE SERVING
// ============================================================

/**
 * Serve the files from the IELTS file areas.
 *
 * @param stdClass $course The course object
 * @param stdClass $cm The course module object
 * @param stdClass $context The context object
 * @param string $filearea The name of the file area
 * @param array $args Extra arguments (itemid, path)
 * @param bool $forcedownload Whether or not force download
 * @param array $options Additional options affecting the file serving
 * @return bool false if the file not found, just send the file otherwise and do not return anything
 */
function mod_ielts_pluginfile($course, $cm, $context, $filearea, array $args, $forcedownload, array $options = array()) {
    global $CFG, $DB, $USER;

    if ($context->contextlevel != CONTEXT_MODULE) {
        return false;
    }

    require_login($course, true, $cm);

    // Check capability to view the module.
    require_capability('mod/ielts:view', $context);

    if ($filearea !== 'speaking_audio') {
        return false;
    }

    $itemid = array_shift($args);
    $filename = array_pop($args);
    $filepath = $args ? '/' . implode('/', $args) . '/' : '/';

    // Get the file.
    $fs = get_file_storage();
    $file = $fs->get_file($context->id, 'mod_ielts', $filearea, $itemid, $filepath, $filename);

    if (!$file) {
        return false;
    }

    // For speaking audio, verify the user can access this file.
    // Users can only access their own audio files, or teachers can access all.
    $can_access = false;

    // Check if user owns this file.
    if ($file->get_userid() == $USER->id) {
        $can_access = true;
    }

    // Check if user has grading capability (teachers).
    if (has_capability('mod/ielts:grade', $context)) {
        $can_access = true;
    }

    if (!$can_access) {
        return false;
    }

    // Send the file.
    send_stored_file($file, 86400, 0, $forcedownload, $options);
}
