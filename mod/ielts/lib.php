<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Library of functions and constants for mod_ielts.
 *
 * @package    mod_ielts
 * @copyright  2025 Your Name
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Returns the information on whether the module supports a feature.
 *
 * @param string $feature FEATURE_xx constant for requested feature
 * @return mixed True if module supports feature, false if not, null if doesn't know or string for the module purpose.
 */
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

/**
 * Adds a new IELTS activity instance.
 *
 * Given an object containing all the necessary data,
 * (defined by the form in mod_form.php) this function
 * will create a new instance and return the id number
 * of the new instance.
 *
 * @param stdClass $ielts An object from the form in mod_form.php
 * @param mod_ielts_mod_form $mform The form instance
 * @return int The id of the newly inserted ielts record
 */
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

/**
 * Updates an existing IELTS activity instance.
 *
 * Given an object containing all the necessary data,
 * (defined by the form in mod_form.php) this function
 * will update an existing instance with new data.
 *
 * @param stdClass $ielts An object from the form in mod_form.php
 * @param mod_ielts_mod_form $mform The form instance
 * @return bool True on success
 */
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

/**
 * Deletes an IELTS activity instance.
 *
 * Given an ID of an instance of this module,
 * this function will permanently delete the instance
 * and any data that depends on it.
 *
 * @param int $id Id of the module instance
 * @return bool True on success
 */
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

/**
 * Returns a small object with summary information about what a
 * user has done with a given particular instance of this module.
 *
 * Used for user activity reports.
 *
 * @param stdClass $course The course record
 * @param stdClass $user The user record
 * @param cm_info|stdClass $mod The course module info object or record
 * @param stdClass $ielts The ielts instance record
 * @return stdClass|null A standard object with info or null
 */
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

/**
 * Prints a detailed representation of what a user has done with
 * a given particular instance of this module.
 *
 * @param stdClass $course The course record
 * @param stdClass $user The user record
 * @param cm_info|stdClass $mod The course module info object or record
 * @param stdClass $ielts The ielts instance record
 */
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
 * Given a course_module object, this function returns any
 * "extra" information that may be needed when printing
 * this activity in a course listing.
 *
 * @param cm_info $coursemodule The coursemodule object
 * @return cached_cm_info|null Info to customise main page display
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

// ============================================================
// GRADEBOOK FUNCTIONS
// ============================================================

/**
 * Create/update grade item for given IELTS activity.
 *
 * @category grade
 * @param stdClass $ielts The ielts instance
 * @param mixed $grades Optional array/object of grade(s); 'reset' means reset grades in gradebook
 * @return int 0 if ok, error code otherwise
 */
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

/**
 * Delete grade item for given IELTS activity.
 *
 * @category grade
 * @param stdClass $ielts The ielts instance
 * @return int 0 if ok, error code otherwise
 */
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
 * Update grades in the gradebook.
 *
 * @category grade
 * @param stdClass $ielts The ielts instance
 * @param int $userid Specific user only, 0 means all users
 * @param bool $nullifnone If true and user has no grade, a null grade is inserted
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
 * Get user grades for a specific IELTS activity.
 *
 * Returns the highest band score from user's attempts.
 *
 * @param stdClass $ielts The ielts instance
 * @param int $userid Specific user id, 0 for all users
 * @return array Array of grade objects indexed by userid
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

    // Get best (highest) band score for each user.
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

/**
 * Rescale all grades for this activity and push the new grades to the gradebook.
 *
 * @param stdClass $ielts The ielts instance
 * @param float $oldgrade Old maximum grade
 * @param float $newgrade New maximum grade
 * @return bool True on success
 */
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

// ============================================================
// FILE HANDLING (for intro)
// ============================================================

/**
 * Serves the files from the ielts file areas.
 *
 * @param stdClass $course The course object
 * @param stdClass $cm The course module object
 * @param context $context The context
 * @param string $filearea The file area
 * @param array $args Extra arguments
 * @param bool $forcedownload Whether or not force download
 * @param array $options Additional options affecting the file serving
 * @return bool False if file not found, does not return if found - just sends the file
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

// ============================================================
// COMPLETION FUNCTIONS
// ============================================================

/**
 * Obtains the automatic completion state for this ielts based on any conditions
 * in ielts settings.
 *
 * @param stdClass $course Course record
 * @param cm_info|stdClass $cm Course-module record
 * @param int $userid User ID
 * @param bool $type Type of comparison (or/and; can be used as return value if no conditions)
 * @return bool True if completed, false if not
 */
function ielts_get_completion_state($course, $cm, $userid, $type) {
    global $DB;

    // Check if user has at least one completed attempt.
    $hasattempt = $DB->record_exists('ielts_attempts', [
        'ieltsid' => $cm->instance,
        'userid' => $userid,
    ]);

    return $hasattempt;
}

// ============================================================
// VIEW TRACKING
// ============================================================

/**
 * Mark the activity as viewed and trigger the course_module_viewed event.
 *
 * @param stdClass $ielts The ielts instance
 * @param stdClass $course The course object
 * @param cm_info|stdClass $cm The course module info object
 * @param context_module $context The context
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

// ============================================================
// RECENT ACTIVITY
// ============================================================

/**
 * Returns all other caps used in the module.
 *
 * @return array Array of capabilities
 */
function ielts_get_extra_capabilities() {
    return ['moodle/site:accessallgroups'];
}

/**
 * Implementation of the function for printing the form elements that control
 * whether the course reset functionality affects the ielts.
 *
 * @param MoodleQuickForm $mform The form object
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
