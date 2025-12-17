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
 * AJAX API for IELTS plugin.
 *
 * Handles requests from the React frontend.
 *
 * @package    local_ielts
 * @copyright  2024 Your Name
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('AJAX_SCRIPT', true);

require_once(__DIR__ . '/../../config.php');

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

try {
    switch ($action) {
        // ============================================================
        // GET EXAM DATA
        // ============================================================
        case 'getexam':
            $examid = required_param('id', PARAM_INT);

            // Fetch exam from database.
            $exam = $DB->get_record('local_ielts_exams', ['id' => $examid]);

            if (!$exam) {
                send_error_response('Exam not found', 404);
            }

            // Decode JSON content and return.
            $examdata = json_decode($exam->content_json, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                send_error_response('Invalid exam data format', 500);
            }

            send_json_response([
                'success' => true,
                'data' => [
                    'id' => (int) $exam->id,
                    'name' => $exam->name,
                    'exam' => $examdata,
                    'timecreated' => (int) $exam->timecreated,
                    'timemodified' => (int) $exam->timemodified,
                ],
            ]);
            break;

        // ============================================================
        // GET ALL EXAMS (List)
        // ============================================================
        case 'getexams':
            $exams = $DB->get_records('local_ielts_exams', null, 'timecreated DESC', 'id, name, timecreated, timemodified');

            $examlist = [];
            foreach ($exams as $exam) {
                $examlist[] = [
                    'id' => (int) $exam->id,
                    'name' => $exam->name,
                    'timecreated' => (int) $exam->timecreated,
                    'timemodified' => (int) $exam->timemodified,
                ];
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
            $examid = required_param('exam_id', PARAM_INT);
            $resultsraw = required_param('results', PARAM_RAW);
            $band = required_param('band', PARAM_FLOAT);

            // Validate exam exists.
            $exam = $DB->get_record('local_ielts_exams', ['id' => $examid]);
            if (!$exam) {
                send_error_response('Exam not found', 404);
            }

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
            $attempt->examid = $examid;
            $attempt->userid = $USER->id;
            $attempt->score_data = $resultsraw; // Store original JSON string.
            $attempt->final_band = $band;
            $attempt->timecreated = time();
            $attempt->timefinished = time();

            // Insert into database.
            $attemptid = $DB->insert_record('local_ielts_attempts', $attempt);

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
            $examid = optional_param('exam_id', 0, PARAM_INT);

            $conditions = ['userid' => $USER->id];
            if ($examid > 0) {
                $conditions['examid'] = $examid;
            }

            $attempts = $DB->get_records('local_ielts_attempts', $conditions, 'timecreated DESC');

            $attemptlist = [];
            foreach ($attempts as $attempt) {
                $attemptlist[] = [
                    'id' => (int) $attempt->id,
                    'examid' => (int) $attempt->examid,
                    'final_band' => (float) $attempt->final_band,
                    'timecreated' => (int) $attempt->timecreated,
                    'timefinished' => $attempt->timefinished ? (int) $attempt->timefinished : null,
                ];
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

            $attempt = $DB->get_record('local_ielts_attempts', [
                'id' => $attemptid,
                'userid' => $USER->id, // Only allow user to view their own attempts.
            ]);

            if (!$attempt) {
                send_error_response('Attempt not found', 404);
            }

            // Get exam info.
            $exam = $DB->get_record('local_ielts_exams', ['id' => $attempt->examid], 'id, name');

            // Decode score_data.
            $scoredata = json_decode($attempt->score_data, true);

            send_json_response([
                'success' => true,
                'data' => [
                    'id' => (int) $attempt->id,
                    'examid' => (int) $attempt->examid,
                    'exam_name' => $exam ? $exam->name : 'Unknown',
                    'score_data' => $scoredata,
                    'final_band' => (float) $attempt->final_band,
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
