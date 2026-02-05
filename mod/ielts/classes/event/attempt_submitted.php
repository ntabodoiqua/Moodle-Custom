<?php

/**
 * The mod_ielts attempt submitted event.
 */

namespace mod_ielts\event;

defined('MOODLE_INTERNAL') || die();

/**
 * The mod_ielts attempt submitted event class.
 *
 * @package    mod_ielts
 */
class attempt_submitted extends \core\event\base {

    /**
     * Init method.
     */
    protected function init() {
        $this->data['objecttable'] = 'ielts_attempts';
        $this->data['crud'] = 'c';
        $this->data['edulevel'] = self::LEVEL_PARTICIPATING;
    }

    /**
     * Returns description of what happened.
     *
     * @return string
     */
    public function get_description() {
        return "The user with id '$this->userid' submitted an attempt with id '$this->objectid' " .
            "for the IELTS activity with course module id '$this->contextinstanceid'.";
    }

    /**
     * Return localised event name.
     *
     * @return string
     */
    public static function get_name() {
        return get_string('eventattemptsubmitted', 'mod_ielts');
    }

    /**
     * Get URL related to the action.
     *
     * @return \moodle_url
     */
    public function get_url() {
        return new \moodle_url('/mod/ielts/view.php', ['id' => $this->contextinstanceid]);
    }

    /**
     * Return the legacy event log data.
     *
     * @return array
     */
    protected function get_legacy_logdata() {
        return [
            $this->courseid,
            'ielts',
            'submit',
            'view.php?id=' . $this->contextinstanceid,
            $this->objectid,
            $this->contextinstanceid,
        ];
    }

    /**
     * Custom validation.
     *
     * @throws \coding_exception
     */
    protected function validate_data() {
        parent::validate_data();

        if ($this->contextlevel != CONTEXT_MODULE) {
            throw new \coding_exception('Context level must be CONTEXT_MODULE.');
        }
    }

    /**
     * Get objectid mapping.
     *
     * @return array
     */
    public static function get_objectid_mapping() {
        return ['db' => 'ielts_attempts', 'restore' => 'ielts_attempt'];
    }
}
