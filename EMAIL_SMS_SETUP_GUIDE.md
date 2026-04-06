# Email & SMS Verification Setup Guide

## Current Status
✅ Backend code supports both email and SMS verification
✅ Frontend shows verification code in dev mode (when email not configured)
❌ Email service not configured (no emails being sent)
❌ SMS service not configured (no SMS being sent)

## Quick Fix: Show Code to Users (Development Mode)

**What I just did:**
- When email is not configured, the API returns the code in the response
- The login page now auto-fills the code and shows it to the user
- Users can complete registration without receiving an email

**This works NOW** - no additional setup needed for testing!

---

## Production Setup: Real Email Verification

### Option 1: Gmail (Free, Easiest)

**Step 1: Enable 2-Factor Authentication**
1. Go to https://myaccount.google.com/security
2. Enable "2-Step Verification"

**Step 2: Create App Password**
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Other (Custom name)"
3. Name it "Thrift Shop Backend"
4. Click "Generate"
5. Copy the 16-character password

**Step 3: Add to Render**
1. Go to Render Dashboard → Backend Service → Environment
2. Add these variables:
   ```
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-char-app-password
   EMAIL_FROM=Thrift Shop <your-email@gmail.com>
   ```
3. Save and redeploy

**Done!** Emails will now be sent.

---

### Option 2: SendGrid (Free tier: 100 emails/day)

**Step 1: Create Account**
1. Go to https://sendgrid.com/
2. Sign up for free account
3. Verify your email

**Step 2: Create API Key**
1. Go to Settings → API Keys
2. Click "Create API Key"
3. Give it "Full Access"
4. Copy the API key

**Step 3: Get SMTP Credentials**
1. Go to Settings → API Keys
2. Your SMTP username is: `apikey`
3. Your SMTP password is: the API key you just created

**Step 4: Add to Render**
```
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com
```

---

### Option 3: Mailgun (Free tier: 5,000 emails/month)

**Step 1: Create Account**
1. Go to https://www.mailgun.com/
2. Sign up for free account

**Step 2: Get SMTP Credentials**
1. Go to Sending → Domain Settings → SMTP credentials
2. Copy the credentials

**Step 3: Add to Render**
```
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=your-mailgun-smtp-username
EMAIL_PASSWORD=your-mailgun-smtp-password
EMAIL_FROM=noreply@yourdomain.com
```

---

## SMS Verification Setup (Optional)

### Using Twilio (Paid, but has free trial)

**Step 1: Create Twilio Account**
1. Go to https://www.twilio.com/try-twilio
2. Sign up for free trial ($15 credit)
3. Verify your phone number

**Step 2: Get Credentials**
1. Go to Console Dashboard
2. Copy:
   - Account SID
   - Auth Token
3. Get a phone number:
   - Go to Phone Numbers → Buy a Number
   - Choose a number with SMS capability

**Step 3: Add to Render Backend**
```
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

**Step 4: Update Frontend (Optional)**
Add SMS option to login page - let users choose email or SMS verification.

---

## Testing the Setup

### Test Email (after configuration)
```bash
curl -X POST mertrosebackend-7wop5nev.b4a.run/api/auth/send-verification-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","method":"email","type":"registration"}'
```

Expected response:
```json
{
  "message": "Verification code sent to your email"
}
```

### Test SMS (after Twilio setup)
```bash
curl -X POST mertrosebackend-7wop5nev.b4a.run/api/auth/send-verification-code \
  -H "Content-Type: application/json" \
  -d '{"phone":"+1234567890","method":"sms","type":"registration"}'
```

---

## Current Workaround (No Setup Needed)

**For Development/Testing:**
1. User tries to sign up
2. Backend generates code but can't send email
3. Backend returns code in API response
4. Frontend shows: "Development Mode: Your verification code is 123456"
5. Code is auto-filled
6. User clicks "Verify & Create Account"
7. Registration completes successfully

**This is working RIGHT NOW** - users can register without email!

---

## Recommended Approach

**For Testing (Now):**
- Use the current dev mode (no setup needed)
- Code is shown to users automatically

**For Production (Later):**
1. Set up Gmail SMTP (5 minutes, free)
2. Add environment variables to Render
3. Test with real email
4. Optionally add SMS later

---

## Cost Comparison

| Service | Free Tier | Cost After |
|---------|-----------|------------|
| Gmail | Unlimited (personal use) | Free |
| SendGrid | 100/day | $15/month for 40k |
| Mailgun | 5,000/month | $35/month for 50k |
| Twilio SMS | $15 trial credit | $0.0079 per SMS |

**Recommendation:** Start with Gmail (free, easy), upgrade to SendGrid/Mailgun if you need more volume.

---

## Troubleshooting

### "Email not being sent"
- Check Render logs for: "Email not configured"
- Verify EMAIL_USER and EMAIL_PASSWORD are set
- Check Gmail app password is correct (16 characters, no spaces)

### "Email sent but not received"
- Check spam folder
- Verify sender email is correct
- Try different recipient email
- Check Gmail "Less secure app access" is NOT needed (app passwords work without it)

### "SMS not working"
- Verify Twilio credentials
- Check phone number format: +1234567890 (include country code)
- Verify Twilio number has SMS capability
- Check Twilio trial restrictions (can only send to verified numbers)

---

## Next Steps

1. **For immediate testing:** Just use the site - codes will show automatically
2. **For production:** Set up Gmail SMTP (5 minutes)
3. **For SMS:** Set up Twilio (optional, later)

The system is designed to work without email for development, so you can test everything right now!
