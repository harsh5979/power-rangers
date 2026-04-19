const User       = require('../models/User');
const Student    = require('../models/Student');
const Marks      = require('../models/Marks');
const Attendance = require('../models/Attendance');
const Subject    = require('../models/Subject');

// GET /api/faculty/my-info  — faculty/mentor's own profile with subjects, division, students
exports.getMyInfo = async (req, res) => {
  try {
    const faculty = await User.findById(req.user).select('name email subjects division branch department college role batch').lean();
    if (!faculty) return res.status(404).json({ error: 'Not found' });

    // A user is acting as mentor if their role is 'mentor' OR they have a batch assigned
    const isMentor = faculty.role === 'mentor' || !!faculty.batch;

    let studentCount;
    // Both mentor and faculty-mentors see their assigned batch students
    studentCount = await Student.countDocuments({ college: req.college, facultyMentor: req.user });

    // For mentor, also get all subjects in their students' department/semesters
    let allSubjects = faculty.subjects || [];
    if (isMentor) {
      const assignedSubjects = await Subject.find({
        college: req.college,
        faculty: req.user,
      }).select('name semester').lean();

      // Also get ALL subjects for the department across semesters students are in
      const students = await Student.find({ college: req.college, facultyMentor: req.user })
        .distinct('semester');
      const deptSubjects = await Subject.find({
        college: req.college,
      }).populate('faculty', 'name').lean();

      // Merge assigned + department subjects for display
      const subjectNames = new Set([
        ...allSubjects,
        ...assignedSubjects.map(s => s.name),
      ]);
      allSubjects = [...subjectNames];
    }

    res.json({ ...faculty, isMentor, studentCount, subjects: allSubjects });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// GET /api/faculty/subject-summary?subject=DBMS
// Mentor: returns ALL assigned batch students' marks+attendance for that subject
// Faculty: returns ONLY students who have the faculty as their subject teacher
exports.getSubjectSummary = async (req, res) => {
  try {
    const { subject } = req.query;
    if (!subject) return res.status(400).json({ error: 'subject required' });

    const currentUser = await User.findById(req.user).select('role batch subjects college').lean();

    // A user is acting as mentor if their role is 'mentor' OR they have a batch assigned
    const isMentor = currentUser.role === 'mentor' || !!currentUser.batch;

    let students;
    if (isMentor) {
      // Mentor: see ALL assigned batch students for ANY subject
      students = await Student.find({ college: req.college, facultyMentor: req.user }).lean();
    } else {
      // Faculty: see only students where faculty is assigned to that subject via Subject model
      // Find the Subject entry to verify this faculty is assigned
      const subjectEntry = await Subject.findOne({
        college: req.college,
        name: subject,
        faculty: req.user,
      });

      if (subjectEntry) {
        // Faculty is assigned to this subject — show students in that department+semester
        students = await Student.find({
          college: req.college,
          department: (await require('../models/Department').findById(subjectEntry.department).lean())?.name,
          semester: subjectEntry.semester,
        }).lean();
      } else {
        // Fallback: show students they mentor (legacy behavior)
        students = await Student.find({ college: req.college, facultyMentor: req.user }).lean();
      }
    }

    if (!students.length) return res.json([]);

    const ids = students.map(s => s._id);

    const [allMarks, allAtt] = await Promise.all([
      Marks.find({ student: { $in: ids }, subject }).lean(),
      Attendance.find({ student: { $in: ids }, subject }).lean(),
    ]);

    const result = students.map(s => {
      const sMarks = allMarks.filter(m => m.student.toString() === s._id.toString());
      const sAtt   = allAtt.filter(a => a.student.toString() === s._id.toString());

      const avgMarks = sMarks.length
        ? sMarks.reduce((sum, m) => sum + (m.marksObtained / m.totalMarks) * 100, 0) / sMarks.length
        : null;

      const present = sAtt.filter(a => a.status === 'present').length;
      const attPct  = sAtt.length ? (present / sAtt.length) * 100 : null;

      return {
        _id: s._id, name: s.name, rollNumber: s.rollNumber,
        division: s.division, semester: s.semester,
        riskLevel: s.riskLevel, riskScore: s.riskScore,
        avgMarks: avgMarks !== null ? Math.round(avgMarks * 10) / 10 : null,
        attendancePct: attPct !== null ? Math.round(attPct * 10) / 10 : null,
        marksCount: sMarks.length,
        marks: sMarks,
      };
    });

    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// PATCH /api/faculty/subjects  — update faculty's own subjects list
exports.updateSubjects = async (req, res) => {
  try {
    const { subjects } = req.body;
    if (!Array.isArray(subjects)) return res.status(400).json({ error: 'subjects array required' });
    const user = await User.findByIdAndUpdate(req.user, { subjects }, { new: true }).select('subjects').lean();
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// GET /api/faculty/high-risk-students
exports.getHighRiskStudents = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user).select('role subjects college').lean();
    
    let students = [];
    
    // If mentor, show assigned students
    if (currentUser.role === 'mentor') {
      students = await Student.find({
        college: req.college,
        facultyMentor: req.user,
        riskLevel: { $in: ['medium', 'high'] }
      })
      .select('name rollNumber email semester riskLevel riskScore department')
      .sort({ riskScore: -1 })
      .lean();
    } else {
      // Faculty/Subject Coordinator: show students from their subjects
      const Subject = require('../models/Subject');
      const assignedSubjects = await Subject.find({ 
        college: req.college, 
        faculty: req.user 
      }).populate('department', 'name').lean();
      
      if (assignedSubjects.length > 0) {
        const deptSemPairs = assignedSubjects.map(s => ({
          department: s.department?.name, 
          semester: s.semester,
        })).filter(p => p.department);
        
        if (deptSemPairs.length > 0) {
          students = await Student.find({
            college: req.college,
            riskLevel: { $in: ['medium', 'high'] },
            $or: deptSemPairs.map(p => ({ 
              department: p.department, 
              semester: p.semester 
            }))
          })
          .select('name rollNumber email semester riskLevel riskScore department')
          .sort({ riskScore: -1 })
          .lean();
        }
      }
    }

    res.json(students);
  } catch (err) {
    console.error('getHighRiskStudents error:', err);
    res.status(500).json({ error: err.message });
  }
};

// POST /api/faculty/send-message
exports.sendMessageToStudent = async (req, res) => {
  try {
    const { studentId, message } = req.body;
    if (!studentId || !message) return res.status(400).json({ error: 'studentId and message required' });

    const currentUser = await User.findById(req.user).select('role subjects college').lean();
    let student;
    
    // If mentor, check if student is assigned
    if (currentUser.role === 'mentor') {
      student = await Student.findOne({ 
        _id: studentId, 
        college: req.college, 
        facultyMentor: req.user 
      });
    } else {
      // Faculty: check if student is in their subject's department+semester
      const Subject = require('../models/Subject');
      const assignedSubjects = await Subject.find({ 
        college: req.college, 
        faculty: req.user 
      }).populate('department', 'name').lean();
      
      if (assignedSubjects.length > 0) {
        const deptSemPairs = assignedSubjects.map(s => ({
          department: s.department?.name, 
          semester: s.semester,
        })).filter(p => p.department);
        
        student = await Student.findOne({
          _id: studentId,
          college: req.college,
          $or: deptSemPairs.map(p => ({ 
            department: p.department, 
            semester: p.semester 
          }))
        });
      }
    }
    
    if (!student) return res.status(404).json({ error: 'Student not found or not assigned to you' });

    const Notification = require('../models/Notification');
    const faculty = await User.findById(req.user).select('name').lean();
    
    await Notification.create({
      recipient: student.userId,
      sender: req.user,
      type: 'faculty_message',
      title: `Message from ${faculty.name}`,
      message,
    });

    res.json({ message: 'Message sent successfully' });
  } catch (err) {
    console.error('sendMessageToStudent error:', err);
    res.status(500).json({ error: err.message });
  }
};
