const nodemailer = require('nodemailer');

// Create nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000
});

// Generate 6-digit verification code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send verification email
async function sendVerificationEmail(email, code, type = 'registration') {
  // Check if email is configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('⚠️ Email not configured. Verification code:', code);
    console.log('📧 To enable email, add EMAIL_USER and EMAIL_PASSWORD to environment variables');
    
    return { 
      success: true, 
      dev: true,
      code: code,
      message: 'Development mode: Email service not configured. Check console for verification code.' 
    };
  }

  const subject = type === 'password_reset' ? 'Password Reset Code - Mery Rose' : 'Email Verification - Mery Rose';
  const title = type === 'password_reset' ? 'Password Reset Request' : 'Email Verification';
  const message = type === 'password_reset' 
    ? 'You requested to reset your password. Use the code below:'
    : 'Your verification code is:';

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #D4A5A5; margin: 0;">Mery Rose</h1>
        </div>
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 10px;">
          <h2 style="color: #333; margin-top: 0;">${title}</h2>
          <p style="color: #666; font-size: 16px;">${message}</p>
          <div style="background-color: #fff; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; border: 2px solid #D4A5A5;">
            <h1 style="color: #D4A5A5; letter-spacing: 8px; margin: 0; font-size: 36px;">${code}</h1>
          </div>
          <p style="color: #666; font-size: 14px;">This code will expire in <strong>10 minutes</strong>.</p>
          ${type === 'password_reset' 
            ? '<p style="color: #999; font-size: 13px; margin-top: 20px;"><strong>If you didn\'t request a password reset, please ignore this email.</strong></p>'
            : '<p style="color: #999; font-size: 13px; margin-top: 20px;">If you didn\'t request this code, please ignore this email.</p>'
          }
        </div>
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Mery Rose. All rights reserved.</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully to:', email);
    return { success: true };
  } catch (error) {
    console.error('❌ Email sending error:', error.message);
    console.log('⚠️ Email failed to send. Verification code:', code);
    return { 
      success: true, 
      dev: true,
      code: code,
      error: error.message,
      message: 'Email service temporarily unavailable. Check console for verification code.' 
    };
  }
}

module.exports = {
  generateVerificationCode,
  sendVerificationEmail
};
