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
 * AJAX API for mod_ielts.
 *
 * Handles requests from the React frontend for exam data and submissions.
 *
 * @package    mod_ielts
 * @copyright  2025 Your Name
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('AJAX_SCRIPT', true);

require_once(__DIR__ . '/../../config.php');
require_once($CFG->dirroot . '/mod/ielts/lib.php');

// Set JSON headers.
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, must-revalidate');

// Require user to be logged in.
require_login();

// Get the action parameter.
$action = required_param('action', PARAM_ALPHA);

// Require sesskey for all actions (CSRF protection).
require_sesskey();

global $DB, $USER;

/**
 * Send JSON response and exit.
 *
 * @param array $data Response data
 * @param int $statuscode HTTP status code
 */
function send_json_response(array $data, int $statuscode = 200): void {
    http_response_code($statuscode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Send error response and exit.
 *
 * @param string $message Error message
 * @param int $statuscode HTTP status code
 */
function send_error_response(string $message, int $statuscode = 400): void {
    send_json_response([
        'success' => false,
        'error' => $message,
    ], $statuscode);
}

/**
 * Verify user has access to the IELTS instance.
 *
 * @param int $ieltsid The IELTS instance ID
 * @return stdClass The ielts record
 */
function verify_ielts_access(int $ieltsid): stdClass {
    global $DB;

    $ielts = $DB->get_record('ielts', ['id' => $ieltsid]);
    if (!$ielts) {
        send_error_response('IELTS exam not found', 404);
    }

    // Get course module and verify access.
    $cm = get_coursemodule_from_instance('ielts', $ielts->id, $ielts->course, false, MUST_EXIST);
    $context = context_module::instance($cm->id);

    require_capability('mod/ielts:view', $context);

    return $ielts;
}

try {
    switch ($action) {
        // ============================================================
        // GET EXAM DATA
        // ============================================================
        case 'getexam':
            $ieltsid = required_param('id', PARAM_INT);

            // Verify access.
            $ielts = verify_ielts_access($ieltsid);

            // Decode JSON content.
            $examdata = null;
            if (!empty($ielts->content_json)) {
                $examdata = json_decode($ielts->content_json, true);

                if (json_last_error() !== JSON_ERROR_NONE) {
                    send_error_response('Invalid exam data format', 500);
                }
            }

            send_json_response([
                'success' => true,
                'data' => [
                    'id' => (int) $ielts->id,
                    'name' => $ielts->name,
                    'exam' => $examdata,
                    'timecreated' => (int) $ielts->timecreated,
                    'timemodified' => (int) $ielts->timemodified,
                ],
            ]);
            break;

        // ============================================================
        // GET ALL EXAMS (List) - For backwards compatibility
        // ============================================================
        case 'getexams':
            $exams = $DB->get_records('ielts', null, 'timecreated DESC', 'id, course, name, timecreated, timemodified');

            $examlist = [];
            foreach ($exams as $exam) {
                // Only include exams user has access to.
                try {
                    $cm = get_coursemodule_from_instance('ielts', $exam->id, $exam->course, false);
                    if ($cm) {
                        $context = context_module::instance($cm->id);
                        if (has_capability('mod/ielts:view', $context)) {
                            $examlist[] = [
                                'id' => (int) $exam->id,
                                'name' => $exam->name,
                                'courseId' => (int) $exam->course,
                                'timecreated' => (int) $exam->timecreated,
                                'timemodified' => (int) $exam->timemodified,
                            ];
                        }
                    }
                } catch (Exception $e) {
                    // Skip exams user cannot access.
                    continue;
                }
            }

            send_json_response([
                'success' => true,
                'data' => $examlist,
            ]);
            break;

        // ============================================================
        // SUBMIT ATTEMPT
        // ============================================================
        case 'submitattempt':
            $ieltsid = required_param('exam_id', PARAM_INT);
            $resultsraw = required_param('results', PARAM_RAW);
            $band = required_param('band', PARAM_FLOAT);

            // Verify access.
            $ielts = verify_ielts_access($ieltsid);

            // Check submit capability.
            $cm = get_coursemodule_from_instance('ielts', $ielts->id, $ielts->course, false, MUST_EXIST);
            $context = context_module::instance($cm->id);
            require_capability('mod/ielts:submit', $context);

            // Validate results JSON.
            $results = json_decode($resultsraw, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                send_error_response('Invalid results format');
            }

            // Validate band score (IELTS bands are 0-9 in 0.5 increments).
            if ($band < 0 || $band > 9) {
                send_error_response('Invalid band score. Must be between 0 and 9.');
            }

            // Create attempt record.
            $attempt = new stdClass();
            $attempt->ieltsid = $ieltsid;
            $attempt->userid = $USER->id;
            $attempt->score_data = $resultsraw;
            $attempt->final_band = $band;
            $attempt->timecreated = time();
            $attempt->timefinished = time();

            // Insert into database.
            $attemptid = $DB->insert_record('ielts_attempts', $attempt);

            // Update grade in gradebook.
            ielts_update_grades($ielts, $USER->id);

            // Update completion state.
            $completion = new completion_info($DB->get_record('course', ['id' => $ielts->course]));
            if ($completion->is_enabled($cm)) {
                $completion->update_state($cm, COMPLETION_COMPLETE);
            }

            send_json_response([
                'success' => true,
                'data' => [
                    'attempt_id' => (int) $attemptid,
                    'message' => 'Attempt submitted successfully',
                ],
            ]);
            break;

        // ============================================================
        // GET USER ATTEMPTS
        // ============================================================
        case 'getattempts':
            $ieltsid = optional_param('exam_id', 0, PARAM_INT);

            $conditions = ['userid' => $USER->id];

            if ($ieltsid > 0) {
                // Verify access to specific exam.
                verify_ielts_access($ieltsid);
                $conditions['ieltsid'] = $ieltsid;
            }

            $attempts = $DB->get_records('ielts_attempts', $conditions, 'timecreated DESC');

            $attemptlist = [];
            foreach ($attempts as $attempt) {
                // Verify user has access to this exam.
                try {
                    $ielts = $DB->get_record('ielts', ['id' => $attempt->ieltsid]);
                    if ($ielts) {
                        $cm = get_coursemodule_from_instance('ielts', $ielts->id, $ielts->course, false);
                        if ($cm) {
                            $context = context_module::instance($cm->id);
                            if (has_capability('mod/ielts:view', $context)) {
                                $attemptlist[] = [
                                    'id' => (int) $attempt->id,
                                    'examid' => (int) $attempt->ieltsid,
                                    'final_band' => (float) $attempt->final_band,
                                    'timecreated' => (int) $attempt->timecreated,
                                    'timefinished' => $attempt->timefinished ? (int) $attempt->timefinished : null,
                                ];
                            }
                        }
                    }
                } catch (Exception $e) {
                    continue;
                }
            }

            send_json_response([
                'success' => true,
                'data' => $attemptlist,
            ]);
            break;

        // ============================================================
        // GET SINGLE ATTEMPT (with details)
        // ============================================================
        case 'getattempt':
            $attemptid = required_param('id', PARAM_INT);

            $attempt = $DB->get_record('ielts_attempts', [
                'id' => $attemptid,
                'userid' => $USER->id,
            ]);

            if (!$attempt) {
                send_error_response('Attempt not found', 404);
            }

            // Verify access to the exam.
            $ielts = verify_ielts_access($attempt->ieltsid);

            // Decode score_data.
            $scoredata = json_decode($attempt->score_data, true);

            // Build grading info (teacher-graded scores).
            $gradinginfo = null;
            if ($attempt->writing_band !== null || $attempt->speaking_band !== null) {
                $gradinginfo = [
                    'writing_band' => $attempt->writing_band !== null ? (float) $attempt->writing_band : null,
                    'speaking_band' => $attempt->speaking_band !== null ? (float) $attempt->speaking_band : null,
                    'writing_feedback' => $attempt->writing_feedback ?? null,
                    'speaking_feedback' => $attempt->speaking_feedback ?? null,
                    'graded_by' => $attempt->graded_by ? (int) $attempt->graded_by : null,
                    'timegraded' => $attempt->timegraded ? (int) $attempt->timegraded : null,
                ];
            }

            send_json_response([
                'success' => true,
                'data' => [
                    'id' => (int) $attempt->id,
                    'examid' => (int) $attempt->ieltsid,
                    'exam_name' => $ielts->name,
                    'score_data' => $scoredata,
                    'final_band' => (float) $attempt->final_band,
                    'reading_band' => $attempt->reading_band !== null ? (float) $attempt->reading_band : null,
                    'listening_band' => $attempt->listening_band !== null ? (float) $attempt->listening_band : null,
                    'grading' => $gradinginfo,
                    'timecreated' => (int) $attempt->timecreated,
                    'timefinished' => $attempt->timefinished ? (int) $attempt->timefinished : null,
                ],
            ]);
            break;

        // ============================================================
        // UNKNOWN ACTION
        // ============================================================
        default:
            send_error_response('Unknown action: ' . $action, 400);
    }
} catch (required_param_exception $e) {
    send_error_response('Missing required parameter: ' . $e->getMessage(), 400);
} catch (moodle_exception $e) {
    send_error_response('Error: ' . $e->getMessage(), 500);
} catch (Exception $e) {
    send_error_response('Unexpected error: ' . $e->getMessage(), 500);
}
