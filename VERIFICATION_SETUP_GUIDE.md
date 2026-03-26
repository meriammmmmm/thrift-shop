# Email & Phone Verification Setup Guide

## Current Status ✅

Your system already has **EMAIL VERIFICATION** fully implemented! Here's what you have:

### Email Verification Features:
- ✅ 6-digit verification codes
- ✅ 10-minute expiration
- ✅ Database table for verification codes
- ✅ Email sending with nodemailer
- ✅ Verification before registration
- ✅ One email per user (enforced)

---

## How to Enable Email Verification

### Step 1: Configure Email Settings

Edit `backend/.env` and add your email credentials:

```env
# Gmail Example (Recommended)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=Thrift Shop <your-email@gmail.com>
```

### Step 2: Get Gmail App Password

1. Go to your Google Account: https://myaccount.google.com/
2. Click "Security" → "2-Step Verification" (enable if not enabled)
3. Scroll down to "App passwords"
4. Generate a new app password for "Mail"
5. Copy the 16-character password
6. Use it as `EMAIL_PASSWORD` in your `.env` file

### Step 3: Test Email Verification

The system is ready! Users will:
1. Enter their email
2. Click "Send Verification Code"
3. Receive a 6-digit code via email
4. Enter the code to verify
5. Complete registration

---

## API Endpoints (Already Working)

### 1. Send Verification Code
```
POST /api/auth/send-verification-code
Body: { "email": "user@example.com" }
```

### 2. Verify Code
```
POST /api/auth/verify-code
Body: { "email": "user@example.com", "code": "123456" }
```

### 3. Register with Verification
```
POST /api/auth/register
Body: {
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "verificationCode": "123456"
}
```

---

## One Email Per User ✅

Your system already enforces unique emails:
- Database checks prevent duplicate emails
- Registration fails if email exists
- Verification codes are email-specific

---

## Phone Verification (Optional - New Feature)

I can add SMS verification using Twilio. Would you like to add this?

### What You'll Need:
1. Twilio account (free trial available)
2. Phone number from Twilio
3. API credentials

### Benefits:
- More secure verification
- Faster delivery than email
- Better for mobile users
- Can use as alternative to email

---

## Testing Without Real Email

For development, you can use these free services:

### Option 1: Mailtrap (Recommended)
```env
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your-mailtrap-username
EMAIL_PASSWORD=your-mailtrap-password
```
Sign up at: https://mailtrap.io

### Option 2: Ethereal Email
```javascript
// Automatically generates test credentials
// Check console for preview URL
```

---

## Security Features

Your verification system includes:
- ✅ Code expiration (10 minutes)
- ✅ One-time use codes
- ✅ Email uniqueness enforcement
- ✅ Secure password hashing
- ✅ JWT token authentication

---

## Troubleshooting

### Email Not Sending?
1. Check `.env` file has correct credentials
2. Enable "Less secure app access" for Gmail (or use app password)
3. Check console for error messages
4. Verify EMAIL_USER and EMAIL_PASSWORD are correct

### Code Not Working?
1. Check if code expired (10 minutes)
2. Verify email matches exactly
3. Code is case-sensitive
4. Check database for verification_codes table

### User Already Exists?
- Each email can only register once
- Use password reset if user forgot password
- Check database: `SELECT * FROM users WHERE email = 'user@example.com'`

---

## Next Steps

1. **Configure Email**: Add your Gmail credentials to `.env`
2. **Test Registration**: Try registering with email verification
3. **Optional**: Add phone verification (let me know!)
4. **Optional**: Add password reset with verification codes

Would you like me to:
1. Add phone/SMS verification?
2. Add password reset with verification?
3. Create a frontend component for verification?
4. Add email templates with your branding?
