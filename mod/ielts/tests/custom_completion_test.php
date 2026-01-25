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
 * Unit tests for IELTS custom completion.
 *
 * @package    mod_ielts
 * @category   test
 * @copyright  2025 Your Name
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace mod_ielts\completion;

use advanced_testcase;
use cm_info;
use coding_exception;
use mod_ielts\completion\custom_completion;

defined('MOODLE_INTERNAL') || die();

/**
 * Class for unit testing mod_ielts/custom_completion.
 *
 * @package    mod_ielts
 * @copyright  2025 Your Name
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class custom_completion_test extends advanced_testcase {

    /**
     * Data provider for test_get_state().
     *
     * @return array
     */
    public function get_state_provider(): array {
        return [
            'Undefined rule' => [
                'somenonexistentrule', COMPLETION_INCOMPLETE, null, coding_exception::class
            ],
            'Rule not available' => [
                'completionsubmit', COMPLETION_INCOMPLETE, false, null
            ],
            'Rule available, user has not submitted' => [
                'completionsubmit', COMPLETION_INCOMPLETE, true, null
            ],
            'Rule available, user has submitted' => [
                'completionsubmit', COMPLETION_COMPLETE, true, null
            ],
            'Minimum grade not achieved' => [
                'completionusegrade', COMPLETION_INCOMPLETE, true, null
            ],
            'Minimum grade achieved' => [
                'completionusegrade', COMPLETION_COMPLETE, true, null
            ],
            'Pass grade not achieved' => [
                'completionpassgrade', COMPLETION_INCOMPLETE, true, null
            ],
            'Pass grade achieved' => [
                'completionpassgrade', COMPLETION_COMPLETE, true, null
            ],
        ];
    }

    /**
     * Test for get_state().
     *
     * @dataProvider get_state_provider
     * @param string $rule The custom completion rule.
     * @param int $expectedstate The expected completion state.
     * @param bool|null $ruleenabled Whether the rule is enabled or not.
     * @param string|null $exception The expected exception (if any).
     */
    public function test_get_state(string $rule, int $expectedstate, ?bool $ruleenabled, ?string $exception) {
        if (!is_null($exception)) {
            $this->expectException($exception);
        }

        $this->resetAfterTest();
        
        // Create test data.
        $course = $this->getDataGenerator()->create_course(['enablecompletion' => 1]);
        $student = $this->getDataGenerator()->create_user();
        $this->getDataGenerator()->enrol_user($student->id, $course->id, 'student');

        $ielts = $this->getDataGenerator()->create_module('ielts', [
            'course' => $course->id,
            'completion' => COMPLETION_TRACKING_AUTOMATIC,
        ]);

        $cm = cm_info::create(get_coursemodule_from_instance('ielts', $ielts->id));

        // Set up custom completion rules.
        $customdata = ['customcompletionrules' => []];
        
        if ($ruleenabled) {
            switch ($rule) {
                case 'completionsubmit':
                    $customdata['customcompletionrules']['completionsubmit'] = 1;
                    
                    // Create attempt if expecting complete.
                    if ($expectedstate == COMPLETION_COMPLETE) {
                        $this->create_attempt($ielts->id, $student->id, 5.5);
                    }
                    break;
                    
                case 'completionusegrade':
                    $customdata['customcompletionrules']['completionusegrade'] = 1;
                    $customdata['customcompletionrules']['completionmingrade'] = 6.0;
                    
                    // Create attempt with appropriate grade.
                    if ($expectedstate == COMPLETION_COMPLETE) {
                        $this->create_attempt($ielts->id, $student->id, 6.5);
                    } else {
                        $this->create_attempt($ielts->id, $student->id, 5.0);
                    }
                    break;
                    
                case 'completionpassgrade':
                    $customdata['customcompletionrules']['completionpassgrade'] = 1;
                    
                    // Create attempt with appropriate grade.
                    $passgrade = $ielts->grade * 0.6;
                    if ($expectedstate == COMPLETION_COMPLETE) {
                        $this->create_attempt($ielts->id, $student->id, $passgrade + 0.5);
                    } else {
                        $this->create_attempt($ielts->id, $student->id, $passgrade - 0.5);
                    }
                    break;
            }
        }

        $cm->customdata = $customdata;

        $customcompletion = new custom_completion($cm, $student->id);
        $this->assertEquals($expectedstate, $customcompletion->get_state($rule));
    }

    /**
     * Test for get_defined_custom_rules().
     */
    public function test_get_defined_custom_rules() {
        $rules = custom_completion::get_defined_custom_rules();
        $this->assertContains('completionsubmit', $rules);
        $this->assertContains('completionusegrade', $rules);
        $this->assertContains('completionpassgrade', $rules);
    }

    /**
     * Test for get_custom_rule_descriptions().
     */
    public function test_get_custom_rule_descriptions() {
        $this->resetAfterTest();

        $course = $this->getDataGenerator()->create_course(['enablecompletion' => 1]);
        $ielts = $this->getDataGenerator()->create_module('ielts', [
            'course' => $course->id,
            'completion' => COMPLETION_TRACKING_AUTOMATIC,
        ]);

        $cm = cm_info::create(get_coursemodule_from_instance('ielts', $ielts->id));
        
        $customdata = [
            'customcompletionrules' => [
                'completionsubmit' => 1,
                'completionusegrade' => 1,
                'completionmingrade' => 7.0,
                'completionpassgrade' => 1,
            ]
        ];
        $cm->customdata = $customdata;

        $customcompletion = new custom_completion($cm, 2);
        $descriptions = $customcompletion->get_custom_rule_descriptions();
        
        $this->assertNotEmpty($descriptions);
        $this->assertCount(3, $descriptions);
    }

    /**
     * Helper method to create an attempt.
     *
     * @param int $ieltsid
     * @param int $userid
     * @param float $band
     */
    private function create_attempt($ieltsid, $userid, $band) {
        global $DB;
        
        $attempt = new \stdClass();
        $attempt->ieltsid = $ieltsid;
        $attempt->userid = $userid;
        $attempt->final_band = $band;
        $attempt->timecreated = time();
        $attempt->timefinished = time();
        
        $DB->insert_record('ielts_attempts', $attempt);
    }
}
