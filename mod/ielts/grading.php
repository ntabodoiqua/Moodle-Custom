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
 * IELTS manual grading page for Writing and Speaking.
 *
 * @package    mod_ielts
 * @copyright  2025 Your Name
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once('../../config.php');
require_once($CFG->dirroot . '/mod/ielts/lib.php');

// Get parameters.
$id = required_param('id', PARAM_INT); // Course Module ID.
$attemptid = optional_param('attemptid', 0, PARAM_INT); // Specific attempt to grade.

// Get course module and context.
$cm = get_coursemodule_from_id('ielts', $id, 0, false, MUST_EXIST);
$course = $DB->get_record('course', ['id' => $cm->course], '*', MUST_EXIST);
$ielts = $DB->get_record('ielts', ['id' => $cm->instance], '*', MUST_EXIST);

// Require login and grading capability.
require_login($course, true, $cm);
$context = context_module::instance($cm->id);
require_capability('mod/ielts:grade', $context);

// Set up the page.
$PAGE->set_url('/mod/ielts/grading.php', ['id' => $id]);
$PAGE->set_title($course->shortname . ': ' . $ielts->name . ' - ' . get_string('grading', 'mod_ielts'));
$PAGE->set_heading($course->fullname);
$PAGE->set_context($context);
$PAGE->set_pagelayout('standard');

// Add CSS.
$PAGE->requires->css('/mod/ielts/styles.css');

// If specific attempt is selected, show grading form.
if ($attemptid) {
    grade_attempt_page($ielts, $cm, $course, $context, $attemptid);
} else {
    // Show list of attempts to grade.
    show_grading_list($ielts, $cm, $course, $context);
}

/**
 * Show list of attempts that need grading.
 */
