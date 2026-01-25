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
 * IELTS module upgrade steps.
 *
 * @package    mod_ielts
 * @copyright  2025 Your Name
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Execute mod_ielts upgrade from the given old version.
 *
 * @param int $oldversion
 * @return bool
 */
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

    return true;
}
