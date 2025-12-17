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
 * Language strings for mod_ielts.
 *
 * @package    mod_ielts
 * @copyright  2025 Your Name
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

// General strings.
$string['pluginname'] = 'IELTS Exam';
$string['modulename'] = 'IELTS Exam';
$string['modulenameplural'] = 'IELTS Exams';
$string['pluginadministration'] = 'IELTS Exam administration';

// Capabilities.
$string['ielts:addinstance'] = 'Add a new IELTS Exam activity';
$string['ielts:view'] = 'View IELTS Exam';
$string['ielts:submit'] = 'Submit IELTS Exam attempt';
$string['ielts:viewreports'] = 'View IELTS Exam reports';
$string['ielts:grade'] = 'Grade IELTS Exam attempts';

// Form strings.
$string['ieltsname'] = 'Exam name';
$string['ieltsname_help'] = 'Enter a name for this IELTS exam activity.';
$string['content_json'] = 'Exam content (JSON)';
$string['content_json_help'] = 'Paste the full JSON content for this IELTS exam. This should conform to the ExamData interface structure with reading passages, listening sections, and questions.';
$string['examcontent'] = 'Exam Content';

// Input method strings.
$string['inputmethod'] = 'Input Method';
$string['inputmethod_help'] = 'Choose how to create your exam content: use the Visual Builder for a guided interface, or paste JSON directly for advanced users.';
$string['inputmethod_builder'] = 'Visual Builder (Recommended)';
$string['inputmethod_json'] = 'Direct JSON Input';
$string['selectinputmethod'] = 'Select input method';

// Builder section strings.
$string['exambuilder'] = 'Exam Builder';
$string['jsoninput'] = 'JSON Input (Advanced)';
$string['jsoninput_help'] = 'For advanced users: paste the complete JSON structure of your exam here. Changes made in the Visual Builder will be synced here.';

// Skill strings.
$string['selectskills'] = 'Select Skills to Include';
$string['skill_reading'] = 'Reading';
$string['skill_listening'] = 'Listening';
$string['skill_writing'] = 'Writing';
$string['skill_speaking'] = 'Speaking';

// Duration strings.
$string['skillduration'] = 'Duration per Skill (minutes)';
$string['duration_reading'] = 'Reading duration (minutes)';
$string['duration_listening'] = 'Listening duration (minutes)';
$string['duration_writing'] = 'Writing duration (minutes)';
$string['duration_speaking'] = 'Speaking duration (minutes)';

// Help text for each skill.
$string['reading_help'] = 'Add reading passages with question groups. Each passage can have multiple question groups with different question types.';
$string['listening_help'] = 'Add listening sections with audio URLs and question groups. Students will listen to the audio and answer questions.';
$string['writing_help'] = 'Add writing tasks (Task 1 for graphs/charts, Task 2 for essays). Set minimum word counts and provide prompts.';
$string['speaking_help'] = 'Add speaking parts with questions and topics. You can set preparation and speaking times for each part.';

// Reading strings.
$string['addpassage'] = 'Add Passage';
$string['passagetitle'] = 'Passage Title';
$string['passagecontent'] = 'Passage Content';

// Listening strings.
$string['addlisteningsection'] = 'Add Listening Section';
$string['sectiontitle'] = 'Section Title';
$string['audiourl'] = 'Audio URL';
$string['sectioninstruction'] = 'Section Instructions';

// Writing strings.
$string['addwritingtask'] = 'Add Writing Task';
$string['tasktitle'] = 'Task Title';
$string['tasktype'] = 'Task Type';
$string['taskprompt'] = 'Task Prompt';
$string['minwords'] = 'Minimum Words';
$string['imageurl'] = 'Image URL (for Task 1)';
$string['task1'] = 'Task 1 (Graph/Chart/Diagram)';
$string['task2'] = 'Task 2 (Essay)';

// Speaking strings.
$string['addspeakingpart'] = 'Add Speaking Part';
$string['parttitle'] = 'Part Title';
$string['partnumber'] = 'Part Number';
$string['partdescription'] = 'Part Description';
$string['preparationtime'] = 'Preparation Time (seconds)';
$string['speakingtime'] = 'Speaking Time (seconds)';
$string['speakingquestions'] = 'Questions/Topics';

// Question group strings.
$string['addquestiongroup'] = 'Add Question Group';
$string['grouptitle'] = 'Group Title';
$string['groupinstruction'] = 'Group Instructions';

// Question strings.
$string['addquestion'] = 'Add Question';
$string['questionnumber'] = 'Question Number';
$string['questiontext'] = 'Question Text';
$string['questiontype'] = 'Question Type';
$string['correctanswer'] = 'Correct Answer';
$string['options'] = 'Options';
$string['addoption'] = 'Add Option';

