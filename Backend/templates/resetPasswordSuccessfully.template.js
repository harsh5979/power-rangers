module.exports = function resetSuccessTemplate(name) {
  return `<!DOCTYPE html><html><head><style>
    body{font-family:Arial,sans-serif;background:#0f172a;margin:0;padding:20px}
    .box{max-width:520px;margin:auto;background:#1e293b;border-radius:12px;overflow:hidden;border:1px solid #334155}
    .header{background:linear-gradient(135deg,#22c55e,#16a34a);padding:28px;text-align:center;color:#fff;font-size:22px;font-weight:700}
    .body{padding:28px;color:#cbd5e1;line-height:1.7}
    .footer{background:#0f172a;text-align:center;padding:16px;font-size:12px;color:#64748b}
  </style></head><body>
    <div class="box">
      <div class="header">✅ Password Reset Successful</div>
      <div class="body">
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your password has been reset successfully. You can now log in with your new password.</p>
        <p>If you didn't do this, contact support immediately.</p>
      </div>
      <div class="footer">© ${new Date().getFullYear()} Power-Rangers. All rights reserved.</div>
    </div>
  </body></html>`;
};