function show_grading_list($ielts, $cm, $course, $context) {
    global $PAGE, $OUTPUT, $DB;

    echo $OUTPUT->header();

    // Title and navigation.
    echo html_writer::start_div('d-flex justify-content-between align-items-center mb-4');
    echo html_writer::tag('h2', get_string('manualgrading', 'mod_ielts'));
    $backurl = new moodle_url('/mod/ielts/view.php', ['id' => $cm->id]);
    echo html_writer::link($backurl, '<i class="fa fa-arrow-left mr-2"></i>' . get_string('backtooverview', 'mod_ielts'), 
        ['class' => 'btn btn-secondary']);
    echo html_writer::end_div();

    // Get exam data to check which skills are available.
    $examdata = json_decode($ielts->content_json, true);
    $haswriting = !empty($examdata['writing']);
    $hasspeaking = !empty($examdata['speaking']);

    if (!$haswriting && !$hasspeaking) {
        echo $OUTPUT->notification(get_string('nomanualgradingrequired', 'mod_ielts'), 'info');
        echo $OUTPUT->footer();
        return;
    }

    // Get all user name fields for fullname() function.
    $userfields = \core_user\fields::for_name()->with_userpic()->including('email')->get_sql('u', false, '', '', false)->selects;

    // Get all completed attempts for this activity.
    $sql = "SELECT a.*, $userfields
            FROM {ielts_attempts} a
            JOIN {user} u ON u.id = a.userid
            WHERE a.ieltsid = :ieltsid
            AND a.timefinished IS NOT NULL
            ORDER BY a.timefinished DESC";

    $attempts = $DB->get_records_sql($sql, ['ieltsid' => $ielts->id]);

    if (empty($attempts)) {
        echo $OUTPUT->notification(get_string('noattemptstograge', 'mod_ielts'), 'info');
        echo $OUTPUT->footer();
        return;
    }

    // Summary cards.
    $totalattempts = count($attempts);
    $needsgrading = 0;
    $fullygraded = 0;

    foreach ($attempts as $attempt) {
        $needsmanual = false;
        if ($haswriting && $attempt->writing_band === null) {
            $needsmanual = true;
        }
        if ($hasspeaking && $attempt->speaking_band === null) {
            $needsmanual = true;
        }
        if ($needsmanual) {
            $needsgrading++;
        } else {
            $fullygraded++;
        }
    }

    // Summary cards row.
    echo html_writer::start_div('row mb-4');
    
    echo html_writer::start_div('col-md-4');
    echo html_writer::start_div('card text-center');
    echo html_writer::start_div('card-body');
    echo html_writer::tag('div', $totalattempts, ['class' => 'display-4 text-primary']);
    echo html_writer::tag('div', get_string('totalsubmissions', 'mod_ielts'), ['class' => 'text-muted']);
    echo html_writer::end_div();
    echo html_writer::end_div();
    echo html_writer::end_div();

    echo html_writer::start_div('col-md-4');
    echo html_writer::start_div('card text-center');
    echo html_writer::start_div('card-body');
    echo html_writer::tag('div', $needsgrading, ['class' => 'display-4 text-warning']);
    echo html_writer::tag('div', get_string('needsgrading', 'mod_ielts'), ['class' => 'text-muted']);
    echo html_writer::end_div();
    echo html_writer::end_div();
    echo html_writer::end_div();

    echo html_writer::start_div('col-md-4');
    echo html_writer::start_div('card text-center');
    echo html_writer::start_div('card-body');
    echo html_writer::tag('div', $fullygraded, ['class' => 'display-4 text-success']);
    echo html_writer::tag('div', get_string('fullygraded', 'mod_ielts'), ['class' => 'text-muted']);
    echo html_writer::end_div();
    echo html_writer::end_div();
    echo html_writer::end_div();

    echo html_writer::end_div();

    // Filter tabs.
    $filter = optional_param('filter', 'all', PARAM_ALPHA);
    echo html_writer::start_tag('ul', ['class' => 'nav nav-tabs mb-3']);
    
    $filters = [
        'all' => get_string('allsubmissions', 'mod_ielts'),
        'pending' => get_string('pendinggrading', 'mod_ielts'),
        'graded' => get_string('alreadygraded', 'mod_ielts'),
    ];
    
    foreach ($filters as $key => $label) {
        $activeclass = ($filter === $key) ? 'active' : '';
        $url = new moodle_url('/mod/ielts/grading.php', ['id' => $cm->id, 'filter' => $key]);
        echo html_writer::start_tag('li', ['class' => 'nav-item']);
        echo html_writer::link($url, $label, ['class' => 'nav-link ' . $activeclass]);
        echo html_writer::end_tag('li');
    }
    
    echo html_writer::end_tag('ul');

    // Attempts table.
    echo html_writer::start_div('card');
    echo html_writer::start_div('card-body');
    echo html_writer::start_tag('div', ['class' => 'table-responsive']);
    echo html_writer::start_tag('table', ['class' => 'table table-striped table-hover']);
    
    // Table header.
    echo html_writer::start_tag('thead', ['class' => 'thead-light']);
    echo html_writer::start_tag('tr');
    echo html_writer::tag('th', get_string('student', 'mod_ielts'));
    echo html_writer::tag('th', get_string('submitted', 'mod_ielts'));
    if ($haswriting) {
        echo html_writer::tag('th', get_string('writing', 'mod_ielts'));
    }
    if ($hasspeaking) {
        echo html_writer::tag('th', get_string('speaking', 'mod_ielts'));
    }
    echo html_writer::tag('th', get_string('status', 'mod_ielts'));
    echo html_writer::tag('th', get_string('actions', 'mod_ielts'));
    echo html_writer::end_tag('tr');
    echo html_writer::end_tag('thead');

    echo html_writer::start_tag('tbody');

    foreach ($attempts as $attempt) {
        // Apply filter.
        $isfullygraded = true;
        if ($haswriting && $attempt->writing_band === null) {
            $isfullygraded = false;
        }
        if ($hasspeaking && $attempt->speaking_band === null) {
            $isfullygraded = false;
        }

        if ($filter === 'pending' && $isfullygraded) {
            continue;
        }
        if ($filter === 'graded' && !$isfullygraded) {
            continue;
        }

        echo html_writer::start_tag('tr');

        // Student name.
        $studentname = fullname($attempt);
        echo html_writer::tag('td', $studentname . html_writer::tag('div', $attempt->email, ['class' => 'small text-muted']));

        // Submitted date.
        echo html_writer::tag('td', userdate($attempt->timefinished, get_string('strftimedatetime', 'langconfig')));

        // Writing score.
        if ($haswriting) {
            if ($attempt->writing_band !== null) {
                echo html_writer::tag('td', html_writer::span(number_format($attempt->writing_band, 1), 'badge badge-success p-2'));
            } else {
                echo html_writer::tag('td', html_writer::span(get_string('pending', 'mod_ielts'), 'badge badge-warning p-2'));
            }
        }

        // Speaking score.
        if ($hasspeaking) {
            if ($attempt->speaking_band !== null) {
                echo html_writer::tag('td', html_writer::span(number_format($attempt->speaking_band, 1), 'badge badge-success p-2'));
            } else {
                echo html_writer::tag('td', html_writer::span(get_string('pending', 'mod_ielts'), 'badge badge-warning p-2'));
            }
        }

        // Status.
        if ($isfullygraded) {
            echo html_writer::tag('td', html_writer::span(get_string('graded', 'mod_ielts'), 'badge badge-success p-2'));
        } else {
            echo html_writer::tag('td', html_writer::span(get_string('needsgrading', 'mod_ielts'), 'badge badge-warning p-2'));
        }

        // Actions.
        $gradeurl = new moodle_url('/mod/ielts/grading.php', ['id' => $cm->id, 'attemptid' => $attempt->id]);
        echo html_writer::start_tag('td');
        echo html_writer::link($gradeurl, '<i class="fa fa-pencil mr-1"></i>' . get_string('grade', 'mod_ielts'),
            ['class' => 'btn btn-sm btn-primary']);
        echo html_writer::end_tag('td');

        echo html_writer::end_tag('tr');
    }

    echo html_writer::end_tag('tbody');
    echo html_writer::end_tag('table');
    echo html_writer::end_tag('div');
    echo html_writer::end_div();
    echo html_writer::end_div();

    echo $OUTPUT->footer();
}

