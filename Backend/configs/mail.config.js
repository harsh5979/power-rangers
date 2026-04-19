const nodemailer = require('nodemailer');

 const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: process.env.senderEmail,
        pass: process.env.senderPassword,
    },
});

const sendMail = async (to, subject, template) => {
  const mailOptions = {
    from: process.env.senderEmail,
    to,
    subject,
    html: template,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    // console.log(`Email sent to ${to}:`, info.response);
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
  }
};


module.exports = {transporter, sendMail};