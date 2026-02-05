<?php

/**
 * Trang danh sách tất cả các hoạt động IELTS trong một khóa học cụ thể.
 */

require_once('../../config.php');

$id = required_param('id', PARAM_INT); // Course ID.

$course = $DB->get_record('course', ['id' => $id], '*', MUST_EXIST);

require_course_login($course);

$PAGE->set_url('/mod/ielts/index.php', ['id' => $id]);
$PAGE->set_title($course->fullname);
$PAGE->set_heading($course->fullname);
$PAGE->set_pagelayout('incourse');

echo $OUTPUT->header();
echo $OUTPUT->heading(get_string('modulenameplural', 'mod_ielts'));

// Get all IELTS instances in this course.
$ieltsinstances = get_all_instances_in_course('ielts', $course);

if (empty($ieltsinstances)) {
    notice(get_string('noielts', 'mod_ielts'), new moodle_url('/course/view.php', ['id' => $course->id]));
}

$usesections = course_format_uses_sections($course->format);

$table = new html_table();
$table->attributes['class'] = 'generaltable mod_index';

if ($usesections) {
    $strsectionname = get_string('sectionname', 'format_' . $course->format);
    $table->head = [$strsectionname, get_string('name'), get_string('description')];
    $table->align = ['center', 'left', 'left'];
} else {
    $table->head = [get_string('name'), get_string('description')];
    $table->align = ['left', 'left'];
}

foreach ($ieltsinstances as $ielts) {
    $context = context_module::instance($ielts->coursemodule);

    $attributes = [];
    if (!$ielts->visible) {
        $attributes['class'] = 'dimmed';
    }

    $link = html_writer::link(
        new moodle_url('/mod/ielts/view.php', ['id' => $ielts->coursemodule]),
        format_string($ielts->name),
        $attributes
    );

    $description = format_module_intro('ielts', $ielts, $ielts->coursemodule);

    if ($usesections) {
        $table->data[] = [get_section_name($course, $ielts->section), $link, $description];
    } else {
        $table->data[] = [$link, $description];
    }
}

echo html_writer::table($table);
echo $OUTPUT->footer();
