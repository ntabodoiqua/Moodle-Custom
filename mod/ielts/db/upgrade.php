<?php

/**
 * script cập nhật module IELTS.
 */

defined('MOODLE_INTERNAL') || die();


function xmldb_ielts_upgrade($oldversion) {
    global $DB;

    $dbman = $DB->get_manager();

    if ($oldversion < 2026012500) {
        // Define fields to be added to ielts_attempts.
        $table = new xmldb_table('ielts_attempts');

        // Add reading_band field.
        $field = new xmldb_field('reading_band', XMLDB_TYPE_NUMBER, '4, 1', null, null, null, null, 'final_band');
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        // Add listening_band field.
        $field = new xmldb_field('listening_band', XMLDB_TYPE_NUMBER, '4, 1', null, null, null, null, 'reading_band');
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        // Add writing_band field.
        $field = new xmldb_field('writing_band', XMLDB_TYPE_NUMBER, '4, 1', null, null, null, null, 'listening_band');
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        // Add speaking_band field.
        $field = new xmldb_field('speaking_band', XMLDB_TYPE_NUMBER, '4, 1', null, null, null, null, 'writing_band');
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        // Add writing_feedback field.
        $field = new xmldb_field('writing_feedback', XMLDB_TYPE_TEXT, null, null, null, null, null, 'speaking_band');
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        // Add speaking_feedback field.
        $field = new xmldb_field('speaking_feedback', XMLDB_TYPE_TEXT, null, null, null, null, null, 'writing_feedback');
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        // Add graded_by field.
        $field = new xmldb_field('graded_by', XMLDB_TYPE_INTEGER, '10', null, null, null, null, 'speaking_feedback');
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        // Add timegraded field.
        $field = new xmldb_field('timegraded', XMLDB_TYPE_INTEGER, '10', null, null, null, null, 'graded_by');
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        // Add key for graded_by.
        $key = new xmldb_key('graded_by', XMLDB_KEY_FOREIGN, ['graded_by'], 'user', ['id']);
        $dbman->add_key($table, $key);

        // Ielts savepoint reached.
        upgrade_mod_savepoint(true, 2026012500, 'ielts');
    }

    if ($oldversion < 2026012502) {
        // Define field maxattempts to be added to ielts.
        $table = new xmldb_table('ielts');
        $field = new xmldb_field('maxattempts', XMLDB_TYPE_INTEGER, '6', null, XMLDB_NOTNULL, null, '0', 'grade');

        // Conditionally launch add field maxattempts.
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        // Ielts savepoint reached.
        upgrade_mod_savepoint(true, 2026012502, 'ielts');
    }

    return true;
}
