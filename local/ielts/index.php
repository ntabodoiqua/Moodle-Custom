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
 * IELTS Plugin main page
 *
 * @package    local_ielts
 * @copyright  2025
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once('../../config.php');

// Require login.
require_login();

// Set page context to system context.
$context = context_system::instance();
$PAGE->set_context($context);

// Set page URL.
$PAGE->set_url(new moodle_url('/local/ielts/index.php'));

// Set page layout to 'embedded' to hide header/footer.
$PAGE->set_pagelayout('embedded');

// Set page title.
$PAGE->set_title(get_string('pluginname', 'local_ielts'));

// Prepare configuration array for React app.
$config = [
    'userId' => $USER->id,
    'sesskey' => sesskey(),
    'wwwroot' => $CFG->wwwroot,
    'apiEndpoint' => $CFG->wwwroot . '/local/ielts/api.php'
];

// Output page header.
echo $OUTPUT->header();

// Render main div with React root and config data.
$configjson = json_encode($config);
$version = time(); // Cache busting version.

echo html_writer::tag('div', '', [
    'id' => 'root',
    'data-moodle-config' => $configjson
]);

// Include React build CSS.
echo html_writer::tag('link', '', [
    'rel' => 'stylesheet',
    'href' => new moodle_url('/local/ielts/build/assets/index.css', ['v' => $version])
]);

// Include vendor chunk first (React, React DOM, React Router).
echo html_writer::tag('script', '', [
    'type' => 'module',
    'src' => new moodle_url('/local/ielts/build/assets/vendor.js', ['v' => $version])
]);

// Include Ant Design chunk.
echo html_writer::tag('script', '', [
    'type' => 'module',
    'src' => new moodle_url('/local/ielts/build/assets/antd.js', ['v' => $version])
]);

// Include React build JS as module.
echo html_writer::tag('script', '', [
    'type' => 'module',
    'src' => new moodle_url('/local/ielts/build/assets/index.js', ['v' => $version])
]);

// Output page footer.
echo $OUTPUT->footer();
