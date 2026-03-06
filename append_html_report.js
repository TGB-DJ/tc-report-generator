import fs from 'fs';

const htmlFile = 'd:/tc report/College_Management_Report.html';
let content = fs.readFileSync(htmlFile, 'utf8');

// remove </body></html>
content = content.replace("</body></html>", "");

function newPage(pageContent) {
    return "<div class='page'><div class='page-border'>" + pageContent + "</div></div>\\n";
}

let extraPages = [];

// Adding HTML Sample Code (10 pages)
for (let i = 1; i <= 10; i++) {
    let dummy = "<h3>10.2 Sample HTML Code - Interface Component " + i + "</h3>";
    dummy += "<pre>&lt;!DOCTYPE html&gt;\\n&lt;html lang=\"en\"&gt;\\n&lt;head&gt;\\n    &lt;meta charset=\"UTF-8\"&gt;\\n    &lt;title&gt;College Management Interface " + i + "&lt;/title&gt;\\n    &lt;link rel=\"stylesheet\" href=\"style.css\"&gt;\\n&lt;/head&gt;\\n&lt;body&gt;\\n";
    dummy += "    &lt;div class=\"container\"&gt;\\n        &lt;header class=\"app-header\"&gt;\\n            &lt;h1&gt;College Administrative Dashboard - Interface " + i + "&lt;/h1&gt;\\n            &lt;nav&gt;\\n                &lt;ul&gt;\\n                    &lt;li&gt;&lt;a href=\"/dashboard\"&gt;Home&lt;/a&gt;&lt;/li&gt;\\n                    &lt;li&gt;&lt;a href=\"/students\"&gt;Students&lt;/a&gt;&lt;/li&gt;\\n                    &lt;li&gt;&lt;a href=\"/faculty\"&gt;Faculty&lt;/a&gt;&lt;/li&gt;\\n                    &lt;li&gt;&lt;a href=\"/reports\"&gt;Reports&lt;/a&gt;&lt;/li&gt;\\n                    &lt;li&gt;&lt;a href=\"/logout\"&gt;Logout&lt;/a&gt;&lt;/li&gt;\\n                &lt;/ul&gt;\\n            &lt;/nav&gt;\\n        &lt;/header&gt;\\n";
    dummy += "        &lt;main class=\"content-area\"&gt;\\n            &lt;section class=\"data-table-container\"&gt;\\n                &lt;h2&gt;Generated HTML Data Grid for Component " + i + "&lt;/h2&gt;\\n                &lt;table class=\"table table-striped table-hover\"&gt;\\n                    &lt;thead&gt;\\n                        &lt;tr&gt;&lt;th&gt;#ID&lt;/th&gt;&lt;th&gt;Data Object Name&lt;/th&gt;&lt;th&gt;System Value&lt;/th&gt;&lt;th&gt;Status String&lt;/th&gt;&lt;/tr&gt;\\n                    &lt;/thead&gt;\\n                    &lt;tbody&gt;\\n";
    for (let j = 0; j < 15; j++) {
        dummy += "                        &lt;tr&gt;&lt;td&gt;" + (i * 100 + j) + "&lt;/td&gt;&lt;td&gt;Metric Instance " + j + "&lt;/td&gt;&lt;td&gt;" + (Math.random() * 100).toFixed(2) + "&lt;/td&gt;&lt;td&gt;&lt;span class=\"badge bg-success\"&gt;Active&lt;/span&gt;&lt;/td&gt;&lt;/tr&gt;\\n";
    }
    dummy += "                    &lt;/tbody&gt;\\n                &lt;/table&gt;\\n            &lt;/section&gt;\\n            &lt;aside class=\"sidebar-controls\"&gt;\\n                &lt;form action=\"/api/submit_form\" method=\"post\"&gt;\\n                    &lt;h3&gt;Configuration Panel " + i + "&lt;/h3&gt;\\n                    &lt;div class=\"form-group\"&gt;\\n                        &lt;label for=\"setting1\"&gt;Update Metric Parameters&lt;/label&gt;\\n                        &lt;input type=\"text\" id=\"setting1\" name=\"setting1\" class=\"form-control\" placeholder=\"Enter values...\" required&gt;\\n                    &lt;/div&gt;\\n                    &lt;button type=\"submit\" class=\"btn btn-primary\"&gt;Save Changes&lt;/button&gt;\\n                &lt;/form&gt;\\n            &lt;/aside&gt;\\n        &lt;/main&gt;\\n";
    dummy += "        &lt;footer class=\"app-footer\"&gt;\\n            &lt;p&gt;&amp;copy; 2026 Kanchi Shri Krishna Arts and Science College ERP System.&lt;/p&gt;\\n        &lt;/footer&gt;\\n    &lt;/div&gt;\\n&lt;/body&gt;\\n&lt;/html&gt;</pre>";
    extraPages.push(dummy);
}

