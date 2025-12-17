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
 * IELTS activity view page.
 *
 * Shows attempt history and allows starting new attempts or reviewing past ones.
 *
 * @package    mod_ielts
 * @copyright  2025 Your Name
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once('../../config.php');
require_once($CFG->dirroot . '/mod/ielts/lib.php');

// Get course module id or instance id.
$id = optional_param('id', 0, PARAM_INT); // Course Module ID.
$i  = optional_param('i', 0, PARAM_INT);  // IELTS instance ID.
$action = optional_param('action', '', PARAM_ALPHA); // Action: 'attempt' to start exam.

if ($id) {
    $cm = get_coursemodule_from_id('ielts', $id, 0, false, MUST_EXIST);
    $course = $DB->get_record('course', ['id' => $cm->course], '*', MUST_EXIST);
    $ielts = $DB->get_record('ielts', ['id' => $cm->instance], '*', MUST_EXIST);
} else if ($i) {
    $ielts = $DB->get_record('ielts', ['id' => $i], '*', MUST_EXIST);
    $course = $DB->get_record('course', ['id' => $ielts->course], '*', MUST_EXIST);
    $cm = get_coursemodule_from_instance('ielts', $ielts->id, $course->id, false, MUST_EXIST);
} else {
    throw new moodle_exception('invalidieltsid', 'mod_ielts');
}

// Require login and course access.
require_login($course, true, $cm);

// Get module context.
$context = context_module::instance($cm->id);

// Check view capability.
require_capability('mod/ielts:view', $context);

// Trigger view event and mark as viewed for completion.
ielts_view($ielts, $course, $cm, $context);

// Check if exam content is configured.
$examConfigured = !empty($ielts->content_json);

// If action is 'attempt', go directly to the exam (React app).
if ($action === 'attempt' && $examConfigured) {
    render_exam_page($ielts, $cm, $course, $context);
    exit;
}

// Otherwise, show the overview page with attempts.
render_overview_page($ielts, $cm, $course, $context, $examConfigured);

/**
 * Render the exam page with React app.
 */
