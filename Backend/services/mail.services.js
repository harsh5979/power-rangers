const { sendMail } = require('../configs/mail.config');

const roleLabel = r => ({ principal: 'Principal', faculty: 'Faculty Mentor', subject_coordinator: 'Subject Coordinator', student: 'Student', admin: 'Admin' }[r] || r);

const welcomeWithPasswordTemplate = (name, role, email, password) => `
<!DOCTYPE html><html><head><style>
  body{font-family:Arial,sans-serif;background:#f8fafc;margin:0;padding:20px}
  .box{max-width:520px;margin:auto;background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden}
  .header{background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:28px;text-align:center;color:#fff}
  .header h1{margin:0;font-size:20px;font-weight:700}
  .header p{margin:6px 0 0;font-size:13px;opacity:.85}
  .body{padding:28px;color:#374151;line-height:1.7}
  .creds{background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:16px;margin:20px 0}
  .creds p{margin:4px 0;font-size:14px}
  .creds strong{color:#5b21b6}
  .pw{font-family:monospace;font-size:18px;font-weight:700;color:#7c3aed;letter-spacing:2px}
  .note{font-size:12px;color:#9ca3af;margin-top:20px}
  .footer{background:#f8fafc;text-align:center;padding:14px;font-size:12px;color:#9ca3af;border-top:1px solid #e2e8f0}
</style></head><body>
  <div class="box">
    <div class="header">
      <h1>🎓 Academic Risk Platform</h1>
      <p>Your account has been created</p>
    </div>
    <div class="body">
      <p>Hello <strong>${name}</strong>,</p>
      <p>Your account has been set up as <strong>${roleLabel(role)}</strong>. Use the credentials below to log in.</p>
      <div class="creds">
        <p>📧 <strong>Email:</strong> ${email}</p>
        <p>🔑 <strong>Password:</strong> <span class="pw">${password}</span></p>
      </div>
      <p>Please change your password after your first login.</p>
      <p class="note">If you did not expect this email, contact your administrator.</p>
    </div>
    <div class="footer">© ${new Date().getFullYear()} Power-Rangers · Academic Risk Platform</div>
  </div>
</body></html>`;

exports.sendWelcomeWithPassword = async (email, name, role, password) => {
  await sendMail(email, `Your Academic Risk Platform Account — ${roleLabel(role)}`, welcomeWithPasswordTemplate(name, role, email, password));
};

exports.sendVerificationEmail = async (email, otp, name) => {
  const html = `<div style="font-family:Arial;padding:20px;max-width:480px;margin:auto;border:1px solid #e2e8f0;border-radius:8px">
    <h2 style="color:#7c3aed">Verify your email</h2>
    <p>Hello ${name}, your OTP is:</p>
    <div style="font-size:32px;font-weight:700;letter-spacing:8px;color:#7c3aed;text-align:center;padding:16px;background:#f5f3ff;border-radius:8px">${otp}</div>
    <p style="color:#9ca3af;font-size:12px">Valid for 10 minutes.</p>
  </div>`;
  await sendMail(email, 'Verify Your Email — Academic Risk Platform', html);
};

exports.sendForgotPasswordEmail = async (email, name, resetLink) => {
  const html = `<div style="font-family:Arial;padding:20px;max-width:480px;margin:auto;border:1px solid #e2e8f0;border-radius:8px">
    <h2 style="color:#7c3aed">Reset your password</h2>
    <p>Hello ${name},</p>
    <p><a href="${resetLink}" style="background:#7c3aed;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;display:inline-block">Reset Password</a></p>
    <p style="color:#9ca3af;font-size:12px">Link expires in 1 hour.</p>
  </div>`;
  await sendMail(email, 'Reset Your Password', html);
};

exports.sendResetSuccessEmail = async (email, name) => {
  await sendMail(email, 'Password Reset Successful', `<p>Hello ${name}, your password was reset successfully.</p>`);
};

exports.sendWelcomeEmail = async (email, name, role) => {
  // kept for backward compat — no-op now
};
