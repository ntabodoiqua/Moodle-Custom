<?php

/**
 * Activity custom completion subclass for IELTS activity.
 *
 * Class for defining mod_ielts's custom completion rules and fetching the completion statuses
 * of the custom completion rules for a given ielts instance and a user.
 *
 * @package    mod_ielts
 * @copyright  2025 Your Name
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

declare(strict_types=1);

namespace mod_ielts\completion;

use core_completion\activity_custom_completion;

/**
 * Activity custom completion subclass for the IELTS activity.
 *
 * Class for defining mod_ielts's custom completion rules and fetching the completion statuses
 * of the custom completion rules for a given ielts instance and a user.
 *
 * @package mod_ielts
 */
class custom_completion extends activity_custom_completion {

    /**
     * Fetches the completion state for a given completion rule.
     *
     * @param string $rule The completion rule.
     * @return int The completion state.
     */
    public function get_state(string $rule): int {
        global $DB;

        $this->validate_rule($rule);

        $userid = $this->userid;
        $ieltsid = $this->cm->instance;

        switch ($rule) {
            case 'completionsubmit':
                $status = COMPLETION_INCOMPLETE;
                // Check if user has submitted at least one attempt.
                $hasattempt = $DB->record_exists('ielts_attempts', [
                    'ieltsid' => $ieltsid,
                    'userid' => $userid,
                ]);
                
                if ($hasattempt) {
                    $status = COMPLETION_COMPLETE;
                }
                break;

            case 'completionusegrade':
                $status = COMPLETION_INCOMPLETE;
                
                // Get required minimum grade.
                $requiredgrade = floatval($this->cm->customdata['customcompletionrules']['completionmingrade'] ?? 0);
                
                if ($requiredgrade > 0) {
                    // Get user's best attempt.
                    $bestband = $DB->get_field('ielts_attempts', 'MAX(final_band)', [
                        'ieltsid' => $ieltsid,
                        'userid' => $userid,
                    ]);
                    
                    if ($bestband && $bestband >= $requiredgrade) {
                        $status = COMPLETION_COMPLETE;
                    }
                }
                break;

            case 'completionpassgrade':
                $status = COMPLETION_INCOMPLETE;
                
                // Get the pass grade for this activity.
                $ielts = $DB->get_record('ielts', ['id' => $ieltsid], '*', MUST_EXIST);
                $passgrade = $ielts->grade * 0.6; // Default 60% of max grade
                
                // Get user's best attempt.
                $bestband = $DB->get_field('ielts_attempts', 'MAX(final_band)', [
                    'ieltsid' => $ieltsid,
                    'userid' => $userid,
                ]);
                
                if ($bestband && $bestband >= $passgrade) {
                    $status = COMPLETION_COMPLETE;
                }
                break;
        }

        return $status;
    }

    /**
     * Fetch the list of custom completion rules that this module defines.
     *
     * @return array
     */
    public static function get_defined_custom_rules(): array {
        return [
            'completionsubmit',
            'completionusegrade',
            'completionpassgrade',
        ];
    }

    /**
     * Returns an associative array of the descriptions of custom completion rules.
     *
     * @return array
     */
    public function get_custom_rule_descriptions(): array {
        $completionsubmit = $this->cm->customdata['customcompletionrules']['completionsubmit'] ?? 0;
        $completionusegrade = $this->cm->customdata['customcompletionrules']['completionusegrade'] ?? 0;
        $completionpassgrade = $this->cm->customdata['customcompletionrules']['completionpassgrade'] ?? 0;
        $completionmingrade = $this->cm->customdata['customcompletionrules']['completionmingrade'] ?? 0;

        $descriptions = [];
        
        if (!empty($completionsubmit)) {
            $descriptions[] = get_string('completiondetail:submit', 'mod_ielts');
        }
        
        if (!empty($completionusegrade) && $completionmingrade) {
            $descriptions[] = get_string('completiondetail:grade', 'mod_ielts', $completionmingrade);
        }
        
        if (!empty($completionpassgrade)) {
            $descriptions[] = get_string('completiondetail:passgrade', 'mod_ielts');
        }

        return $descriptions;
    }

    /**
     * Returns an array of all completion rules, in the order they should be displayed to users.
     *
     * @return array
     */
    public function get_sort_order(): array {
        return [
            'completionsubmit',
            'completionusegrade',
            'completionpassgrade',
        ];
    }
}