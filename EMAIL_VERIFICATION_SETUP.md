# Email & Phone Verification Setup

## Overview
All new user signups now **require verification** via email or phone. The system will send a 6-digit code that users must enter to complete registration.

## Current Status
✅ Verification is **REQUIRED** for all new user signups
✅ Email verification is implemented (with dev mode fallback)
✅ Phone/SMS verification is ready (requires Twilio setup)
✅ Frontend UI is complete with verification flow

## Email Verification Setup

### For Gmail (Recommended for Testing)

1. **Enable 2-Factor Authentication** on your Gmail account
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password

3. **Add to `.env` file** in the `backend` folder:
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```

### For Other Email Providers

**Outlook/Hotmail:**
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

**Yahoo:**
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USER=your-email@yahoo.com
EMAIL_PASSWORD=your-app-password
```

**Custom SMTP:**
```env
EMAIL_HOST=smtp.yourdomain.com
EMAIL_PORT=587
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASSWORD=your-password
```

## Phone/SMS Verification Setup (Optional)

### Using Twilio

1. **Sign up for Twilio**
   - Go to: https://www.twilio.com/try-twilio
   - Get free trial credits ($15)

2. **Get Credentials**
   - Account SID
   - Auth Token
   - Phone Number

3. **Install Twilio SDK**
```bash
cd backend
npm install twilio
```

4. **Add to `.env` file**:
```env
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=+1234567890
```

5. **Uncomment Twilio code** in `backend/services/smsService.js`

## Development Mode

If email/SMS is **not configured**, the system will:
- ✅ Still allow registration (dev mode)
- 📝 Print verification codes to the console
- ⚠️ Show a warning message to users

**Check your backend console** for verification codes during development!

## How It Works

### User Signup Flow:

1. User fills out registration form
2. User clicks "Sign Up"
3. System sends verification code to email/phone
4. User enters 6-digit code
5. System verifies code
6. Account is created

### API Endpoints:

- `POST /auth/send-verification-code` - Send code
- `POST /auth/verify-code` - Verify code
- `POST /auth/register` - Register (requires verified code)

### Verification Methods:

- `email` - Email verification (default)
- `sms` - SMS text message
- `whatsapp` - WhatsApp message

## Testing

### Test Email Verification:
1. Start backend: `cd backend && npm start`
2. Start frontend: `cd thrift-shop && npm run dev`
3. Go to signup page
4. Fill form and submit
5. Check backend console for verification code
6. Enter code and complete signup

### Test with Real Email:
1. Configure Gmail app password (see above)
2. Add credentials to `.env`
3. Restart backend
4. Signup with real email
5. Check your inbox for code

## Security Features

- ✅ Codes expire after 10 minutes
- ✅ Codes are single-use
- ✅ Codes are 6 digits (1 million combinations)
- ✅ Email/phone must be unique
- ✅ Verification required before account creation

## Troubleshooting

### "Email service not configured"
- Add EMAIL_USER and EMAIL_PASSWORD to .env
- Restart backend server

### "Failed to send verification code"
- Check email credentials
- Check SMTP settings
- Check console for error details

### "Verification code expired"
- Codes expire after 10 minutes
- Click "Resend" to get a new code

### Code not received
- Check spam folder
- Check backend console (dev mode)
- Verify email address is correct

## Database

Verification codes are stored in the `verification_codes` table:
- `email` - Email or phone number
- `code` - 6-digit code
- `type` - 'registration' or 'password_reset'
- `expires_at` - Expiration timestamp
- `verified` - Whether code was verified

## Next Steps

1. Configure email service (Gmail recommended)
2. Test verification flow
3. (Optional) Set up Twilio for SMS
4. Deploy to production
5. Monitor verification success rates
