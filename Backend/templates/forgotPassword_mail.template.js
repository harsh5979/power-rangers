module.exports = function forgotPasswordTemplate(name, resetLink) {
  return `<!DOCTYPE html><html><head><style>
    body{font-family:Arial,sans-serif;background:#0f172a;margin:0;padding:20px}
    .box{max-width:520px;margin:auto;background:#1e293b;border-radius:12px;overflow:hidden;border:1px solid #334155}
    .header{background:linear-gradient(135deg,#ef4444,#f97316);padding:28px;text-align:center;color:#fff;font-size:22px;font-weight:700}
    .body{padding:28px;color:#cbd5e1;line-height:1.7}
    .btn{display:block;width:fit-content;margin:24px auto;background:#3b82f6;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;font-size:15px}
    .footer{background:#0f172a;text-align:center;padding:16px;font-size:12px;color:#64748b}
  </style></head><body>
    <div class="box">
      <div class="header">🔐 Reset Your Password</div>
      <div class="body">
        <p>Hello <strong>${name}</strong>,</p>
        <p>We received a request to reset your password. Click below — link expires in <strong>1 hour</strong>.</p>
        <a href="${resetLink}" class="btn">Reset Password</a>
        <p>If you didn't request this, ignore this email.</p>
      </div>
      <div class="footer">© ${new Date().getFullYear()} Power-Rangers. All rights reserved.</div>
    </div>
  </body></html>`;
};