// Adding CSS Sample Code (10 pages)
for (let i = 1; i <= 10; i++) {
    let dummy = "<h3>10.3 Sample CSS Code - Styling Ruleset " + i + "</h3>";
    dummy += "<pre>/* \\n * Cascading Style Sheets (CSS) Configuration File " + i + "\\n * Defines visual styling metrics for College Management System Web Interfaces.\\n * Implements Modern Flexbox and CSS Grid layout algorithms scaling responsively.\\n */\\n\\n";
    dummy += ":root {\\n    --primary-color: #2F80ED;\\n    --secondary-color: #56CCF2;\\n    --background-light: #F9FAFB;\\n    --text-dark: #1F2937;\\n    --border-radius: 8px;\\n    --transition-speed: 0.3s ease;\\n    --font-stack: 'Inter', 'Segoe UI', system-ui, sans-serif;\\n}\\n\\n";
    dummy += ".app-container-" + i + " {\\n    display: grid;\\n    grid-template-columns: 250px 1fr;\\n    min-height: 100vh;\\n    background-color: var(--background-light);\\n    font-family: var(--font-stack);\\n    color: var(--text-dark);\\n}\\n\\n";
    dummy += ".sidebar-navigation, .main-dashboard-area {\\n    padding: 2rem;\\n    box-sizing: border-box;\\n}\\n\\n";
    dummy += ".sidebar-navigation {\\n    background-color: #ffffff;\\n    border-right: 1px solid #e5e7eb;\\n    box-shadow: 2px 0 10px rgba(0,0,0,0.02);\\n    display: flex;\\n    flex-direction: column;\\n    gap: 1.5rem;\\n}\\n\\n";
    dummy += ".nav-item {\\n    padding: 0.75rem 1rem;\\n    border-radius: var(--border-radius);\\n    text-decoration: none;\\n    color: #4b5563;\\n    font-weight: 500;\\n    transition: background-color var(--transition-speed), color var(--transition-speed);\\n}\\n\\n";
    dummy += ".nav-item:hover, .nav-item.active {\\n    background-color: var(--primary-color);\\n    color: #ffffff;\\n}\\n\\n";
    dummy += ".data-table-grid {\\n    width: 100%;\\n    border-collapse: separate;\\n    border-spacing: 0;\\n    border-radius: var(--border-radius);\\n    overflow: hidden;\\n    border: 1px solid #e5e7eb;\\n}\\n\\n";
    dummy += ".data-table-grid th {\\n    background-color: #f3f4f6;\\n    color: #374151;\\n    font-weight: 600;\\n    padding: 1rem;\\n    text-align: left;\\n    text-transform: uppercase;\\n    font-size: 0.75rem;\\n    letter-spacing: 0.05em;\\n}\\n\\n";
    dummy += ".data-table-grid td {\\n    padding: 1rem;\\n    border-top: 1px solid #e5e7eb;\\n    background-color: #ffffff;\\n}\\n\\n";
    dummy += ".data-table-grid tr:hover td {\\n    background-color: #f9fafb;\\n}\\n\\n";
    for (let j = 0; j < 5; j++) {
        dummy += ".dynamic-component-" + j + " {\\n    display: inline-flex;\\n    align-items: center;\\n    justify-content: center;\\n    padding: 0.5rem 1rem;\\n    background-color: " + (j % 2 === 0 ? "var(--primary-color)" : "var(--secondary-color)") + ";\\n    color: #fff;\\n    border-radius: 999px;\\n    font-size: 0.875rem;\\n    font-weight: 600;\\n    box-shadow: 0 1px 2px rgba(0,0,0,0.05);\\n}\\n\\n";
    }
    dummy += "@media (max-width: 768px) {\\n    .app-container-" + i + " {\\n        grid-template-columns: 1fr;\\n    }\\n    .sidebar-navigation {\\n        display: none; /* Implement mobile hamburger menu dynamically via JS */\\n    }\\n}\\n</pre>";
    extraPages.push(dummy);
}

