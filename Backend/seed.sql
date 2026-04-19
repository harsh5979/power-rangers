-- =============================================================
--  TS-12  Early Academic Risk Detection & Intervention Platform
--  PostgreSQL Integration Queries
-- =============================================================

-- ─────────────────────────────────────────────────────────────
--  0. EXTENSIONS
-- ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- fuzzy student name search


-- ─────────────────────────────────────────────────────────────
--  1. ENUM TYPES
-- ─────────────────────────────────────────────────────────────
CREATE TYPE degree_type         AS ENUM ('BE', 'BTech', 'BSc', 'BCA', 'ME', 'MTech', 'MCA', 'MBA', 'PhD');
CREATE TYPE faculty_role        AS ENUM ('subject_teacher', 'faculty_mentor', 'hod', 'admin');
CREATE TYPE student_status      AS ENUM ('active', 'detained', 'dropped', 'graduated');
CREATE TYPE enrollment_status   AS ENUM ('enrolled', 'withdrawn', 'completed');
CREATE TYPE attendance_status   AS ENUM ('present', 'absent', 'late', 'excused');
CREATE TYPE assessment_type     AS ENUM ('unit_test', 'mid_sem', 'end_sem', 'practical', 'viva', 'quiz');
CREATE TYPE submission_status   AS ENUM ('submitted', 'late', 'missing', 'excused');
CREATE TYPE risk_level          AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE factor_type         AS ENUM ('attendance', 'marks', 'assignment', 'lms_activity');
CREATE TYPE factor_severity     AS ENUM ('low', 'medium', 'high');
CREATE TYPE intervention_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
CREATE TYPE snapshot_type       AS ENUM ('before', 'after');
CREATE TYPE alert_severity      AS ENUM ('info', 'warning', 'critical');
CREATE TYPE lms_activity_type   AS ENUM ('login', 'video_view', 'document_access', 'quiz_attempt', 'forum_post', 'assignment_view');


-- ─────────────────────────────────────────────────────────────
--  2. CORE SCHEMA — DDL
-- ─────────────────────────────────────────────────────────────