/**
 * Show grading form for a specific attempt.
 */
function grade_attempt_page($ielts, $cm, $course, $context, $attemptid) {
    global $PAGE, $OUTPUT, $DB, $USER;

    // Get the attempt.
    $attempt = $DB->get_record('ielts_attempts', ['id' => $attemptid, 'ieltsid' => $ielts->id], '*', MUST_EXIST);
    $student = $DB->get_record('user', ['id' => $attempt->userid], '*', MUST_EXIST);

    // Parse exam data and score data.
    $examdata = json_decode($ielts->content_json, true);
    $scoredata = json_decode($attempt->score_data, true);

    $haswriting = !empty($examdata['writing']);
    $hasspeaking = !empty($examdata['speaking']);

    // Handle form submission.
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && confirm_sesskey()) {
        $update = new stdClass();
        $update->id = $attempt->id;
        $update->graded_by = $USER->id;
        $update->timegraded = time();

        if ($haswriting) {
            $writingband = optional_param('writing_band', null, PARAM_FLOAT);
            $writingfeedback = optional_param('writing_feedback', '', PARAM_RAW);
            if ($writingband !== null && $writingband >= 0 && $writingband <= 9) {
                $update->writing_band = round($writingband * 2) / 2; // Round to 0.5.
                $update->writing_feedback = clean_param($writingfeedback, PARAM_TEXT);
            }
        }

        if ($hasspeaking) {
            $speakingband = optional_param('speaking_band', null, PARAM_FLOAT);
            $speakingfeedback = optional_param('speaking_feedback', '', PARAM_RAW);
            if ($speakingband !== null && $speakingband >= 0 && $speakingband <= 9) {
                $update->speaking_band = round($speakingband * 2) / 2; // Round to 0.5.
                $update->speaking_feedback = clean_param($speakingfeedback, PARAM_TEXT);
            }
        }

        // Recalculate final band if all skills are graded.
        $bands = [];
        if (!empty($attempt->reading_band)) {
            $bands[] = $attempt->reading_band;
        }
        if (!empty($attempt->listening_band)) {
            $bands[] = $attempt->listening_band;
        }
        if (isset($update->writing_band)) {
            $bands[] = $update->writing_band;
        } else if (!empty($attempt->writing_band)) {
            $bands[] = $attempt->writing_band;
        }
        if (isset($update->speaking_band)) {
            $bands[] = $update->speaking_band;
        } else if (!empty($attempt->speaking_band)) {
            $bands[] = $attempt->speaking_band;
        }

        if (count($bands) > 0) {
            $avg = array_sum($bands) / count($bands);
            $update->final_band = round($avg * 2) / 2; // Round to 0.5.
        }

        $DB->update_record('ielts_attempts', $update);

        // Redirect back to grading list.
        redirect(new moodle_url('/mod/ielts/grading.php', ['id' => $cm->id]),
            get_string('gradingsaved', 'mod_ielts'), null, \core\output\notification::NOTIFY_SUCCESS);
    }

    echo $OUTPUT->header();

    // Header with back button.
    echo html_writer::start_div('d-flex justify-content-between align-items-center mb-4');
    echo html_writer::tag('h2', get_string('gradeattempt', 'mod_ielts'));
    $backurl = new moodle_url('/mod/ielts/grading.php', ['id' => $cm->id]);
    echo html_writer::link($backurl, '<i class="fa fa-arrow-left mr-2"></i>' . get_string('backtolist', 'mod_ielts'),
        ['class' => 'btn btn-secondary']);
    echo html_writer::end_div();

    // Student info card.
    echo html_writer::start_div('card mb-4');
    echo html_writer::start_div('card-body');
    echo html_writer::tag('h5', get_string('studentinfo', 'mod_ielts'), ['class' => 'card-title']);
    echo html_writer::start_div('row');
    echo html_writer::start_div('col-md-6');
    echo html_writer::tag('strong', get_string('name') . ': ');
    echo fullname($student);
    echo html_writer::empty_tag('br');
    echo html_writer::tag('strong', get_string('email') . ': ');
    echo $student->email;
    echo html_writer::end_div();
    echo html_writer::start_div('col-md-6');
    echo html_writer::tag('strong', get_string('submitted', 'mod_ielts') . ': ');
    echo userdate($attempt->timefinished, get_string('strftimedatetime', 'langconfig'));
    echo html_writer::end_div();
    echo html_writer::end_div();
    echo html_writer::end_div();
    echo html_writer::end_div();

    // Start form.
    echo html_writer::start_tag('form', ['method' => 'post', 'action' => '']);
    echo html_writer::empty_tag('input', ['type' => 'hidden', 'name' => 'sesskey', 'value' => sesskey()]);

    // Writing section.
    if ($haswriting) {
        echo html_writer::start_div('card mb-4');
        echo html_writer::start_div('card-header bg-primary text-white');
        echo html_writer::tag('h5', '<i class="fa fa-pencil mr-2"></i>' . get_string('writing', 'mod_ielts'), ['class' => 'mb-0']);
        echo html_writer::end_div();
        echo html_writer::start_div('card-body');

        // Show writing essays.
        $writingessays = $scoredata['writingEssays'] ?? [];
        
        foreach ($examdata['writing'] as $task) {
            $tasknum = $task['type'] === 'TASK_1' ? 1 : 2;
            $essay = $writingessays[$tasknum] ?? '';

            echo html_writer::start_div('mb-4 p-3 border rounded');
            echo html_writer::tag('h6', $task['title'] ?? "Task $tasknum", ['class' => 'text-primary']);
            
            // Show prompt.
            echo html_writer::start_div('mb-2 p-2 bg-light rounded');
            echo html_writer::tag('strong', get_string('prompt', 'mod_ielts') . ':');
            echo html_writer::div($task['prompt'] ?? '', 'mt-1');
            echo html_writer::end_div();

            // Show student's essay.
            echo html_writer::tag('strong', get_string('studentresponse', 'mod_ielts') . ':');
            if (!empty($essay)) {
                $wordcount = str_word_count($essay);
                echo html_writer::tag('span', " ($wordcount " . get_string('words', 'mod_ielts') . ")", ['class' => 'text-muted']);
                echo html_writer::start_div('p-3 border rounded bg-white mt-2', ['style' => 'white-space: pre-wrap; max-height: 400px; overflow-y: auto;']);
                echo htmlspecialchars($essay);
                echo html_writer::end_div();
            } else {
                echo html_writer::div(get_string('noresponse', 'mod_ielts'), 'alert alert-warning mt-2');
            }
            
            echo html_writer::end_div();
        }

        // Grading inputs.
        echo html_writer::start_div('row mt-4');
        echo html_writer::start_div('col-md-4');
        echo html_writer::tag('label', get_string('writingband', 'mod_ielts'), ['for' => 'writing_band', 'class' => 'font-weight-bold']);
        echo html_writer::start_tag('select', ['name' => 'writing_band', 'id' => 'writing_band', 'class' => 'form-control']);
        echo html_writer::tag('option', get_string('selectband', 'mod_ielts'), ['value' => '']);
        for ($i = 0; $i <= 9; $i += 0.5) {
            $selected = ($attempt->writing_band !== null && abs($attempt->writing_band - $i) < 0.01) ? 'selected' : '';
            echo html_writer::tag('option', number_format($i, 1), ['value' => $i, 'selected' => $selected ? 'selected' : null]);
        }
        echo html_writer::end_tag('select');
        echo html_writer::end_div();
        echo html_writer::end_div();

        echo html_writer::start_div('mt-3');
        echo html_writer::tag('label', get_string('feedback', 'mod_ielts'), ['for' => 'writing_feedback', 'class' => 'font-weight-bold']);
        echo html_writer::tag('textarea', htmlspecialchars($attempt->writing_feedback ?? ''), [
            'name' => 'writing_feedback',
            'id' => 'writing_feedback',
            'class' => 'form-control',
            'rows' => 4,
            'placeholder' => get_string('feedbackplaceholder', 'mod_ielts'),
        ]);
        echo html_writer::end_div();

        echo html_writer::end_div();
        echo html_writer::end_div();
    }

    // Speaking section.
    if ($hasspeaking) {
        echo html_writer::start_div('card mb-4');
        echo html_writer::start_div('card-header bg-success text-white');
        echo html_writer::tag('h5', '<i class="fa fa-microphone mr-2"></i>' . get_string('speaking', 'mod_ielts'), ['class' => 'mb-0']);
        echo html_writer::end_div();
        echo html_writer::start_div('card-body');

        // Show speaking audio recordings.
        $speakingaudio = $scoredata['speakingAudio'] ?? [];

        if (empty($speakingaudio)) {
            echo html_writer::div(get_string('norecordings', 'mod_ielts'), 'alert alert-warning');
        } else {
            foreach ($examdata['speaking'] as $part) {
                $partnum = $part['partNumber'] ?? $part['id'];
                $audiodata = $speakingaudio[$partnum] ?? null;

                echo html_writer::start_div('mb-4 p-3 border rounded');
                echo html_writer::tag('h6', $part['title'] ?? "Part $partnum", ['class' => 'text-success']);

                // Show questions.
                if (!empty($part['questions'])) {
                    echo html_writer::start_div('mb-2 p-2 bg-light rounded');
                    echo html_writer::tag('strong', get_string('questions', 'mod_ielts') . ':');
                    echo html_writer::start_tag('ul', ['class' => 'mb-0 mt-1']);
                    foreach ($part['questions'] as $q) {
                        if (!empty($q)) {
                            echo html_writer::tag('li', htmlspecialchars($q));
                        }
                    }
                    echo html_writer::end_tag('ul');
                    echo html_writer::end_div();
                }

                // Audio player.
                if (!empty($audiodata)) {
                    echo html_writer::tag('strong', get_string('recording', 'mod_ielts') . ':');
                    echo html_writer::start_div('mt-2');
                    echo html_writer::tag('audio', '', [
                        'controls' => 'controls',
                        'src' => $audiodata,
                        'class' => 'w-100',
                        'style' => 'max-width: 500px;',
                    ]);
                    echo html_writer::end_div();
                } else {
                    echo html_writer::div(get_string('norecordingforpart', 'mod_ielts'), 'text-muted mt-2');
                }

                echo html_writer::end_div();
            }
        }

        // Grading inputs.
        echo html_writer::start_div('row mt-4');
        echo html_writer::start_div('col-md-4');
        echo html_writer::tag('label', get_string('speakingband', 'mod_ielts'), ['for' => 'speaking_band', 'class' => 'font-weight-bold']);
        echo html_writer::start_tag('select', ['name' => 'speaking_band', 'id' => 'speaking_band', 'class' => 'form-control']);
        echo html_writer::tag('option', get_string('selectband', 'mod_ielts'), ['value' => '']);
        for ($i = 0; $i <= 9; $i += 0.5) {
            $selected = ($attempt->speaking_band !== null && abs($attempt->speaking_band - $i) < 0.01) ? 'selected' : '';
            echo html_writer::tag('option', number_format($i, 1), ['value' => $i, 'selected' => $selected ? 'selected' : null]);
        }
        echo html_writer::end_tag('select');
        echo html_writer::end_div();
        echo html_writer::end_div();

        echo html_writer::start_div('mt-3');
        echo html_writer::tag('label', get_string('feedback', 'mod_ielts'), ['for' => 'speaking_feedback', 'class' => 'font-weight-bold']);
        echo html_writer::tag('textarea', htmlspecialchars($attempt->speaking_feedback ?? ''), [
            'name' => 'speaking_feedback',
            'id' => 'speaking_feedback',
            'class' => 'form-control',
            'rows' => 4,
            'placeholder' => get_string('feedbackplaceholder', 'mod_ielts'),
        ]);
        echo html_writer::end_div();

        echo html_writer::end_div();
        echo html_writer::end_div();
    }

    // Submit button.
    echo html_writer::start_div('text-center mt-4');
    echo html_writer::tag('button', '<i class="fa fa-save mr-2"></i>' . get_string('savegrade', 'mod_ielts'), [
        'type' => 'submit',
        'class' => 'btn btn-primary btn-lg',
    ]);
    echo html_writer::end_div();

    echo html_writer::end_tag('form');

    echo $OUTPUT->footer();
}
