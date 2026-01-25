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
 * IELTS activity add/edit form.
 *
 * @package    mod_ielts
 * @copyright  2025 Your Name
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/course/moodleform_mod.php');

/**
 * Module settings form for IELTS activity.
 */
class mod_ielts_mod_form extends moodleform_mod {

    /**
     * Define the form elements.
     */
    public function definition() {
        global $CFG, $PAGE;

        $mform = $this->_form;

        // Load JavaScript for dynamic form builder.
        $PAGE->requires->js_call_amd('mod_ielts/exambuilder', 'init');
        $PAGE->requires->css('/mod/ielts/styles.css');

        // Load Quill WYSIWYG editor from CDN (no jQuery dependency).
        $mform->addElement('html', '
        <link href="https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.snow.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.js"></script>
        ');

        // -------------------------------------------------------
        // General section.
        // -------------------------------------------------------
        $mform->addElement('header', 'general', get_string('general', 'form'));

        // Activity name.
        $mform->addElement('text', 'name', get_string('ieltsname', 'mod_ielts'), ['size' => '64']);
        if (!empty($CFG->formatstringstriptags)) {
            $mform->setType('name', PARAM_TEXT);
        } else {
            $mform->setType('name', PARAM_CLEANHTML);
        }
        $mform->addRule('name', null, 'required', null, 'client');
        $mform->addRule('name', get_string('maximumchars', '', 255), 'maxlength', 255, 'client');
        $mform->addHelpButton('name', 'ieltsname', 'mod_ielts');

        // Standard intro elements (description).
        $this->standard_intro_elements();

        // -------------------------------------------------------
        // Input method selector.
        // -------------------------------------------------------
        $mform->addElement('header', 'inputmethodsection', get_string('inputmethod', 'mod_ielts'));
        $mform->setExpanded('inputmethodsection', true);

        $inputmethods = [
            'builder' => get_string('inputmethod_builder', 'mod_ielts'),
            'json' => get_string('inputmethod_json', 'mod_ielts'),
        ];
        $mform->addElement('select', 'inputmethod', get_string('selectinputmethod', 'mod_ielts'), $inputmethods);
        $mform->setDefault('inputmethod', 'builder');
        $mform->addHelpButton('inputmethod', 'inputmethod', 'mod_ielts');

        // -------------------------------------------------------
        // VISUAL BUILDER SECTION
        // -------------------------------------------------------
        $mform->addElement('header', 'buildersection', get_string('exambuilder', 'mod_ielts'));
        $mform->setExpanded('buildersection', true);

        // Skills selector with checkboxes.
        $mform->addElement('html', '<div id="ielts-exam-builder" class="ielts-builder-container">');

        // Skill selection.
        $mform->addElement('html', '<div class="ielts-skills-selector card p-3 mb-3">');
        $mform->addElement('html', '<h5 class="mb-3">' . get_string('selectskills', 'mod_ielts') . '</h5>');
        $mform->addElement('html', '<div class="d-flex flex-wrap gap-3">');

        $mform->addElement('advcheckbox', 'skill_reading', '', get_string('skill_reading', 'mod_ielts'),
            ['class' => 'skill-checkbox']);
        $mform->addElement('advcheckbox', 'skill_listening', '', get_string('skill_listening', 'mod_ielts'),
            ['class' => 'skill-checkbox']);
        $mform->addElement('advcheckbox', 'skill_writing', '', get_string('skill_writing', 'mod_ielts'),
            ['class' => 'skill-checkbox']);
        $mform->addElement('advcheckbox', 'skill_speaking', '', get_string('skill_speaking', 'mod_ielts'),
            ['class' => 'skill-checkbox']);

        $mform->addElement('html', '</div></div>');

        // Duration settings.
        $mform->addElement('html', '<div class="ielts-duration-settings card p-3 mb-3">');
        $mform->addElement('html', '<h5 class="mb-3">' . get_string('skillduration', 'mod_ielts') . '</h5>');
        $mform->addElement('html', '<div class="duration-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">');

        // Reading duration.
        $mform->addElement('html', '<div class="duration-item" id="duration_reading_wrapper" style="display: flex; flex-direction: column;">');
        $mform->addElement('html', '<label for="id_duration_reading" style="white-space: nowrap; margin-bottom: 5px;">' . 
            get_string('duration_reading', 'mod_ielts') . '</label>');
        $mform->addElement('html', '<input type="number" name="duration_reading" id="id_duration_reading" value="60" class="form-control" style="width: 80px;">');
        $mform->addElement('html', '</div>');

        // Listening duration.
        $mform->addElement('html', '<div class="duration-item" id="duration_listening_wrapper" style="display: flex; flex-direction: column;">');
        $mform->addElement('html', '<label for="id_duration_listening" style="white-space: nowrap; margin-bottom: 5px;">' . 
            get_string('duration_listening', 'mod_ielts') . '</label>');
        $mform->addElement('html', '<input type="number" name="duration_listening" id="id_duration_listening" value="40" class="form-control" style="width: 80px;">');
        $mform->addElement('html', '</div>');

        // Writing duration.
        $mform->addElement('html', '<div class="duration-item" id="duration_writing_wrapper" style="display: flex; flex-direction: column;">');
        $mform->addElement('html', '<label for="id_duration_writing" style="white-space: nowrap; margin-bottom: 5px;">' . 
            get_string('duration_writing', 'mod_ielts') . '</label>');
        $mform->addElement('html', '<input type="number" name="duration_writing" id="id_duration_writing" value="60" class="form-control" style="width: 80px;">');
        $mform->addElement('html', '</div>');

        // Speaking duration.
        $mform->addElement('html', '<div class="duration-item" id="duration_speaking_wrapper" style="display: flex; flex-direction: column;">');
        $mform->addElement('html', '<label for="id_duration_speaking" style="white-space: nowrap; margin-bottom: 5px;">' . 
            get_string('duration_speaking', 'mod_ielts') . '</label>');
        $mform->addElement('html', '<input type="number" name="duration_speaking" id="id_duration_speaking" value="15" class="form-control" style="width: 80px;">');
        $mform->addElement('html', '</div>');

        $mform->addElement('html', '</div></div>'); // End duration settings.

        // -------------------------------------------------------
        // QUESTION NUMBERING SUMMARY
        // -------------------------------------------------------
        $mform->addElement('html', '<div id="question-numbering-summary"></div>');

        // -------------------------------------------------------
        // READING SECTION
        // -------------------------------------------------------
        $mform->addElement('html', '<div id="reading-section" class="ielts-skill-section card p-3 mb-3" style="display:none;">');
        $mform->addElement('html', '<h4 class="text-primary"><i class="fa fa-book"></i> ' .
            get_string('skill_reading', 'mod_ielts') . '</h4>');
        $mform->addElement('html', '<p class="text-muted">' . get_string('reading_help', 'mod_ielts') . '</p>');
        $mform->addElement('html', '<div id="reading-passages-container" class="passages-container"></div>');
        $mform->addElement('html', '<button type="button" class="btn btn-outline-primary mt-2" id="add-reading-passage">' .
            '<i class="fa fa-plus"></i> ' . get_string('addpassage', 'mod_ielts') . '</button>');
        $mform->addElement('html', '</div>');

        // -------------------------------------------------------
        // LISTENING SECTION
        // -------------------------------------------------------
        $mform->addElement('html', '<div id="listening-section" class="ielts-skill-section card p-3 mb-3" style="display:none;">');
        $mform->addElement('html', '<h4 class="text-success"><i class="fa fa-headphones"></i> ' .
            get_string('skill_listening', 'mod_ielts') . '</h4>');
        $mform->addElement('html', '<p class="text-muted">' . get_string('listening_help', 'mod_ielts') . '</p>');
        $mform->addElement('html', '<div id="listening-sections-container" class="sections-container"></div>');
        $mform->addElement('html', '<button type="button" class="btn btn-outline-success mt-2" id="add-listening-section">' .
            '<i class="fa fa-plus"></i> ' . get_string('addlisteningsection', 'mod_ielts') . '</button>');
        $mform->addElement('html', '</div>');

        // -------------------------------------------------------
        // WRITING SECTION
        // -------------------------------------------------------
        $mform->addElement('html', '<div id="writing-section" class="ielts-skill-section card p-3 mb-3" style="display:none;">');
        $mform->addElement('html', '<h4 class="text-warning"><i class="fa fa-pencil"></i> ' .
            get_string('skill_writing', 'mod_ielts') . '</h4>');
        $mform->addElement('html', '<p class="text-muted">' . get_string('writing_help', 'mod_ielts') . '</p>');
        $mform->addElement('html', '<div id="writing-tasks-container" class="tasks-container"></div>');
        $mform->addElement('html', '<button type="button" class="btn btn-outline-warning mt-2" id="add-writing-task">' .
            '<i class="fa fa-plus"></i> ' . get_string('addwritingtask', 'mod_ielts') . '</button>');
        $mform->addElement('html', '</div>');

        // -------------------------------------------------------
        // SPEAKING SECTION
        // -------------------------------------------------------
        $mform->addElement('html', '<div id="speaking-section" class="ielts-skill-section card p-3 mb-3" style="display:none;">');
        $mform->addElement('html', '<h4 class="text-danger"><i class="fa fa-microphone"></i> ' .
            get_string('skill_speaking', 'mod_ielts') . '</h4>');
        $mform->addElement('html', '<p class="text-muted">' . get_string('speaking_help', 'mod_ielts') . '</p>');
        $mform->addElement('html', '<div id="speaking-parts-container" class="parts-container"></div>');
        $mform->addElement('html', '<button type="button" class="btn btn-outline-danger mt-2" id="add-speaking-part">' .
            '<i class="fa fa-plus"></i> ' . get_string('addspeakingpart', 'mod_ielts') . '</button>');
        $mform->addElement('html', '</div>');

        $mform->addElement('html', '</div>'); // End #ielts-exam-builder.

        // -------------------------------------------------------
        // JSON INPUT SECTION (Alternative / Advanced)
        // -------------------------------------------------------
        $mform->addElement('header', 'jsonsection', get_string('jsoninput', 'mod_ielts'));

        $mform->addElement('html', '<p class="text-muted">' . get_string('jsoninput_help', 'mod_ielts') . '</p>');

        $mform->addElement(
            'textarea',
            'content_json',
            get_string('content_json', 'mod_ielts'),
            ['rows' => 20, 'cols' => 80, 'class' => 'content-json-editor', 'id' => 'id_content_json']
        );
        $mform->setType('content_json', PARAM_RAW);
        $mform->addHelpButton('content_json', 'content_json', 'mod_ielts');

        // Hidden field to store final JSON from builder.
        $mform->addElement('hidden', 'builder_json', '', ['id' => 'id_builder_json']);
        $mform->setType('builder_json', PARAM_RAW);

        // -------------------------------------------------------
        // Grade section.
        // -------------------------------------------------------
        $mform->addElement('header', 'gradesection', get_string('gradesection', 'mod_ielts'));

        $mform->addElement('text', 'grade', get_string('grademax', 'mod_ielts'), ['size' => '4']);
        $mform->setType('grade', PARAM_INT);
        $mform->setDefault('grade', 9);
        $mform->addRule('grade', null, 'numeric', null, 'client');

        // -------------------------------------------------------
        // Standard course module elements.
        // -------------------------------------------------------
        $this->standard_coursemodule_elements();

        // -------------------------------------------------------
        // Action buttons.
        // -------------------------------------------------------
        $this->add_action_buttons();
    }

    /**
     * Validate the form data.
     *
     * @param array $data Form data
     * @param array $files Uploaded files
     * @return array Validation errors
     */
    public function validation($data, $files) {
        $errors = parent::validation($data, $files);

        // Get the actual JSON content based on input method.
        $jsonContent = '';
        if (isset($data['inputmethod']) && $data['inputmethod'] === 'builder' && !empty($data['builder_json'])) {
            $jsonContent = $data['builder_json'];
        } else if (!empty($data['content_json'])) {
            $jsonContent = $data['content_json'];
        }

        // Validate JSON format if content is provided.
        if (!empty($jsonContent)) {
            $decoded = json_decode($jsonContent, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                $errors['content_json'] = get_string('invalidjsonformat', 'mod_ielts') .
                    ': ' . json_last_error_msg();
            }
        }

        // Validate grade is positive.
        if (isset($data['grade']) && $data['grade'] < 0) {
            $errors['grade'] = get_string('grademax', 'mod_ielts') . ' must be positive';
        }

        return $errors;
    }

    /**
     * Preprocess form data before displaying.
     *
     * @param array $defaultvalues Default values for the form
     */
    public function data_preprocessing(&$defaultvalues) {
        parent::data_preprocessing($defaultvalues);

        // Parse existing JSON to populate builder fields.
        if (!empty($defaultvalues['content_json'])) {
            $examData = json_decode($defaultvalues['content_json'], true);

            if ($examData !== null) {
                // Pretty print JSON for the textarea.
                $defaultvalues['content_json'] = json_encode($examData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

                // Set skill checkboxes.
                $defaultvalues['skill_reading'] = !empty($examData['reading']) ? 1 : 0;
                $defaultvalues['skill_listening'] = !empty($examData['listening']) ? 1 : 0;
                $defaultvalues['skill_writing'] = !empty($examData['writing']) ? 1 : 0;
                $defaultvalues['skill_speaking'] = !empty($examData['speaking']) ? 1 : 0;

                // Set durations (convert seconds to minutes).
                if (!empty($examData['durations'])) {
                    $defaultvalues['duration_reading'] = isset($examData['durations']['reading'])
                        ? intval($examData['durations']['reading'] / 60) : 60;
                    $defaultvalues['duration_listening'] = isset($examData['durations']['listening'])
                        ? intval($examData['durations']['listening'] / 60) : 40;
                    $defaultvalues['duration_writing'] = isset($examData['durations']['writing'])
                        ? intval($examData['durations']['writing'] / 60) : 60;
                    $defaultvalues['duration_speaking'] = isset($examData['durations']['speaking'])
                        ? intval($examData['durations']['speaking'] / 60) : 15;
                }

                // Store for builder initialization.
                $defaultvalues['builder_json'] = $defaultvalues['content_json'];
            }
        }
    }

    /**
     * Process form data before saving.
     *
     * @param stdClass $data Form data
     * @return stdClass Processed data
     */
    public function get_data() {
        $data = parent::get_data();

        if ($data) {
            // Use builder JSON if builder method was selected and has content.
            if (isset($data->inputmethod) && $data->inputmethod === 'builder' && !empty($data->builder_json)) {
                $data->content_json = $data->builder_json;
            }
        }

        return $data;
    }
}
