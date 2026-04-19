module.exports = function verifyOtpTemplate(otp, name) {
  return `<!DOCTYPE html><html><head><style>
    body{font-family:Arial,sans-serif;background:#0f172a;margin:0;padding:20px}
    .box{max-width:520px;margin:auto;background:#1e293b;border-radius:12px;overflow:hidden;border:1px solid #334155}
    .header{background:linear-gradient(135deg,#3b82f6,#6366f1);padding:28px;text-align:center;color:#fff;font-size:22px;font-weight:700}
    .body{padding:28px;color:#cbd5e1;line-height:1.7}
    .otp{font-size:36px;font-weight:800;color:#3b82f6;text-align:center;letter-spacing:8px;margin:24px 0;padding:16px;background:#0f172a;border-radius:8px}
    .footer{background:#0f172a;text-align:center;padding:16px;font-size:12px;color:#64748b}
  </style></head><body>
    <div class="box">
      <div class="header">🎓 Academic Risk Platform — Email Verification</div>
      <div class="body">
        <p>Hello <strong>${name}</strong>,</p>
        <p>Use the OTP below to verify your account. Valid for <strong>10 minutes</strong>.</p>
        <div class="otp">${otp}</div>
        <p>If you didn't request this, ignore this email.</p>
      </div>
      <div class="footer">© ${new Date().getFullYear()} Power-Rangers. All rights reserved.</div>
    </div>
  </body></html>`;
};
