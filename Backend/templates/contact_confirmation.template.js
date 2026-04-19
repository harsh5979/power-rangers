module.exports = function contactConfirmationTemplate(name, subject, message) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Contact Confirmation - NorthSoul Clothing</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #000; color: #fff; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .footer { background: #333; color: #fff; padding: 15px; text-align: center; font-size: 12px; }
            .message-box { background: #fff; padding: 15px; border-left: 4px solid #000; margin: 15px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>👕 NorthSoul Clothing</h1>
                <p>Contact Confirmation</p>
            </div>
            
            <div class="content">
                <h2>Hello ${name},</h2>
                
                <p>Thank you for contacting NorthSoul Clothing! We have successfully received your message and our support team will respond within 24 hours.</p>
                
                <div class="message-box">
                    <h3>Your Message Details:</h3>
                    <p><strong>Subject:</strong> ${subject}</p>
                    <p><strong>Message:</strong></p>
                    <p>${message.replace(/\n/g, '<br>')}</p>
                </div>
                
                <p>If you have any urgent concerns, please don't hesitate to contact us directly at:</p>
                <ul>
                    <li>📧 Email: support@northsoulclothing.com</li>
                    <li>📞 Phone: +1 (555) 123-4567</li>
                </ul>
                
                <p>Best regards,<br>
                <strong>NorthSoul Clothing Support Team</strong></p>
            </div>
            
            <div class="footer">
                <p>&copy; 2024 NorthSoul Clothing. All rights reserved.</p>
                <p>This is an automated message. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};
