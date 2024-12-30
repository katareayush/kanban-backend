const nodemailer = require("nodemailer");

const sendVerificationEmail = async (userEmail, verificationToken) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD, 
    },
    tls: {
      rejectUnauthorized: true
    }
  });

  const verificationLink = `${process.env.APP_URL}/verify-email?token=${verificationToken}`;

  const mailOptions = {
    from: {
      name: process.env.EMAIL_SENDER_NAME,
      address: process.env.EMAIL_USER
    },
    to: userEmail,
    subject: 'Please verify your email address',
    text: `Please verify your email address by clicking the following link: ${verificationLink}\n\nThis link will expire in 24 hours.\n\nIf you didn't request this verification, please ignore this email.`,
    html: `
      <h2>Email Verification</h2>
      <p>Please verify your email address by clicking the following link:</p>
      <a href="${verificationLink}">Verify Email</a>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't request this verification, please ignore this email.</p>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Verification email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw new Error("Failed to send verification email");
  }
};



module.exports = sendVerificationEmail;