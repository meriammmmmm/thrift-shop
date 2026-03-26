# Quick Start: Email & Phone Verification

## ✅ What You Already Have

Your system is ready with:
- Email verification (fully implemented)
- Phone/SMS verification (code ready, needs Twilio)
- WhatsApp verification (code ready, needs Twilio)
- One email per user (enforced)
- Secure code generation and validation

---

## 🚀 Quick Setup (5 Minutes)

### Option 1: Email Only (FREE)

1. **Edit backend/.env**
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=Thrift Shop <your-email@gmail.com>
```

2. **Get Gmail App Password**
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification
   - Generate App Password
   - Copy and paste as EMAIL_PASSWORD

3. **Test It**
```bash
cd backend
npm start
```

4. **Try Registration**
   - User enters email
   - Clicks "Send Code"
   - Receives 6-digit code via email
   - Enters code to verify
   - Completes registration

✅ Done! Email verification is working.

---

### Option 2: Add SMS (Requires Twilio)

1. **Install Twilio**
```bash
cd backend
npm install twilio
```

2. **Sign Up for Twilio**
   - Go to: https://www.twilio.com/try-twilio
   - Get $15 free credit
   - Copy Account SID and Auth Token
   - Get a phone number

3. **Add to backend/.env**
```bash
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

4. **Uncomment Code**
   - Open `backend/services/smsService.js`
   - Uncomment lines 4-9 (Twilio client)
   - Uncomment lines 35-43 (SMS sending)

5. **Test SMS**
```bash
# Send SMS verification
POST /api/auth/send-verification-code
{
  "phone": "+1234567890",
  "method": "sms"
}
```

✅ Done! SMS verification is working.

---

## 📱 How It Works

### Email Verification Flow
```
1. User enters email
   ↓
2. System checks if email exists
   ↓
3. Generates 6-digit code
   ↓
4. Saves to database (expires in 10 min)
   ↓
5. Sends email with code
   ↓
6. User enters code
   ↓
7. System validates code
   ↓
8. Marks as verified
   ↓
9. User can register
```

### Phone Verification Flow
```
Same as email, but:
- Uses phone number instead
- Sends SMS via Twilio
- Validates phone format
```

---

## 🔒 Security Features

✅ **One Email Per User**
- Database enforces unique emails
- Registration fails if email exists
- Prevents duplicate accounts

✅ **Code Expiration**
- Codes expire after 10 minutes
- Old codes can't be reused
- Automatic cleanup

✅ **One-Time Use**
- Each code can only be used once
- Marked as verified after use
- Can't verify twice with same code

✅ **Rate Limiting**
- Prevents spam
- Limits verification attempts
- Protects against abuse

---

## 🧪 Testing

### Test Email Verification
```bash
# 1. Send code
curl -X POST http://localhost:5001/api/auth/send-verification-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","method":"email"}'

# 2. Check your email for code

# 3. Verify code
curl -X POST http://localhost:5001/api/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","code":"123456","method":"email"}'

# 4. Register
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","verificationCode":"123456"}'
```

### Test SMS Verification
```bash
# 1. Send SMS code
curl -X POST http://localhost:5001/api/auth/send-verification-code \
  -H "Content-Type: application/json" \
  -d '{"phone":"+1234567890","method":"sms"}'

# 2. Check your phone for code

# 3. Verify code
curl -X POST http://localhost:5001/api/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{"phone":"+1234567890","code":"123456","method":"sms"}'
```

---

## 🎨 Frontend Integration

Copy the example component:
```bash
# See VERIFICATION_FRONTEND_EXAMPLE.tsx
# Copy to your frontend project
# Customize styling as needed
```

Or use the API directly:
```javascript
// Send code
const response = await fetch('/api/auth/send-verification-code', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    email: 'user@example.com',
    method: 'email'
  })
});

// Verify code
const response = await fetch('/api/auth/verify-code', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    email: 'user@example.com',
    code: '123456',
    method: 'email'
  })
});
```

---

## 📚 Documentation Files

- `VERIFICATION_SETUP_GUIDE.md` - Detailed email setup
- `PHONE_VERIFICATION_SETUP.md` - SMS/WhatsApp setup
- `VERIFICATION_FRONTEND_EXAMPLE.tsx` - React component
- `backend/.env.example` - All environment variables

---

## ❓ Common Questions

**Q: Do I need both email and SMS?**
A: No! Email is free and works great. SMS is optional.

**Q: How much does SMS cost?**
A: Twilio: $0.0075 per SMS. $15 free trial = ~2000 SMS.

**Q: Can users register without verification?**
A: Currently optional. Make it required by checking verificationCode in register endpoint.

**Q: How do I make verification mandatory?**
A: In `backend/routes/auth.js`, change line 97 from `if (verificationCode)` to `if (!verificationCode) { return error }`

**Q: Can I use a different email provider?**
A: Yes! Update EMAIL_HOST, EMAIL_PORT in .env. Works with any SMTP server.

**Q: What if email goes to spam?**
A: Use a verified domain, add SPF/DKIM records, or use a service like SendGrid.

---

## 🆘 Need Help?

1. Check the detailed guides:
   - Email: `VERIFICATION_SETUP_GUIDE.md`
   - SMS: `PHONE_VERIFICATION_SETUP.md`

2. Check console logs for errors

3. Test with curl commands above

4. Verify .env file is configured

5. Ask me for help!

---

## ✨ Next Steps

- [ ] Configure email in .env
- [ ] Test email verification
- [ ] (Optional) Add SMS with Twilio
- [ ] Integrate frontend component
- [ ] Make verification mandatory
- [ ] Add password reset with verification
- [ ] Add email templates with branding

You're all set! 🎉
