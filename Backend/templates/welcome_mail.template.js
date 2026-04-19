module.exports = function welcomeTemplate(name, role) {
  const roleLabel = { principal: 'Principal', faculty: 'Faculty Mentor', subject_coordinator: 'Subject Coordinator', student: 'Student' }[role] || role;
  return `<!DOCTYPE html><html><head><style>
    body{font-family:Arial,sans-serif;background:#0f172a;margin:0;padding:20px}
    .box{max-width:520px;margin:auto;background:#1e293b;border-radius:12px;overflow:hidden;border:1px solid #334155}
    .header{background:linear-gradient(135deg,#3b82f6,#6366f1);padding:28px;text-align:center;color:#fff;font-size:22px;font-weight:700}
    .body{padding:28px;color:#cbd5e1;line-height:1.7}
    .role{display:inline-block;background:#3b82f6;color:#fff;padding:4px 14px;border-radius:20px;font-size:13px;font-weight:600}
    .footer{background:#0f172a;text-align:center;padding:16px;font-size:12px;color:#64748b}
  </style></head><body>
    <div class="box">
      <div class="header">🎓 Welcome to Academic Risk Platform</div>
      <div class="body">
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your account has been created as <span class="role">${roleLabel}</span>.</p>
        <p>You can now log in and access your dashboard to monitor and manage academic performance.</p>
      </div>
      <div class="footer">© ${new Date().getFullYear()} Power-Rangers. All rights reserved.</div>
    </div>
  </body></html>`;
};
