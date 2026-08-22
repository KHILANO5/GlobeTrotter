const nodemailer = require('nodemailer');
require('dotenv').config();

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

// Create transporter using Gmail SMTP service
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
});

// Sends the email verification OTP
const sendVerificationCode = async (toEmail, code) => {
  const mailOptions = {
    from: `"Auth Module" <${EMAIL_USER}>`,
    to: toEmail,
    subject: 'Email Verification OTP Code',
    text: `Your account verification code is: ${code}. It is valid for 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 25px; max-width: 500px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff;">
        <h2 style="color: #7c3aed; margin-bottom: 5px;">Email Verification</h2>
        <p style="color: #4b5563; font-size: 15px;">Thank you for signing up! Please use the 6-digit OTP code below to verify and activate your account:</p>
        <div style="font-size: 28px; font-weight: bold; letter-spacing: 6px; padding: 15px; background-color: #f3f4f6; text-align: center; border-radius: 12px; width: fit-content; margin: 25px auto; color: #1f2937;">
          ${code}
        </div>
        <p style="color: #6b7280; font-size: 13px; margin-top: 20px;">If you did not request this, you can safely ignore this email.</p>
      </div>
    `
  };

  if (!EMAIL_USER || !EMAIL_PASS) {
    console.log('\n======================================================');
    console.log('[WARNING] EMAIL_USER or EMAIL_PASS not configured in .env');
    console.log(`[EMAIL SIMULATION] Verification OTP code for ${toEmail} is: ${code}`);
    console.log('======================================================\n');
    return;
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[SMTP] Verification email sent to ${toEmail}`);
  } catch (err) {
    console.error('[SMTP ERROR] Failed to send verification email:', err.message);
    console.log(`[FALLBACK] Verification code for ${toEmail} is: ${code}`);
  }
};

// Sends the password reset OTP
const sendResetPasswordCode = async (toEmail, code) => {
  const mailOptions = {
    from: `"Auth Module" <${EMAIL_USER}>`,
    to: toEmail,
    subject: 'Password Reset OTP Code',
    text: `Your password reset code is: ${code}. It is valid for 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 25px; max-width: 500px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff;">
        <h2 style="color: #7c3aed; margin-bottom: 5px;">Reset Password Request</h2>
        <p style="color: #4b5563; font-size: 15px;">We received a request to reset your password. Use the 6-digit OTP code below to complete the reset:</p>
        <div style="font-size: 28px; font-weight: bold; letter-spacing: 6px; padding: 15px; background-color: #f3f4f6; text-align: center; border-radius: 12px; width: fit-content; margin: 25px auto; color: #1f2937;">
          ${code}
        </div>
        <p style="color: #4b5563; font-size: 14px;">If you did not request a password reset, please secure your account immediately.</p>
      </div>
    `
  };

  if (!EMAIL_USER || !EMAIL_PASS) {
    console.log('\n======================================================');
    console.log('[WARNING] EMAIL_USER or EMAIL_PASS not configured in .env');
    console.log(`[EMAIL SIMULATION] Reset Password OTP code for ${toEmail} is: ${code}`);
    console.log('======================================================\n');
    return;
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[SMTP] Password reset email sent to ${toEmail}`);
  } catch (err) {
    console.error('[SMTP ERROR] Failed to send reset email:', err.message);
    console.log(`[FALLBACK] Reset Password code for ${toEmail} is: ${code}`);
  }
};

module.exports = {
  sendVerificationCode,
  sendResetPasswordCode
};