-- ── 2.1 College ──────────────────────────────────────────────
CREATE TABLE college (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name                TEXT        NOT NULL,
    city                TEXT        NOT NULL,
    state               TEXT        NOT NULL,
    affiliation_body    TEXT,                          -- e.g. GTU, Mumbai University
    accreditation_grade TEXT,                          -- NAAC A, A+, etc.
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2.2 Department ───────────────────────────────────────────
CREATE TABLE department (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id  UUID NOT NULL REFERENCES college(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    code        TEXT NOT NULL,                         -- CE, IT, ME, etc.
    UNIQUE (college_id, code)
);

-- ── 2.3 Program ──────────────────────────────────────────────
CREATE TABLE program (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id   UUID        NOT NULL REFERENCES department(id) ON DELETE CASCADE,
    name            TEXT        NOT NULL,
    degree_type     degree_type NOT NULL,
    duration_years  INT         NOT NULL CHECK (duration_years BETWEEN 1 AND 6),
    specialization  TEXT
);

-- ── 2.4 Academic Year / Semester ─────────────────────────────
CREATE TABLE academic_year (
    id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id      UUID    NOT NULL REFERENCES college(id) ON DELETE CASCADE,
    label           TEXT    NOT NULL,                  -- e.g. "2024-25 Odd Sem"
    semester_number INT     NOT NULL CHECK (semester_number BETWEEN 1 AND 10),
    start_date      DATE    NOT NULL,
    end_date        DATE    NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT FALSE,
    CHECK (end_date > start_date)
);

-- ── 2.5 Faculty ──────────────────────────────────────────────
CREATE TABLE faculty (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID         NOT NULL REFERENCES department(id) ON DELETE CASCADE,
    emp_code      TEXT         NOT NULL UNIQUE,
    full_name     TEXT         NOT NULL,
    email         TEXT         NOT NULL UNIQUE,
    role          faculty_role NOT NULL DEFAULT 'subject_teacher',
    specialization TEXT,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── 2.6 Student ──────────────────────────────────────────────
CREATE TABLE student (
    id                 UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id         UUID           NOT NULL REFERENCES program(id),
    mentor_faculty_id  UUID           REFERENCES faculty(id) ON DELETE SET NULL,
    enrollment_no      TEXT           NOT NULL UNIQUE,
    full_name          TEXT           NOT NULL,
    email              TEXT           NOT NULL UNIQUE,
    current_semester   INT            NOT NULL CHECK (current_semester BETWEEN 1 AND 10),
    batch_year         INT            NOT NULL,
    status             student_status NOT NULL DEFAULT 'active',
    created_at         TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ── 2.7 Course ───────────────────────────────────────────────
CREATE TABLE course (
    id                  UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id          UUID  NOT NULL REFERENCES program(id),
    academic_year_id    UUID  NOT NULL REFERENCES academic_year(id),
    subject_teacher_id  UUID  NOT NULL REFERENCES faculty(id),
    code                TEXT  NOT NULL,
    name                TEXT  NOT NULL,
    semester            INT   NOT NULL CHECK (semester BETWEEN 1 AND 10),
    credits             INT   NOT NULL CHECK (credits BETWEEN 1 AND 6),
    max_internal_marks  INT   NOT NULL DEFAULT 30,
    UNIQUE (academic_year_id, code)
);

-- ── 2.8 Enrollment ───────────────────────────────────────────
CREATE TABLE enrollment (
    id           UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id   UUID              NOT NULL REFERENCES student(id) ON DELETE CASCADE,
    course_id    UUID              NOT NULL REFERENCES course(id)  ON DELETE CASCADE,
    enrolled_on  DATE              NOT NULL DEFAULT CURRENT_DATE,
    status       enrollment_status NOT NULL DEFAULT 'enrolled',
    UNIQUE (student_id, course_id)
);

-- ── 2.9 Attendance Session ───────────────────────────────────
CREATE TABLE attendance_session (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id     UUID        NOT NULL REFERENCES course(id) ON DELETE CASCADE,
    faculty_id    UUID        NOT NULL REFERENCES faculty(id),
    session_date  DATE        NOT NULL,
    topic_covered TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2.10 Attendance Record ───────────────────────────────────
CREATE TABLE attendance_record (
    id         UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID              NOT NULL REFERENCES attendance_session(id) ON DELETE CASCADE,
    student_id UUID              NOT NULL REFERENCES student(id) ON DELETE CASCADE,
    status     attendance_status NOT NULL,
    remarks    TEXT,
    UNIQUE (session_id, student_id)
);

-- ── 2.11 Internal Assessment ─────────────────────────────────
CREATE TABLE internal_assessment (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id       UUID            NOT NULL REFERENCES course(id) ON DELETE CASCADE,
    name            TEXT            NOT NULL,
    assessment_date DATE            NOT NULL,
    max_marks       INT             NOT NULL,
    type            assessment_type NOT NULL
);

-- ── 2.12 Marks ───────────────────────────────────────────────
CREATE TABLE marks (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id        UUID        NOT NULL REFERENCES internal_assessment(id) ON DELETE CASCADE,
    student_id           UUID        NOT NULL REFERENCES student(id) ON DELETE CASCADE,
    marks_obtained       NUMERIC(5,2) NOT NULL,
    entered_by_faculty_id UUID        REFERENCES faculty(id) ON DELETE SET NULL,
    submitted_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (assessment_id, student_id),
    CHECK (marks_obtained >= 0)
);

-- ── 2.13 Assignment ──────────────────────────────────────────
CREATE TABLE assignment (
    id                UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id         UUID    NOT NULL REFERENCES course(id) ON DELETE CASCADE,
    title             TEXT    NOT NULL,
    due_date          DATE    NOT NULL,
    max_marks         INT     NOT NULL,
    extension_allowed BOOLEAN NOT NULL DEFAULT TRUE
);

-- ── 2.14 Assignment Submission ───────────────────────────────
CREATE TABLE assignment_submission (
    id            UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID              NOT NULL REFERENCES assignment(id) ON DELETE CASCADE,
    student_id    UUID              NOT NULL REFERENCES student(id)    ON DELETE CASCADE,
    submitted_at  TIMESTAMPTZ,
    is_late       BOOLEAN           NOT NULL DEFAULT FALSE,
    marks_awarded NUMERIC(5,2),
    status        submission_status NOT NULL DEFAULT 'missing',
    UNIQUE (assignment_id, student_id)
);

-- ── 2.15 LMS Activity Log ────────────────────────────────────
CREATE TABLE lms_activity_log (
    id                UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id        UUID             NOT NULL REFERENCES student(id)  ON DELETE CASCADE,
    course_id         UUID             NOT NULL REFERENCES course(id)   ON DELETE CASCADE,
    activity_type     lms_activity_type NOT NULL,
    occurred_at       TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    duration_seconds  INT              CHECK (duration_seconds >= 0),
    resource_accessed TEXT
);

-- ── 2.16 Risk Score ──────────────────────────────────────────
CREATE TABLE risk_score (
    id                 UUID       PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id         UUID       NOT NULL REFERENCES student(id)       ON DELETE CASCADE,
    academic_year_id   UUID       NOT NULL REFERENCES academic_year(id) ON DELETE CASCADE,
    overall_score      NUMERIC(5,2) NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
    risk_level         risk_level NOT NULL,
    attendance_score   NUMERIC(5,2) NOT NULL,
    marks_score        NUMERIC(5,2) NOT NULL,
    assignment_score   NUMERIC(5,2) NOT NULL,
    lms_score          NUMERIC(5,2) NOT NULL,
    calculated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, academic_year_id, calculated_at)
);

-- ── 2.17 Risk Factor (explainability) ────────────────────────
CREATE TABLE risk_factor (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    risk_score_id       UUID            NOT NULL REFERENCES risk_score(id) ON DELETE CASCADE,
    factor_type         factor_type     NOT NULL,
    description         TEXT            NOT NULL,
    contribution_weight NUMERIC(4,2)    NOT NULL CHECK (contribution_weight BETWEEN 0 AND 1),
    severity            factor_severity NOT NULL
);

-- ── 2.18 Intervention Type ───────────────────────────────────
CREATE TABLE intervention_type (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL UNIQUE,              -- 'Counselling session', 'Remedial class', etc.
    category    TEXT NOT NULL,                     -- 'academic', 'personal', 'administrative'
    description TEXT
);

-- ── 2.19 Intervention ────────────────────────────────────────
CREATE TABLE intervention (
    id                    UUID                 PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id            UUID                 NOT NULL REFERENCES student(id)           ON DELETE CASCADE,
    faculty_id            UUID                 NOT NULL REFERENCES faculty(id),
    intervention_type_id  UUID                 NOT NULL REFERENCES intervention_type(id),
    risk_score_id         UUID                 REFERENCES risk_score(id) ON DELETE SET NULL,
    scheduled_date        DATE                 NOT NULL,
    completed_date        DATE,
    outcome_notes         TEXT,
    status                intervention_status  NOT NULL DEFAULT 'scheduled',
    created_at            TIMESTAMPTZ          NOT NULL DEFAULT NOW()
);

-- ── 2.20 Performance Snapshot ────────────────────────────────
CREATE TABLE performance_snapshot (
    id                        UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id                UUID          NOT NULL REFERENCES student(id)      ON DELETE CASCADE,
    intervention_id           UUID          NOT NULL REFERENCES intervention(id) ON DELETE CASCADE,
    snapshot_type             snapshot_type NOT NULL,
    attendance_pct            NUMERIC(5,2)  NOT NULL,
    avg_marks_pct             NUMERIC(5,2)  NOT NULL,
    assignment_completion_pct NUMERIC(5,2)  NOT NULL,
    recorded_on               DATE          NOT NULL DEFAULT CURRENT_DATE,
    UNIQUE (intervention_id, snapshot_type)
);

-- ── 2.21 Alert ───────────────────────────────────────────────
CREATE TABLE alert (
    id            UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id    UUID           NOT NULL REFERENCES student(id)    ON DELETE CASCADE,
    risk_score_id UUID           REFERENCES risk_score(id) ON DELETE SET NULL,
    faculty_id    UUID           NOT NULL REFERENCES faculty(id),
    alert_type    TEXT           NOT NULL,       -- 'high_risk_detected', 'pre_exam_warning', etc.
    message       TEXT           NOT NULL,
    severity      alert_severity NOT NULL DEFAULT 'warning',
    is_read       BOOLEAN        NOT NULL DEFAULT FALSE,
    sent_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    read_at       TIMESTAMPTZ
);


-- ─────────────────────────────────────────────────────────────
--  3. INDEXES — performance on common query patterns
-- ─────────────────────────────────────────────────────────────

-- Student lookups
CREATE INDEX idx_student_program      ON student(program_id);
CREATE INDEX idx_student_mentor       ON student(mentor_faculty_id);
CREATE INDEX idx_student_status       ON student(status);
CREATE INDEX idx_student_name_trgm    ON student USING gin (full_name gin_trgm_ops);

-- Course / enrollment
CREATE INDEX idx_enrollment_student   ON enrollment(student_id);
CREATE INDEX idx_enrollment_course    ON enrollment(course_id);
CREATE INDEX idx_course_academic_year ON course(academic_year_id);
CREATE INDEX idx_course_teacher       ON course(subject_teacher_id);

-- Attendance (hot path — queried heavily for risk calc)
CREATE INDEX idx_att_session_course   ON attendance_session(course_id);
CREATE INDEX idx_att_session_date     ON attendance_session(session_date);
CREATE INDEX idx_att_record_student   ON attendance_record(student_id);
CREATE INDEX idx_att_record_session   ON attendance_record(session_id);
CREATE INDEX idx_att_record_status    ON attendance_record(status);

-- Marks
CREATE INDEX idx_marks_student        ON marks(student_id);
CREATE INDEX idx_marks_assessment     ON marks(assessment_id);

-- Assignments
CREATE INDEX idx_submission_student   ON assignment_submission(student_id);
CREATE INDEX idx_submission_status    ON assignment_submission(status);
CREATE INDEX idx_assignment_course    ON assignment(course_id);
CREATE INDEX idx_assignment_due       ON assignment(due_date);

-- LMS
CREATE INDEX idx_lms_student          ON lms_activity_log(student_id);
CREATE INDEX idx_lms_occurred         ON lms_activity_log(occurred_at);
CREATE INDEX idx_lms_student_time     ON lms_activity_log(student_id, occurred_at DESC);

-- Risk
CREATE INDEX idx_risk_student         ON risk_score(student_id);
CREATE INDEX idx_risk_level           ON risk_score(risk_level);
CREATE INDEX idx_risk_calc_at         ON risk_score(calculated_at DESC);
CREATE INDEX idx_risk_factor_score    ON risk_factor(risk_score_id);

-- Intervention
CREATE INDEX idx_intervention_student ON intervention(student_id);
CREATE INDEX idx_intervention_faculty ON intervention(faculty_id);
CREATE INDEX idx_intervention_status  ON intervention(status);

-- Alert
CREATE INDEX idx_alert_faculty_unread ON alert(faculty_id) WHERE is_read = FALSE;
CREATE INDEX idx_alert_student        ON alert(student_id);


-- ─────────────────────────────────────────────────────────────
--  4. VIEWS — reusable query surfaces
-- ─────────────────────────────────────────────────────────────

-- ── 4.1 Latest risk score per student (this semester) ────────
CREATE OR REPLACE VIEW v_student_latest_risk AS
SELECT DISTINCT ON (rs.student_id, rs.academic_year_id)
    rs.id                AS risk_score_id,
    rs.student_id,
    s.full_name          AS student_name,
    s.enrollment_no,
    rs.academic_year_id,
    ay.label             AS semester_label,
    rs.overall_score,
    rs.risk_level,
    rs.attendance_score,
    rs.marks_score,
    rs.assignment_score,
    rs.lms_score,
    rs.calculated_at
FROM risk_score rs
JOIN student      s  ON s.id  = rs.student_id
JOIN academic_year ay ON ay.id = rs.academic_year_id
ORDER BY rs.student_id, rs.academic_year_id, rs.calculated_at DESC;


-- ── 4.2 Faculty mentor dashboard — at-risk students ──────────
CREATE OR REPLACE VIEW v_mentor_dashboard AS
SELECT
    f.id             AS faculty_id,
    f.full_name      AS mentor_name,
    s.id             AS student_id,
    s.full_name      AS student_name,
    s.enrollment_no,
    p.name           AS program_name,
    s.current_semester,
    r.overall_score,
    r.risk_level,
    r.attendance_score,
    r.marks_score,
    r.assignment_score,
    r.lms_score,
    r.calculated_at
FROM faculty f
JOIN student s ON s.mentor_faculty_id = f.id AND s.status = 'active'
JOIN v_student_latest_risk r ON r.student_id = s.id
JOIN program p ON p.id = s.program_id
JOIN academic_year ay ON ay.id = r.academic_year_id AND ay.is_active = TRUE
ORDER BY r.overall_score ASC;


-- ── 4.3 Attendance percentage per student per course ─────────
CREATE OR REPLACE VIEW v_attendance_summary AS
SELECT
    ar.student_id,
    sess.course_id,
    COUNT(*)                                                         AS total_sessions,
    COUNT(*) FILTER (WHERE ar.status IN ('present', 'late'))         AS attended,
    ROUND(
        COUNT(*) FILTER (WHERE ar.status IN ('present','late'))
        * 100.0 / NULLIF(COUNT(*), 0), 2
    )                                                                AS attendance_pct
FROM attendance_record ar
JOIN attendance_session sess ON sess.id = ar.session_id
GROUP BY ar.student_id, sess.course_id;


-- ── 4.4 Assignment completion rate per student per course ─────
CREATE OR REPLACE VIEW v_assignment_summary AS
SELECT
    asub.student_id,
    a.course_id,
    COUNT(*)                                                         AS total_assignments,
    COUNT(*) FILTER (WHERE asub.status = 'submitted')                AS submitted_count,
    COUNT(*) FILTER (WHERE asub.status = 'missing')                  AS missing_count,
    COUNT(*) FILTER (WHERE asub.is_late = TRUE)                      AS late_count,
    ROUND(
        COUNT(*) FILTER (WHERE asub.status = 'submitted')
        * 100.0 / NULLIF(COUNT(*), 0), 2
    )                                                                AS completion_pct
FROM assignment_submission asub
JOIN assignment a ON a.id = asub.assignment_id
GROUP BY asub.student_id, a.course_id;


-- ── 4.5 Average marks percentage per student per course ──────
CREATE OR REPLACE VIEW v_marks_summary AS
SELECT
    m.student_id,
    ia.course_id,
    COUNT(DISTINCT ia.id)                                            AS assessments_taken,
    ROUND(AVG(m.marks_obtained * 100.0 / NULLIF(ia.max_marks, 0)), 2) AS avg_marks_pct
FROM marks m
JOIN internal_assessment ia ON ia.id = m.assessment_id
GROUP BY m.student_id, ia.course_id;


-- ── 4.6 LMS engagement last 30 days per student ──────────────
CREATE OR REPLACE VIEW v_lms_summary AS
SELECT
    student_id,
    course_id,
    COUNT(*)                                                          AS total_events,
    COUNT(DISTINCT occurred_at::DATE)                                 AS active_days,
    MAX(occurred_at)                                                  AS last_activity,
    EXTRACT(EPOCH FROM (NOW() - MAX(occurred_at))) / 86400            AS days_since_last_login,
    COALESCE(SUM(duration_seconds), 0)                                AS total_seconds
FROM lms_activity_log
WHERE occurred_at >= NOW() - INTERVAL '30 days'
GROUP BY student_id, course_id;


-- ── 4.7 Before vs after intervention comparison ───────────────
CREATE OR REPLACE VIEW v_intervention_outcomes AS
SELECT
    i.id              AS intervention_id,
    s.full_name       AS student_name,
    s.enrollment_no,
    it.name           AS intervention_type,
    i.scheduled_date,
    i.completed_date,
    i.status,
    -- Before snapshot
    b.attendance_pct            AS before_attendance,
    b.avg_marks_pct             AS before_marks,
    b.assignment_completion_pct AS before_assignments,
    -- After snapshot
    af.attendance_pct            AS after_attendance,
    af.avg_marks_pct             AS after_marks,
    af.assignment_completion_pct AS after_assignments,
    -- Delta
    ROUND(af.attendance_pct - b.attendance_pct, 2)            AS delta_attendance,
    ROUND(af.avg_marks_pct  - b.avg_marks_pct, 2)             AS delta_marks,
    ROUND(af.assignment_completion_pct - b.assignment_completion_pct, 2) AS delta_assignments
FROM intervention i
JOIN student           s  ON s.id  = i.student_id
JOIN intervention_type it ON it.id = i.intervention_type_id
LEFT JOIN performance_snapshot b  ON b.intervention_id = i.id AND b.snapshot_type = 'before'
LEFT JOIN performance_snapshot af ON af.intervention_id = i.id AND af.snapshot_type = 'after';


-- ─────────────────────────────────────────────────────────────
--  5. RISK SCORE CALCULATION FUNCTION
--     Weights: attendance 35%, marks 30%, assignments 20%, lms 15%
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION calculate_risk_score(
    p_student_id       UUID,
    p_academic_year_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_att_pct        NUMERIC := 0;
    v_marks_pct      NUMERIC := 0;
    v_assign_pct     NUMERIC := 0;
    v_lms_days       NUMERIC := 0;
    v_lms_score      NUMERIC := 0;
    v_overall        NUMERIC;
    v_level          risk_level;
    v_score_id       UUID;
    v_att_score      NUMERIC;
    v_marks_score    NUMERIC;
    v_assign_score   NUMERIC;
BEGIN
    -- Average attendance % across all enrolled courses this semester
    SELECT COALESCE(AVG(v.attendance_pct), 0)
    INTO   v_att_pct
    FROM   v_attendance_summary v
    JOIN   enrollment e ON e.student_id = v.student_id AND e.course_id = v.course_id
    JOIN   course c     ON c.id = e.course_id
    WHERE  v.student_id = p_student_id
      AND  c.academic_year_id = p_academic_year_id;

    -- Average marks % across all courses
    SELECT COALESCE(AVG(v.avg_marks_pct), 0)
    INTO   v_marks_pct
    FROM   v_marks_summary v
    JOIN   enrollment e ON e.student_id = v.student_id AND e.course_id = v.course_id
    JOIN   course c     ON c.id = e.course_id
    WHERE  v.student_id = p_student_id
      AND  c.academic_year_id = p_academic_year_id;

    -- Assignment completion rate
    SELECT COALESCE(AVG(v.completion_pct), 0)
    INTO   v_assign_pct
    FROM   v_assignment_summary v
    JOIN   enrollment e ON e.student_id = v.student_id AND e.course_id = v.course_id
    JOIN   course c     ON c.id = e.course_id
    WHERE  v.student_id = p_student_id
      AND  c.academic_year_id = p_academic_year_id;

    -- LMS active days in last 30 days (cap at 25 → 100% score)
    SELECT COALESCE(SUM(active_days), 0)
    INTO   v_lms_days
    FROM   v_lms_summary
    WHERE  student_id = p_student_id;

    -- Convert sub-metrics to 0–100 scores
    v_att_score    := LEAST(v_att_pct, 100);
    v_marks_score  := LEAST(v_marks_pct, 100);
    v_assign_score := LEAST(v_assign_pct, 100);
    v_lms_score    := LEAST(v_lms_days * 4, 100);   -- 25 active days = 100

    -- Weighted overall (higher = safer, so we invert → risk = 100 - safety)
    v_overall := 100 - (
        v_att_score    * 0.35 +
        v_marks_score  * 0.30 +
        v_assign_score * 0.20 +
        v_lms_score    * 0.15
    );

    -- Classify risk level
    v_level := CASE
        WHEN v_overall >= 75 THEN 'critical'
        WHEN v_overall >= 50 THEN 'high'
        WHEN v_overall >= 25 THEN 'medium'
        ELSE                      'low'
    END;

    -- Insert new risk score
    INSERT INTO risk_score (
        student_id, academic_year_id,
        overall_score, risk_level,
        attendance_score, marks_score, assignment_score, lms_score
    )
    VALUES (
        p_student_id, p_academic_year_id,
        ROUND(v_overall, 2), v_level,
        ROUND(v_att_score, 2),
        ROUND(v_marks_score, 2),
        ROUND(v_assign_score, 2),
        ROUND(v_lms_score, 2)
    )
    RETURNING id INTO v_score_id;

    -- Auto-insert top contributing risk factors
    INSERT INTO risk_factor (risk_score_id, factor_type, description, contribution_weight, severity)
    SELECT
        v_score_id,
        factor_type,
        description,
        weight,
        CASE WHEN weight > 0.25 THEN 'high' WHEN weight > 0.15 THEN 'medium' ELSE 'low' END
    FROM (
        VALUES
          ('attendance'::factor_type,
           'Attendance at ' || ROUND(v_att_pct, 1) || '%',
           ROUND((100 - v_att_score) / 100.0 * 0.35, 3)),
          ('marks'::factor_type,
           'Average marks at ' || ROUND(v_marks_pct, 1) || '%',
           ROUND((100 - v_marks_score) / 100.0 * 0.30, 3)),
          ('assignment'::factor_type,
           'Assignment completion at ' || ROUND(v_assign_pct, 1) || '%',
           ROUND((100 - v_assign_score) / 100.0 * 0.20, 3)),
          ('lms_activity'::factor_type,
           'Only ' || v_lms_days::INT || ' active LMS days in last 30 days',
           ROUND((100 - v_lms_score) / 100.0 * 0.15, 3))
    ) AS t(factor_type, description, weight)
    WHERE weight > 0.01;

    RETURN v_score_id;
END;
$$;


-- ─────────────────────────────────────────────────────────────
--  6. ALERT TRIGGER — fires when risk level is high / critical
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trg_auto_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.risk_level IN ('high', 'critical') THEN
        INSERT INTO alert (student_id, risk_score_id, faculty_id, alert_type, message, severity)
        SELECT
            NEW.student_id,
            NEW.id,
            s.mentor_faculty_id,
            'high_risk_detected',
            'Student ' || s.full_name || ' has risk level ' || NEW.risk_level ||
            ' (score ' || NEW.overall_score || '). Intervention recommended.',
            CASE WHEN NEW.risk_level = 'critical' THEN 'critical'::alert_severity
                 ELSE 'warning'::alert_severity END
        FROM student s
        WHERE s.id = NEW.student_id
          AND s.mentor_faculty_id IS NOT NULL;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER after_risk_score_insert
AFTER INSERT ON risk_score
FOR EACH ROW EXECUTE FUNCTION trg_auto_alert();


-- ─────────────────────────────────────────────────────────────
--  7. COMMON INTEGRATION QUERIES
-- ─────────────────────────────────────────────────────────────

-- ── 7.1 Seed: register a new student ─────────────────────────
/*
INSERT INTO student (program_id, mentor_faculty_id, enrollment_no, full_name, email, current_semester, batch_year)
VALUES (
    '<program_uuid>',
    '<mentor_faculty_uuid>',
    '22CE001',
    'Arjun Mehta',
    'arjun.mehta@college.edu',
    5,
    2022
);
*/

-- ── 7.2 Subject teacher uploads marks ────────────────────────
/*
INSERT INTO marks (assessment_id, student_id, marks_obtained, entered_by_faculty_id)
VALUES ('<assessment_uuid>', '<student_uuid>', 18.5, '<faculty_uuid>');
*/

-- ── 7.3 Mark bulk attendance for a session ───────────────────
/*
INSERT INTO attendance_record (session_id, student_id, status)
SELECT '<session_uuid>', e.student_id, 'absent'
FROM   enrollment e
WHERE  e.course_id = '<course_uuid>'
  AND  e.status    = 'enrolled'
ON CONFLICT (session_id, student_id) DO UPDATE
    SET status = EXCLUDED.status;
*/

-- ── 7.4 Run risk engine for all active students this semester ─
/*
SELECT calculate_risk_score(s.id, ay.id)
FROM   student s
CROSS  JOIN academic_year ay
WHERE  s.status = 'active'
  AND  ay.is_active = TRUE;
*/

-- ── 7.5 Faculty: fetch at-risk students assigned to me ────────
SELECT
    student_name,
    enrollment_no,
    current_semester,
    overall_score,
    risk_level,
    attendance_score,
    marks_score,
    assignment_score,
    lms_score
FROM   v_mentor_dashboard
WHERE  faculty_id  = '<mentor_faculty_uuid>'
  AND  risk_level IN ('high', 'critical')
ORDER  BY overall_score DESC;


-- ── 7.6 Student: view own risk profile with reasons ───────────
SELECT
    r.overall_score,
    r.risk_level,
    r.calculated_at,
    rf.factor_type,
    rf.description,
    rf.severity,
    rf.contribution_weight
FROM   v_student_latest_risk r
JOIN   risk_factor rf ON rf.risk_score_id = r.risk_score_id
WHERE  r.student_id = '<student_uuid>'
ORDER  BY rf.contribution_weight DESC;


-- ── 7.7 Log an intervention (mentor records a counselling) ────
/*
WITH new_intervention AS (
    INSERT INTO intervention (student_id, faculty_id, intervention_type_id, risk_score_id, scheduled_date, status)
    VALUES ('<student_uuid>', '<faculty_uuid>', '<type_uuid>', '<risk_score_uuid>', CURRENT_DATE, 'scheduled')
    RETURNING id, student_id
)
INSERT INTO performance_snapshot (student_id, intervention_id, snapshot_type,
    attendance_pct, avg_marks_pct, assignment_completion_pct)
SELECT
    ni.student_id,
    ni.id,
    'before',
    COALESCE(atts.attendance_pct, 0),
    COALESCE(ms.avg_marks_pct, 0),
    COALESCE(asgn.completion_pct, 0)
FROM new_intervention ni
LEFT JOIN v_attendance_summary  atts ON atts.student_id = ni.student_id
LEFT JOIN v_marks_summary       ms   ON ms.student_id   = ni.student_id
LEFT JOIN v_assignment_summary  asgn ON asgn.student_id = ni.student_id
LIMIT 1;
*/

-- ── 7.8 Complete an intervention and take after snapshot ──────
/*
UPDATE intervention
SET status = 'completed', completed_date = CURRENT_DATE,
    outcome_notes = 'Student engaged positively. Committed to regular attendance.'
WHERE id = '<intervention_uuid>';

INSERT INTO performance_snapshot (student_id, intervention_id, snapshot_type,
    attendance_pct, avg_marks_pct, assignment_completion_pct)
SELECT
    '<student_uuid>',
    '<intervention_uuid>',
    'after',
    COALESCE(atts.attendance_pct, 0),
    COALESCE(ms.avg_marks_pct, 0),
    COALESCE(asgn.completion_pct, 0)
FROM v_attendance_summary  atts
JOIN v_marks_summary       ms   USING (student_id)
JOIN v_assignment_summary  asgn USING (student_id)
WHERE atts.student_id = '<student_uuid>'
LIMIT 1;
*/

-- ── 7.9 Mark alert as read ────────────────────────────────────
/*
UPDATE alert
SET is_read = TRUE, read_at = NOW()
WHERE faculty_id = '<faculty_uuid>'
  AND is_read   = FALSE;
*/

-- ── 7.10 Unread alerts for a mentor ──────────────────────────
SELECT
    a.id,
    s.full_name   AS student_name,
    a.alert_type,
    a.message,
    a.severity,
    a.sent_at
FROM   alert a
JOIN   student s ON s.id = a.student_id
WHERE  a.faculty_id = '<mentor_faculty_uuid>'
  AND  a.is_read    = FALSE
ORDER  BY a.severity DESC, a.sent_at DESC;


-- ─────────────────────────────────────────────────────────────
--  8. ANALYTICAL QUERIES — institution-level reporting
-- ─────────────────────────────────────────────────────────────

-- ── 8.1 Risk distribution across college this semester ────────
SELECT
    risk_level,
    COUNT(*)                                    AS student_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) AS pct
FROM   v_student_latest_risk r
JOIN   academic_year ay ON ay.id = r.academic_year_id AND ay.is_active = TRUE
GROUP  BY risk_level
ORDER  BY CASE risk_level
    WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END;


-- ── 8.2 Most effective intervention types (by avg improvement) ─
SELECT
    it.name                              AS intervention_type,
    COUNT(*)                             AS total_used,
    ROUND(AVG(v.delta_attendance), 2)    AS avg_attendance_gain,
    ROUND(AVG(v.delta_marks), 2)         AS avg_marks_gain,
    ROUND(AVG(v.delta_assignments), 2)   AS avg_assignment_gain
FROM   v_intervention_outcomes v
JOIN   intervention i  ON i.id = v.intervention_id
JOIN   intervention_type it ON it.id = i.intervention_type_id
WHERE  v.after_attendance IS NOT NULL
GROUP  BY it.name
ORDER  BY avg_attendance_gain DESC;


-- ── 8.3 Courses with worst attendance this semester ───────────
SELECT
    c.code,
    c.name                           AS course_name,
    f.full_name                      AS teacher,
    COUNT(DISTINCT v.student_id)     AS enrolled_students,
    ROUND(AVG(v.attendance_pct), 1)  AS avg_attendance_pct
FROM   v_attendance_summary v
JOIN   course c ON c.id = v.course_id
JOIN   faculty f ON f.id = c.subject_teacher_id
JOIN   academic_year ay ON ay.id = c.academic_year_id AND ay.is_active = TRUE
GROUP  BY c.id, c.code, c.name, f.full_name
ORDER  BY avg_attendance_pct ASC
LIMIT  10;


-- ── 8.4 Students with no LMS activity in last 14 days ─────────
SELECT
    s.enrollment_no,
    s.full_name,
    s.email,
    f.full_name          AS mentor_name,
    f.email              AS mentor_email,
    MAX(l.occurred_at)   AS last_lms_activity
FROM   student s
JOIN   faculty f ON f.id = s.mentor_faculty_id
LEFT   JOIN lms_activity_log l ON l.student_id = s.id
WHERE  s.status = 'active'
GROUP  BY s.id, s.full_name, s.enrollment_no, s.email, f.full_name, f.email
HAVING MAX(l.occurred_at) < NOW() - INTERVAL '14 days'
    OR MAX(l.occurred_at) IS NULL
ORDER  BY last_lms_activity ASC NULLS FIRST;


-- ── 8.5 Student trend: risk score over the semester ───────────
SELECT
    calculated_at::DATE  AS scored_on,
    overall_score,
    risk_level
FROM   risk_score
WHERE  student_id = '<student_uuid>'
ORDER  BY calculated_at ASC;