// Adding MySQL Sample Code (10 pages)
for (let i = 1; i <= 10; i++) {
    let dummy = "<h3>10.4 Sample MySQL Schema - Relational Architecture " + i + "</h3>";
    dummy += "<pre>-- MySQL Database Migration Script " + i + "\\n-- Generating Normalized Data Clusters enforcing strict Referential Integrity Constraints\\n-- Engine: InnoDB (Enforcing ACID transactions globally)\\n\\n";
    dummy += "START TRANSACTION;\\n\\n";
    dummy += "CREATE TABLE `academic_records_" + i + "` (\\n    `record_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,\\n    `student_reference` INT(11) NOT NULL,\\n    `course_module_code` VARCHAR(20) COLLATE utf8mb4_unicode_ci NOT NULL,\\n    `internal_assessment_score` DECIMAL(5,2) DEFAULT '0.00',\\n    `end_semester_score` DECIMAL(5,2) DEFAULT '0.00',\\n    `total_grade_points` DECIMAL(4,2) AS (`internal_assessment_score` + `end_semester_score`) STORED,\\n    `grade_letter` VARCHAR(2) GENERATED ALWAYS AS (\\n        CASE \\n            WHEN (`internal_assessment_score` + `end_semester_score`) &gt;= 90 THEN 'O'\\n            WHEN (`internal_assessment_score` + `end_semester_score`) &gt;= 80 THEN 'A+'\\n            WHEN (`internal_assessment_score` + `end_semester_score`) &gt;= 70 THEN 'A'\\n            WHEN (`internal_assessment_score` + `end_semester_score`) &gt;= 60 THEN 'B+'\\n            WHEN (`internal_assessment_score` + `end_semester_score`) &gt;= 50 THEN 'B'\\n            ELSE 'U'\\n        END\\n    ) VIRTUAL,\\n    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\\n    `last_modified` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\\n    PRIMARY KEY (`record_id`),\\n    KEY `idx_student_ref` (`student_reference`),\\n    KEY `idx_course_module` (`course_module_code`),\\n    CONSTRAINT `fk_arc_student_" + i + "` FOREIGN KEY (`student_reference`) REFERENCES `students` (`student_id`) ON DELETE CASCADE ON UPDATE CASCADE\\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\\n\\n";

    for (let j = 0; j < 5; j++) {
        dummy += "-- Analytical View Generation Structure " + j + "\\nCREATE OR REPLACE VIEW `vw_student_performance_analytics_" + j + "` AS\\nSELECT \\n    s.full_name AS student_name, \\n    d.dept_name AS department, \\n    COUNT(ar.course_module_code) AS total_courses_enrolled, \\n    AVG(ar.total_grade_points) AS average_cgpa_metric \\nFROM students s \\nJOIN departments d ON s.dept_id = d.dept_id \\nJOIN `academic_records_" + i + "` ar ON s.student_id = ar.student_reference \\nWHERE (SELECT status FROM fees f WHERE f.student_id = s.student_id ORDER BY payment_date DESC LIMIT 1) = 'paid' \\nGROUP BY s.student_id \\nHAVING average_cgpa_metric &gt; " + (60 + j * 2) + " \\nORDER BY average_cgpa_metric DESC;\\n\\n";
    }
    dummy += "COMMIT;\\n</pre>";
    extraPages.push(dummy);
}

for (let contentChunk of extraPages) {
    content += newPage(contentChunk);
}

content += "</body></html>";
fs.writeFileSync(htmlFile, content, 'utf8');
console.log('Appended ' + extraPages.length + ' pages of HTML, CSS, and MySQL sample code.');
