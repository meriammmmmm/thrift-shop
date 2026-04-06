const nodemailer = require('nodemailer');

// Create transporter with timeout
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  connectionTimeout: 5000, // 5 seconds timeout
  greetingTimeout: 5000,
  socketTimeout: 5000
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
    console.log('📧 To enable email verification, add these to your .env file:');
    console.log('   EMAIL_USER=your-email@gmail.com');
    console.log('   EMAIL_PASSWORD=your-app-password');
    
    return { 
      success: true, 
      dev: true,
      code: code, // Return code in dev mode
      message: 'Development mode: Email service not configured. Check console for verification code.' 
    };
  }

  // Different email templates based on type
  let subject, html;
  
  if (type === 'password_reset') {
    subject = 'Password Reset Code';
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>You requested to reset your password. Use the code below to reset it:</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
          ${code}
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p><strong>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</strong></p>
      </div>
    `;
  } else {
    subject = 'Email Verification Code';
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Email Verification</h2>
        <p>Your verification code is:</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
          ${code}
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
      </div>
    `;
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: subject,
    html: html
  };

  try {
    // Add timeout to the send operation
    const sendPromise = transporter.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Email timeout')), 10000) // 10 second timeout
    );
    
    await Promise.race([sendPromise, timeoutPromise]);
    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error.message);
    // In development/production without email, still allow registration by showing code in console
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