// Question type strings.
$string['type_multiple_choice'] = 'Multiple Choice';
$string['type_true_false'] = 'True/False/Not Given';
$string['type_gap_fill'] = 'Gap Fill';
$string['type_matching'] = 'Matching';
$string['type_map_labeling'] = 'Map Labeling';

// Action strings.
$string['delete'] = 'Delete';
$string['edit'] = 'Edit';
$string['save'] = 'Save';
$string['cancel'] = 'Cancel';
$string['confirm_delete'] = 'Are you sure you want to delete this item?';

// View strings.
$string['examnotconfigured'] = 'This exam has not been configured yet. Please contact your teacher.';
$string['attemptexam'] = 'Attempt Exam';
$string['viewresults'] = 'View Results';
$string['noattempts'] = 'You have not attempted this exam yet.';
$string['yourattempts'] = 'Your attempts';
$string['attempt'] = 'Attempt';
$string['band'] = 'Band';
$string['date'] = 'Date';
$string['actions'] = 'Actions';

// Grading strings.
$string['gradesection'] = 'Grade settings';
$string['grade'] = 'Grade';
$string['grademax'] = 'Maximum grade';
$string['gradepass'] = 'Grade to pass';
$string['gradingmethod'] = 'Grading method';
$string['highestattempt'] = 'Highest attempt';
$string['lastattempt'] = 'Last attempt';
$string['firstattempt'] = 'First attempt';
$string['averageattempt'] = 'Average of all attempts';

// Error strings.
$string['invalidieltsid'] = 'Invalid IELTS exam ID';
$string['cannotviewattempt'] = 'You cannot view this attempt';
$string['examnotfound'] = 'Exam not found';
$string['invalidjsonformat'] = 'Invalid JSON format in exam content';

// Privacy strings.
$string['privacy:metadata:ielts_attempts'] = 'Information about user attempts on IELTS exams';
$string['privacy:metadata:ielts_attempts:userid'] = 'The ID of the user who made the attempt';
$string['privacy:metadata:ielts_attempts:ieltsid'] = 'The ID of the IELTS exam';
$string['privacy:metadata:ielts_attempts:score_data'] = 'The detailed answers and scores from the attempt';
$string['privacy:metadata:ielts_attempts:final_band'] = 'The final band score achieved';
$string['privacy:metadata:ielts_attempts:timecreated'] = 'The time when the attempt was started';
$string['privacy:metadata:ielts_attempts:timefinished'] = 'The time when the attempt was completed';

// Misc strings.
$string['indicator:cognitivedepth'] = 'IELTS Exam cognitive';
$string['indicator:cognitivedepth_help'] = 'This indicator is based on the cognitive depth reached by the student in an IELTS Exam activity.';
$string['indicator:cognitivedepthdef'] = 'IELTS Exam cognitive';
$string['indicator:cognitivedepthdef_help'] = 'The participant has reached this percentage of the cognitive engagement offered by the IELTS Exam activities during this analysis interval.';
$string['indicator:socialbreadth'] = 'IELTS Exam social';
$string['indicator:socialbreadth_help'] = 'This indicator is based on the social breadth reached by the student in an IELTS Exam activity.';
$string['indicator:socialbreadthdef'] = 'IELTS Exam social';
$string['indicator:socialbreadthdef_help'] = 'The participant has reached this percentage of the social engagement offered by the IELTS Exam activities during this analysis interval.';

// Search.
$string['search:activity'] = 'IELTS Exam - activity information';

// Reset strings.
$string['deleteallattempts'] = 'Delete all IELTS attempts';

// Index page.
$string['noielts'] = 'There are no IELTS activities in this course';

// Events.
$string['eventattemptsubmitted'] = 'IELTS attempt submitted';
$string['eventcoursemoduleviewed'] = 'IELTS activity viewed';

// ==========================================================
// EXAM BUILDER STRINGS
// ==========================================================

// Input method.
$string['inputmethod'] = 'Input Method';
$string['inputmethod_help'] = 'Choose how to create your exam content: use the Visual Builder for a guided interface, or paste JSON directly for advanced users.';
$string['inputmethod_builder'] = 'Visual Builder (Recommended)';
$string['inputmethod_json'] = 'Direct JSON Input';
$string['selectinputmethod'] = 'Select input method';

// Builder sections.
$string['exambuilder'] = 'Exam Builder';
$string['jsoninput'] = 'JSON Input (Advanced)';
$string['jsoninput_help'] = 'For advanced users: paste the complete JSON structure of your exam here. Changes made in the Visual Builder will be synced here.';

