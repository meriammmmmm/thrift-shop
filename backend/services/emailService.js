const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');

// Initialize SendGrid if API key is available
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Create nodemailer transporter as fallback
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  connectionTimeout: 5000,
  greetingTimeout: 5000,
  socketTimeout: 5000
});

// Generate 6-digit verification code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send verification email
async function sendVerificationEmail(email, code, type = 'registration') {
  // Try SendGrid first if API key is available
  if (process.env.SENDGRID_API_KEY) {
    try {
      const subject = type === 'password_reset' ? 'Password Reset Code - Mery Rose' : 'Email Verification - Mery Rose';
      const title = type === 'password_reset' ? 'Password Reset Request' : 'Email Verification';
      const message = type === 'password_reset' 
        ? 'You requested to reset your password. Use the code below:'
        : 'Your verification code is:';
      
      const msg = {
        to: email,
        from: process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_FROM || 'noreply@meryrose.me',
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
                ? '<p style="color: #999; font-size: 13px; margin-top: 20px;"><strong>If you didn\'t request a password reset, please ignore this email and your password will remain unchanged.</strong></p>'
                : '<p style="color: #999; font-size: 13px; margin-top: 20px;">If you didn\'t request this code, please ignore this email.</p>'
              }
            </div>
            <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Mery Rose. All rights reserved.</p>
            </div>
          </div>
        `
      };

      await sgMail.send(msg);
      console.log('✅ Email sent successfully via SendGrid');
      return { success: true };
    } catch (error) {
      console.error('SendGrid error:', error.message);
      // Fall through to nodemailer or dev mode
    }
  }

  // Fallback to nodemailer or dev mode
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('⚠️ Email not configured. Verification code:', code);
    console.log('📧 To enable email, add SENDGRID_API_KEY or EMAIL_USER/EMAIL_PASSWORD to your .env file');
    
    return { 
      success: true, 
      dev: true,
      code: code,
      message: 'Development mode: Email service not configured. Check console for verification code.' 
    };
  }

  // Try nodemailer as final fallback
  const subject = type === 'password_reset' ? 'Password Reset Code' : 'Email Verification Code';
  const title = type === 'password_reset' ? 'Password Reset Request' : 'Email Verification';
  const message = type === 'password_reset' 
    ? 'You requested to reset your password. Use the code below:'
    : 'Your verification code is:';

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">${title}</h2>
        <p>${message}</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
          ${code}
        </div>
        <p>This code will expire in 10 minutes.</p>
        ${type === 'password_reset' 
          ? '<p><strong>If you didn\'t request a password reset, please ignore this email and your password will remain unchanged.</strong></p>'
          : '<p>If you didn\'t request this code, please ignore this email.</p>'
        }
      </div>
    `
  };

  try {
    const sendPromise = transporter.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Email timeout')), 10000)
    );
    
    await Promise.race([sendPromise, timeoutPromise]);
    console.log('✅ Email sent successfully via SMTP');
    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error.message);
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