function render_exam_page($ielts, $cm, $course, $context) {
    global $PAGE, $OUTPUT, $USER, $CFG;

    // Set up the page.
    $PAGE->set_url('/mod/ielts/view.php', ['id' => $cm->id, 'action' => 'attempt']);
    $PAGE->set_title($course->shortname . ': ' . $ielts->name);
    $PAGE->set_heading($course->fullname);
    $PAGE->set_context($context);

    // Use embedded layout to hide Moodle chrome for React app.
    $PAGE->set_pagelayout('embedded');

    // Prepare Moodle configuration for React app.
    $moodleconfig = [
        'userId' => $USER->id,
        'sesskey' => sesskey(),
        'wwwroot' => $CFG->wwwroot,
        'apiEndpoint' => $CFG->wwwroot . '/mod/ielts/api.php',
        'instanceId' => (int) $ielts->id,
        'cmId' => (int) $cm->id,
        'courseId' => (int) $course->id,
        'examName' => $ielts->name,
        'canSubmit' => has_capability('mod/ielts:submit', $context),
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
}

/**
 * Render the overview page with attempt history.
 */
function render_overview_page($ielts, $cm, $course, $context, $examConfigured) {
    global $PAGE, $OUTPUT, $USER, $DB;

    // Set up the page.
    $PAGE->set_url('/mod/ielts/view.php', ['id' => $cm->id]);
    $PAGE->set_title($course->shortname . ': ' . $ielts->name);
    $PAGE->set_heading($course->fullname);
    $PAGE->set_context($context);

    // Use standard layout.
    $PAGE->set_pagelayout('standard');

    // Output page header.
    echo $OUTPUT->header();

    // Show activity name and intro.
    echo html_writer::tag('h2', format_string($ielts->name), ['class' => 'ielts-title mb-3']);

    if (!empty($ielts->intro)) {
        echo html_writer::div(format_module_intro('ielts', $ielts, $cm->id), 'ielts-intro mb-4');
    }

    // If exam is not configured, show message.
    if (!$examConfigured) {
        echo $OUTPUT->notification(get_string('examnotconfigured', 'mod_ielts'), 'warning');
        echo $OUTPUT->footer();
        return;
    }

    // Get user's attempts.
    $attempts = $DB->get_records('ielts_attempts', [
        'ieltsid' => $ielts->id,
        'userid' => $USER->id,
    ], 'timecreated DESC');

    // Display attempt summary.
    $attemptcount = count($attempts);
    $bestband = 0;

    if ($attemptcount > 0) {
        foreach ($attempts as $attempt) {
            if ($attempt->final_band > $bestband) {
                $bestband = $attempt->final_band;
            }
        }
    }

    // Summary card.
    echo html_writer::start_div('card mb-4');
    echo html_writer::start_div('card-body');
    echo html_writer::tag('h5', get_string('yourattempts', 'mod_ielts'), ['class' => 'card-title']);

    echo html_writer::start_div('row');
    echo html_writer::start_div('col-md-4 text-center py-3');
    echo html_writer::tag('div', $attemptcount, ['class' => 'display-4 text-primary']);
    echo html_writer::tag('div', get_string('totalattempts', 'mod_ielts'), ['class' => 'text-muted']);
    echo html_writer::end_div();

    echo html_writer::start_div('col-md-4 text-center py-3');
    echo html_writer::tag('div', number_format($bestband, 1), ['class' => 'display-4 text-success']);
    echo html_writer::tag('div', get_string('bestband', 'mod_ielts'), ['class' => 'text-muted']);
    echo html_writer::end_div();

    echo html_writer::start_div('col-md-4 text-center d-flex align-items-center justify-content-center py-3');
    $attempturl = new moodle_url('/mod/ielts/view.php', ['id' => $cm->id, 'action' => 'attempt']);
    echo html_writer::link($attempturl,
        '<i class="fa fa-play-circle mr-2"></i>' . get_string('startnewattempt', 'mod_ielts'),
        ['class' => 'btn btn-primary btn-lg']
    );
    echo html_writer::end_div();
    echo html_writer::end_div();

    echo html_writer::end_div();
    echo html_writer::end_div();

    // Attempt history table.
    if ($attemptcount > 0) {
        echo html_writer::start_div('card');
        echo html_writer::start_div('card-body');
        echo html_writer::tag('h5', get_string('attempthistory', 'mod_ielts'), ['class' => 'card-title']);

        echo html_writer::start_tag('div', ['class' => 'table-responsive']);
        echo html_writer::start_tag('table', ['class' => 'table table-striped table-hover']);
        echo html_writer::start_tag('thead', ['class' => 'thead-light']);
        echo html_writer::start_tag('tr');
        echo html_writer::tag('th', '#');
        echo html_writer::tag('th', get_string('datestarted', 'mod_ielts'));
        echo html_writer::tag('th', get_string('datefinished', 'mod_ielts'));
        echo html_writer::tag('th', get_string('bandscore', 'mod_ielts'));
        echo html_writer::tag('th', get_string('status', 'mod_ielts'));
        echo html_writer::tag('th', get_string('actions', 'mod_ielts'));
        echo html_writer::end_tag('tr');
        echo html_writer::end_tag('thead');

        echo html_writer::start_tag('tbody');

        $num = $attemptcount;
        foreach ($attempts as $attempt) {
            echo html_writer::start_tag('tr');

            // Attempt number.
            echo html_writer::tag('td', $num);

            // Date started.
            echo html_writer::tag('td', userdate($attempt->timecreated, get_string('strftimedatetime', 'langconfig')));

            // Date finished.
            if ($attempt->timefinished) {
                echo html_writer::tag('td', userdate($attempt->timefinished, get_string('strftimedatetime', 'langconfig')));
            } else {
                echo html_writer::tag('td', '-');
            }

            // Band score.
            if ($attempt->final_band !== null) {
                $bandclass = 'badge ';
                if ($attempt->final_band >= 7) {
                    $bandclass .= 'badge-success';
                } else if ($attempt->final_band >= 5) {
                    $bandclass .= 'badge-warning';
                } else {
                    $bandclass .= 'badge-secondary';
                }
                echo html_writer::tag('td',
                    html_writer::span(number_format($attempt->final_band, 1), $bandclass . ' p-2')
                );
            } else {
                echo html_writer::tag('td', '-');
            }

            // Status.
            if ($attempt->timefinished) {
                echo html_writer::tag('td',
                    html_writer::span(get_string('completed', 'mod_ielts'), 'badge badge-success p-2')
                );
            } else {
                echo html_writer::tag('td',
                    html_writer::span(get_string('inprogress', 'mod_ielts'), 'badge badge-info p-2')
                );
            }

            // Actions.
            echo html_writer::start_tag('td');
            if ($attempt->timefinished && !empty($attempt->score_data)) {
                $reviewurl = new moodle_url('/mod/ielts/review.php', [
                    'id' => $cm->id,
                    'attemptid' => $attempt->id,
                ]);
                echo html_writer::link($reviewurl,
                    '<i class="fa fa-eye mr-1"></i>' . get_string('review', 'mod_ielts'),
                    ['class' => 'btn btn-sm btn-outline-primary']
                );
            }
            echo html_writer::end_tag('td');

            echo html_writer::end_tag('tr');
            $num--;
        }

        echo html_writer::end_tag('tbody');
        echo html_writer::end_tag('table');
        echo html_writer::end_tag('div');

        echo html_writer::end_div();
        echo html_writer::end_div();
    } else {
        // No attempts yet.
        echo html_writer::start_div('alert alert-info');
        echo html_writer::tag('i', '', ['class' => 'fa fa-info-circle mr-2']);
        echo get_string('noattemptsyet', 'mod_ielts');
        echo html_writer::end_div();
    }

    // Output page footer.
    echo $OUTPUT->footer();
}