// Skills.
$string['selectskills'] = 'Select Skills to Include';
$string['skill_reading'] = 'Reading';
$string['skill_listening'] = 'Listening';
$string['skill_writing'] = 'Writing';
$string['skill_speaking'] = 'Speaking';

// Duration settings.
$string['skillduration'] = 'Duration per Skill (minutes)';
$string['duration_reading'] = 'Reading duration (minutes)';
$string['duration_listening'] = 'Listening duration (minutes)';
$string['duration_writing'] = 'Writing duration (minutes)';
$string['duration_speaking'] = 'Speaking duration (minutes)';

// Help text for each skill.
$string['reading_help'] = 'Add reading passages with question groups. Each passage can have multiple question groups with different question types.';
$string['listening_help'] = 'Add listening sections with audio URLs and question groups. Students will listen to the audio and answer questions.';
$string['writing_help'] = 'Add writing tasks (Task 1 for graphs/charts, Task 2 for essays). Set minimum word counts and provide prompts.';
$string['speaking_help'] = 'Add speaking parts with questions and topics. You can set preparation and speaking times for each part.';

// Reading.
$string['addpassage'] = 'Add Passage';
$string['passagetitle'] = 'Passage Title';
$string['passagecontent'] = 'Passage Content';

// Listening.
$string['addlisteningsection'] = 'Add Listening Section';
$string['sectiontitle'] = 'Section Title';
$string['audiourl'] = 'Audio URL';
$string['sectioninstruction'] = 'Section Instructions';

// Writing.
$string['addwritingtask'] = 'Add Writing Task';
$string['tasktitle'] = 'Task Title';
$string['tasktype'] = 'Task Type';
$string['taskprompt'] = 'Task Prompt';
$string['minwords'] = 'Minimum Words';
$string['imageurl'] = 'Image URL (for Task 1)';
$string['task1'] = 'Task 1 (Graph/Chart/Diagram)';
$string['task2'] = 'Task 2 (Essay)';

// Speaking.
$string['addspeakingpart'] = 'Add Speaking Part';
$string['parttitle'] = 'Part Title';
$string['partnumber'] = 'Part Number';
$string['partdescription'] = 'Part Description';
$string['preparationtime'] = 'Preparation Time (seconds)';
$string['speakingtime'] = 'Speaking Time (seconds)';
$string['speakingquestions'] = 'Questions/Topics';

// Question groups.
$string['addquestiongroup'] = 'Add Question Group';
$string['grouptitle'] = 'Group Title';
$string['groupinstruction'] = 'Group Instructions';

// Questions.
$string['addquestion'] = 'Add Question';
$string['questionnumber'] = 'Question Number';
$string['questiontext'] = 'Question Text';
$string['questiontype'] = 'Question Type';
$string['correctanswer'] = 'Correct Answer';
$string['options'] = 'Options';
$string['addoption'] = 'Add Option';

// Question types.
$string['type_multiple_choice'] = 'Multiple Choice';
$string['type_true_false'] = 'True/False/Not Given';
$string['type_gap_fill'] = 'Gap Fill';
$string['type_matching'] = 'Matching';
$string['type_map_labeling'] = 'Map Labeling';

// Actions.
$string['delete'] = 'Delete';
$string['edit'] = 'Edit';
$string['save'] = 'Save';
$string['cancel'] = 'Cancel';
$string['confirm_delete'] = 'Are you sure you want to delete this item?';
$string['review'] = 'Review';
$string['actions'] = 'Actions';

// Attempt history strings.
$string['yourattempts'] = 'Your Attempts';
$string['totalattempts'] = 'Total Attempts';
$string['bestband'] = 'Best Band Score';
$string['startnewattempt'] = 'Start New Attempt';
$string['attempthistory'] = 'Attempt History';
$string['datestarted'] = 'Date Started';
$string['datefinished'] = 'Date Finished';
$string['bandscore'] = 'Band Score';
$string['status'] = 'Status';
$string['completed'] = 'Completed';
$string['inprogress'] = 'In Progress';
$string['noattemptsyet'] = 'You have not made any attempts yet. Click "Start New Attempt" to begin your IELTS practice test.';
$string['back'] = 'Back to overview';

// Review page strings.
$string['detailedresults'] = 'Detailed Results';
$string['youranswer'] = 'Your Answer';
$string['wordcount'] = 'Word Count';
$string['noanswer'] = 'No answer provided';
$string['norecording'] = 'No recording';
$string['noresultsdata'] = 'No detailed results data available for this attempt.';
$string['invalidattempt'] = 'Invalid attempt';
$string['nopermission'] = 'You do not have permission to view this attempt';

// Events.
$string['eventattemptsubmitted'] = 'IELTS attempt submitted';
$string['eventcoursemoduleviewed'] = 'IELTS activity viewed';
