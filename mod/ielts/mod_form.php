<?php
/**
 * Form thêm mới/edit của IELTS.
 */

defined('MOODLE_INTERNAL') || die();

// thư viện form moodle mặc định
require_once($CFG->dirroot . '/course/moodleform_mod.php');

/**
 * Form cài đặt module cho activity IELTS.
 */
class mod_ielts_mod_form extends moodleform_mod {

    // định nghĩa các elements của form
    public function definition() {
        global $CFG, $PAGE;

        $mform = $this->_form;

        // tích hợp exambuilder để xây dựng đề thi trực quan cho GV
        $PAGE->requires->js_call_amd('mod_ielts/exambuilder', 'init');
        $PAGE->requires->css('/mod/ielts/styles.css');

        // trình soạn thảo Quill WYSIWYG
        $mform->addElement('html', '
        <link href="https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.snow.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.js"></script>
        ');

        // cài đặt chung
        $mform->addElement('header', 'general', get_string('general', 'form'));

        // tên activity.
        $mform->addElement('text', 'name', get_string('ieltsname', 'mod_ielts'), ['size' => '64']);
        if (!empty($CFG->formatstringstriptags)) {
            $mform->setType('name', PARAM_TEXT);
        } else {
            $mform->setType('name', PARAM_CLEANHTML);
        }
        $mform->addRule('name', null, 'required', null, 'client');
        $mform->addRule('name', get_string('maximumchars', '', 255), 'maxlength', 255, 'client');
        $mform->addHelpButton('name', 'ieltsname', 'mod_ielts');

        // mô tả activity.
        $this->standard_intro_elements();

        // dropdown chọn phương thức nhập đề thi.
        $mform->addElement('header', 'inputmethodsection', get_string('inputmethod', 'mod_ielts'));
        $mform->setExpanded('inputmethodsection', true);

        $inputmethods = [
            'builder' => get_string('inputmethod_builder', 'mod_ielts'),
            'json' => get_string('inputmethod_json', 'mod_ielts'),
        ];
        $mform->addElement('select', 'inputmethod', get_string('selectinputmethod', 'mod_ielts'), $inputmethods);
        $mform->setDefault('inputmethod', 'builder');
        $mform->addHelpButton('inputmethod', 'inputmethod', 'mod_ielts');

        // phần visual exam builder
        $mform->addElement('header', 'buildersection', get_string('exambuilder', 'mod_ielts'));
        $mform->setExpanded('buildersection', true);

        // selector kỹ năng với checkbox.
        $mform->addElement('html', '<div id="ielts-exam-builder" class="ielts-builder-container">');

        // chọn kỹ năng.
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

        // cài đặt thời lượng.
        $mform->addElement('html', '<div class="ielts-duration-settings card p-3 mb-3">');
        $mform->addElement('html', '<h5 class="mb-3">' . get_string('skillduration', 'mod_ielts') . '</h5>');
        $mform->addElement('html', '<div class="duration-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">');

        // Reading.
        $mform->addElement('html', '<div class="duration-item" id="duration_reading_wrapper" style="display: flex; flex-direction: column;">');
        $mform->addElement('html', '<label for="id_duration_reading" style="white-space: nowrap; margin-bottom: 5px;">' . 
            get_string('duration_reading', 'mod_ielts') . '</label>');
        $mform->addElement('html', '<input type="number" name="duration_reading" id="id_duration_reading" value="60" class="form-control" style="width: 80px;">');
        $mform->addElement('html', '</div>');

        // Listening.
        $mform->addElement('html', '<div class="duration-item" id="duration_listening_wrapper" style="display: flex; flex-direction: column;">');
        $mform->addElement('html', '<label for="id_duration_listening" style="white-space: nowrap; margin-bottom: 5px;">' . 
            get_string('duration_listening', 'mod_ielts') . '</label>');
        $mform->addElement('html', '<input type="number" name="duration_listening" id="id_duration_listening" value="40" class="form-control" style="width: 80px;">');
        $mform->addElement('html', '</div>');

        // Writing.
        $mform->addElement('html', '<div class="duration-item" id="duration_writing_wrapper" style="display: flex; flex-direction: column;">');
        $mform->addElement('html', '<label for="id_duration_writing" style="white-space: nowrap; margin-bottom: 5px;">' . 
            get_string('duration_writing', 'mod_ielts') . '</label>');
        $mform->addElement('html', '<input type="number" name="duration_writing" id="id_duration_writing" value="60" class="form-control" style="width: 80px;">');
        $mform->addElement('html', '</div>');

        // Speaking.
        $mform->addElement('html', '<div class="duration-item" id="duration_speaking_wrapper" style="display: flex; flex-direction: column;">');
        $mform->addElement('html', '<label for="id_duration_speaking" style="white-space: nowrap; margin-bottom: 5px;">' . 
            get_string('duration_speaking', 'mod_ielts') . '</label>');
        $mform->addElement('html', '<input type="number" name="duration_speaking" id="id_duration_speaking" value="15" class="form-control" style="width: 80px;">');
        $mform->addElement('html', '</div>');

        $mform->addElement('html', '</div></div>');

        // tóm tắt số câu hỏi.
        $mform->addElement('html', '<div id="question-numbering-summary"></div>');

        // phần reading
        $mform->addElement('html', '<div id="reading-section" class="ielts-skill-section card p-3 mb-3" style="display:none;">');
        $mform->addElement('html', '<h4 class="text-primary"><i class="fa fa-book"></i> ' .
            get_string('skill_reading', 'mod_ielts') . '</h4>');
        $mform->addElement('html', '<p class="text-muted">' . get_string('reading_help', 'mod_ielts') . '</p>');
        $mform->addElement('html', '<div id="reading-passages-container" class="passages-container"></div>');
        $mform->addElement('html', '<button type="button" class="btn btn-outline-primary mt-2" id="add-reading-passage">' .
            '<i class="fa fa-plus"></i> ' . get_string('addpassage', 'mod_ielts') . '</button>');
        $mform->addElement('html', '</div>');

        // phần listening
        $mform->addElement('html', '<div id="listening-section" class="ielts-skill-section card p-3 mb-3" style="display:none;">');
        $mform->addElement('html', '<h4 class="text-success"><i class="fa fa-headphones"></i> ' .
            get_string('skill_listening', 'mod_ielts') . '</h4>');
        $mform->addElement('html', '<p class="text-muted">' . get_string('listening_help', 'mod_ielts') . '</p>');
        $mform->addElement('html', '<div id="listening-sections-container" class="sections-container"></div>');
        $mform->addElement('html', '<button type="button" class="btn btn-outline-success mt-2" id="add-listening-section">' .
            '<i class="fa fa-plus"></i> ' . get_string('addlisteningsection', 'mod_ielts') . '</button>');
        $mform->addElement('html', '</div>');

        // phần writing
        $mform->addElement('html', '<div id="writing-section" class="ielts-skill-section card p-3 mb-3" style="display:none;">');
        $mform->addElement('html', '<h4 class="text-warning"><i class="fa fa-pencil"></i> ' .
            get_string('skill_writing', 'mod_ielts') . '</h4>');
        $mform->addElement('html', '<p class="text-muted">' . get_string('writing_help', 'mod_ielts') . '</p>');
        $mform->addElement('html', '<div id="writing-tasks-container" class="tasks-container"></div>');
        $mform->addElement('html', '<button type="button" class="btn btn-outline-warning mt-2" id="add-writing-task">' .
            '<i class="fa fa-plus"></i> ' . get_string('addwritingtask', 'mod_ielts') . '</button>');
        $mform->addElement('html', '</div>');

        // phần speaking
        $mform->addElement('html', '<div id="speaking-section" class="ielts-skill-section card p-3 mb-3" style="display:none;">');
        $mform->addElement('html', '<h4 class="text-danger"><i class="fa fa-microphone"></i> ' .
            get_string('skill_speaking', 'mod_ielts') . '</h4>');
        $mform->addElement('html', '<p class="text-muted">' . get_string('speaking_help', 'mod_ielts') . '</p>');
        $mform->addElement('html', '<div id="speaking-parts-container" class="parts-container"></div>');
        $mform->addElement('html', '<button type="button" class="btn btn-outline-danger mt-2" id="add-speaking-part">' .
            '<i class="fa fa-plus"></i> ' . get_string('addspeakingpart', 'mod_ielts') . '</button>');
        $mform->addElement('html', '</div>');

        $mform->addElement('html', '</div>');

        // phần nhập liệu JSON (nâng cao)
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

        // nhận dạng JSON từ visual builder để lưu trữ.
        $mform->addElement('hidden', 'builder_json', '', ['id' => 'id_builder_json']);
        $mform->setType('builder_json', PARAM_RAW);

        // phần điểm số.
        $mform->addElement('header', 'gradesection', get_string('gradesection', 'mod_ielts'));

        $mform->addElement('text', 'grade', get_string('grademax', 'mod_ielts'), ['size' => '4']);
        $mform->setType('grade', PARAM_INT);
        $mform->setDefault('grade', 9);
        $mform->addRule('grade', null, 'numeric', null, 'client');

        // phần cài đặt số lần làm bài.
        $mform->addElement('header', 'attemptsheader', get_string('attemptsettings', 'mod_ielts'));
        
        $attemptoptions = [
            0 => get_string('attemptsunlimited', 'mod_ielts'),
            1 => '1',
            2 => '2',
            3 => '3',
            4 => '4',
            5 => '5',
            10 => '10',
        ];
        $mform->addElement('select', 'maxattempts', get_string('maxattempts', 'mod_ielts'), $attemptoptions);
        $mform->setDefault('maxattempts', 0);
        $mform->addHelpButton('maxattempts', 'maxattempts', 'mod_ielts');

        // phần cài đặt module chuẩn của khóa học.
        $this->standard_coursemodule_elements();

        // các nút lưu mặc định của moodle.
        $this->add_action_buttons();
    }

    
    // các điều kiện hoàn thành tùy chỉnh
    public function add_completion_rules() {
        $mform =& $this->_form;

        // hoàn thành khi nộp bài.
        $group = [];
        $group[] =& $mform->createElement('checkbox', 'completionsubmit', '', 
            get_string('completionsubmit', 'mod_ielts'));
        $mform->addGroup($group, 'completionsubmitgroup', 
            get_string('completionsubmit', 'mod_ielts'), [''], false);
        $mform->addHelpButton('completionsubmitgroup', 'completionsubmit', 'mod_ielts');
        $mform->hideIf('completionsubmitgroup', 'completion', 'ne', COMPLETION_TRACKING_AUTOMATIC);

        // hoàn thành khi đạt điểm tối thiểu.
        $group = [];
        $group[] =& $mform->createElement('checkbox', 'completionusegrade', '',
            get_string('completionusegrade', 'mod_ielts'));
        $group[] =& $mform->createElement('static', 'completionmingrade_label', '', 
            get_string('minimumband', 'mod_ielts') . ': ');
        $group[] =& $mform->createElement('text', 'completionmingrade', '',
            ['size' => '4', 'placeholder' => '5.5']);
        $mform->setType('completionmingrade', PARAM_FLOAT);
        $mform->addGroup($group, 'completionmingradegroup',
            get_string('completionmingradegroup', 'mod_ielts'), ' ', false);
        $mform->setDefault('completionmingrade', '5.5');
        $mform->addHelpButton('completionmingradegroup', 'completionmingrade', 'mod_ielts');
        $mform->hideIf('completionmingradegroup', 'completion', 'ne', COMPLETION_TRACKING_AUTOMATIC);
        $mform->hideIf('completionmingrade', 'completionusegrade', 'notchecked');
        $mform->hideIf('completionmingrade_label', 'completionusegrade', 'notchecked');

        // hoàn thành khi đạt điểm đỗ.
        $group = [];
        $group[] =& $mform->createElement('checkbox', 'completionpassgrade', '',
            get_string('completionpassgrade', 'mod_ielts'));
        $mform->addGroup($group, 'completionpassgradegroup',
            get_string('completionpassgrade', 'mod_ielts'), [''], false);
        $mform->addHelpButton('completionpassgradegroup', 'completionpassgrade', 'mod_ielts');
        $mform->hideIf('completionpassgradegroup', 'completion', 'ne', COMPLETION_TRACKING_AUTOMATIC);

        return ['completionsubmitgroup', 'completionmingradegroup', 'completionpassgradegroup'];
    }

    // hàm kiểm tra các quy tắc hoàn thành cho moodle.
    public function completion_rule_enabled($data) {
        return (!empty($data['completionsubmit']) ||
                !empty($data['completionusegrade']) ||
                !empty($data['completionpassgrade']));
    }

    // dọn dẹp dữ liệu sau khi submit và trước khi lưu.
    public function data_postprocessing($data) {
        parent::data_postprocessing($data);
        
        if (!empty($data->completionunlocked)) {
            // tắt các tùy chọn hoàn thành nếu hoàn thành không được theo dõi.
            $autocompletion = !empty($data->completion) && $data->completion == COMPLETION_TRACKING_AUTOMATIC;
            
            if (!$autocompletion || empty($data->completionsubmit)) {
                $data->completionsubmit = 0;
            }
            
            if (!$autocompletion || empty($data->completionusegrade)) {
                $data->completionusegrade = 0;
            }
            
            if (!$autocompletion || empty($data->completionpassgrade)) {
                $data->completionpassgrade = 0;
            }
        }
    }

    /**
     * Validate dữ liệu form.
     */
    public function validation($data, $files) {
        $errors = parent::validation($data, $files);

        // lấy nội dung json từ builder hoặc textarea.
        $jsonContent = '';
        if (isset($data['inputmethod']) && $data['inputmethod'] === 'builder' && !empty($data['builder_json'])) {
            $jsonContent = $data['builder_json'];
        } else if (!empty($data['content_json'])) {
            $jsonContent = $data['content_json'];
        }

        // validate json
        if (!empty($jsonContent)) {
            $decoded = json_decode($jsonContent, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                $errors['content_json'] = get_string('invalidjsonformat', 'mod_ielts') .
                    ': ' . json_last_error_msg();
            }
        }

        // Validate grade là số dương.
        if (isset($data['grade']) && $data['grade'] < 0) {
            $errors['grade'] = get_string('grademax', 'mod_ielts') . ' must be positive';
        }

        return $errors;
    }

    
    // tiền xử lý dữ liệu trước khi hiển thị.
    // nếu bài thi đã có dữ liệu, phân tích json để điền các trường builder.
    public function data_preprocessing(&$defaultvalues) {
        parent::data_preprocessing($defaultvalues);

        // Parse existing JSON to populate builder fields.
        if (!empty($defaultvalues['content_json'])) {
            $examData = json_decode($defaultvalues['content_json'], true);

            if ($examData !== null) {
                // định dạng lại json đẹp để hiển thị trong textarea.
                $defaultvalues['content_json'] = json_encode($examData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

                // tự động tick các ô kỹ năng
                $defaultvalues['skill_reading'] = !empty($examData['reading']) ? 1 : 0;
                $defaultvalues['skill_listening'] = !empty($examData['listening']) ? 1 : 0;
                $defaultvalues['skill_writing'] = !empty($examData['writing']) ? 1 : 0;
                $defaultvalues['skill_speaking'] = !empty($examData['speaking']) ? 1 : 0;

                // set các thời lượng.
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

                // đồng bộ dữ liệu sang trường ẩn cho Builder
                $defaultvalues['builder_json'] = $defaultvalues['content_json'];
            }
        }
    }

    /**
     * xử lý dữ liệu trước khi lưu vào db.
     */
    public function get_data() {
        $data = parent::get_data();

        if ($data) {
            // nếu dùng builder -> ghi đè nội dung json từ builder vào trường lưu trữ.
            if (isset($data->inputmethod) && $data->inputmethod === 'builder' && !empty($data->builder_json)) {
                $data->content_json = $data->builder_json;
            }
        }

        return $data;
    }
}
