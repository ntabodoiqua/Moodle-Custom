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
 * IELTS attempt review page.
 *
 * Displays the results of a completed attempt using React app.
 *
 * @package    mod_ielts
 * @copyright  2025 Your Name
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once('../../config.php');
require_once($CFG->dirroot . '/mod/ielts/lib.php');

// Get parameters.
$id = required_param('id', PARAM_INT); // Course Module ID.
$attemptid = required_param('attemptid', PARAM_INT);

// Get course module and context.
$cm = get_coursemodule_from_id('ielts', $id, 0, false, MUST_EXIST);
$course = $DB->get_record('course', ['id' => $cm->course], '*', MUST_EXIST);
$ielts = $DB->get_record('ielts', ['id' => $cm->instance], '*', MUST_EXIST);

// Require login.
require_login($course, true, $cm);

// Get context.
$context = context_module::instance($cm->id);

// Check capability.
require_capability('mod/ielts:view', $context);

// Get the attempt.
$attempt = $DB->get_record('ielts_attempts', ['id' => $attemptid], '*', MUST_EXIST);

// Verify the attempt belongs to this exam.
if ($attempt->ieltsid != $ielts->id) {
    throw new moodle_exception('invalidattempt', 'mod_ielts');
}

// Check if user can view this attempt (own attempt or has grade capability).
if ($attempt->userid != $USER->id && !has_capability('mod/ielts:grade', $context)) {
    throw new moodle_exception('nopermission', 'mod_ielts');
}

// Set up the page.
$PAGE->set_url('/mod/ielts/review.php', ['id' => $cm->id, 'attemptid' => $attemptid]);
$PAGE->set_title($course->shortname . ': ' . $ielts->name . ' - ' . get_string('review', 'mod_ielts'));
$PAGE->set_heading($course->fullname);
$PAGE->set_context($context);

// Use embedded layout for React app.
$PAGE->set_pagelayout('embedded');

// Prepare Moodle configuration for React app with review mode.
$moodleconfig = [
    'userId' => $USER->id,
    'sesskey' => sesskey(),
    'wwwroot' => $CFG->wwwroot,
    'apiEndpoint' => $CFG->wwwroot . '/mod/ielts/api.php',
    'instanceId' => (int) $ielts->id,
    'cmId' => (int) $cm->id,
    'courseId' => (int) $course->id,
    'examName' => $ielts->name,
    'canSubmit' => false, // Review mode - no submit.
    'reviewMode' => true,
    'attemptId' => (int) $attemptid,
    'attemptData' => [
        'band' => (float) $attempt->final_band,
        'timecreated' => (int) $attempt->timecreated,
        'timefinished' => (int) $attempt->timefinished,
        'answers' => json_decode($attempt->score_data, true) ?: [],
    ],
    'backUrl' => (new moodle_url('/mod/ielts/view.php', ['id' => $cm->id]))->out(false),
];

// Output page header.
echo $OUTPUT->header();

// Cache busting version.
$version = time();

// Inject global MoodleConfig for React app.
$configjson = json_encode($moodleconfig, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP);
echo html_writer::script("window.MoodleConfig = {$configjson};");

// Render React root div with data attribute backup.
echo html_writer::tag('div', '', [
    'id' => 'root',
    'data-moodle-config' => $configjson,
]);

// Include React build CSS.
echo html_writer::tag('link', '', [
    'rel' => 'stylesheet',
    'href' => new moodle_url('/mod/ielts/build/assets/index.css', ['v' => $version]),
]);

// Include vendor chunk first (React, React DOM, React Router).
echo html_writer::tag('script', '', [
    'type' => 'module',
    'src' => new moodle_url('/mod/ielts/build/assets/vendor.js', ['v' => $version]),
]);

// Include Ant Design chunk.
echo html_writer::tag('script', '', [
    'type' => 'module',
    'src' => new moodle_url('/mod/ielts/build/assets/antd.js', ['v' => $version]),
]);

// Include main React bundle.
echo html_writer::tag('script', '', [
    'type' => 'module',
    'src' => new moodle_url('/mod/ielts/build/assets/index.js', ['v' => $version]),
]);

// Output page footer.
echo $OUTPUT->footer();
