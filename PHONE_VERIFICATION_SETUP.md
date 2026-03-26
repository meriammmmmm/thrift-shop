# Phone/SMS Verification Setup Guide

## Overview

Your system now supports THREE verification methods:
1. ✅ **Email** (Already working)
2. 🆕 **SMS** (New - requires Twilio)
3. 🆕 **WhatsApp** (New - requires Twilio)

---

## Quick Setup for SMS/WhatsApp

### Step 1: Install Twilio Package

```bash
cd backend
npm install twilio
```

### Step 2: Get Twilio Credentials (FREE TRIAL)

1. Sign up at: https://www.twilio.com/try-twilio
2. Get $15 free credit (no credit card required for trial)
3. Go to Console: https://console.twilio.com/
4. Copy your credentials:
   - Account SID
   - Auth Token
5. Get a phone number:
   - Go to "Phone Numbers" → "Buy a number"
   - Select a number with SMS capability
   - For WhatsApp: Enable WhatsApp on your number

### Step 3: Add to .env File

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

# Optional: For WhatsApp
TWILIO_WHATSAPP_NUMBER=+1234567890
```

### Step 4: Uncomment Code in smsService.js

Open `backend/services/smsService.js` and uncomment:
- Line 4-9: Twilio client initialization
- Line 35-43: SMS sending code
- Line 73-80: WhatsApp sending code

---

## API Usage

### 1. Send Verification Code (Email)
```javascript
POST /api/auth/send-verification-code
{
  "email": "user@example.com",
  "method": "email",
  "type": "registration"
}
```

### 2. Send Verification Code (SMS)
```javascript
POST /api/auth/send-verification-code
{
  "phone": "+1234567890",
  "method": "sms",
  "type": "registration"
}
```

### 3. Send Verification Code (WhatsApp)
```javascript
POST /api/auth/send-verification-code
{
  "phone": "+1234567890",
  "method": "whatsapp",
  "type": "registration"
}
```

### 4. Verify Code (Email)
```javascript
POST /api/auth/verify-code
{
  "email": "user@example.com",
  "code": "123456",
  "method": "email"
}
```

### 5. Verify Code (Phone)
```javascript
POST /api/auth/verify-code
{
  "phone": "+1234567890",
  "code": "123456",
  "method": "sms"
}
```

---

## Phone Number Format

Always use international format:
- ✅ Correct: `+1234567890`
- ✅ Correct: `+447911123456`
- ❌ Wrong: `1234567890`
- ❌ Wrong: `(123) 456-7890`

---

## Development Mode

Without Twilio configured, the system runs in development mode:
- Codes are logged to console
- No actual SMS/WhatsApp sent
- Perfect for testing

Check your terminal for messages like:
```
[DEV MODE] SMS to +1234567890: Your code is 123456
```

---

## Cost Comparison

### Email (Nodemailer)
- ✅ FREE
- ✅ Unlimited sends
- ⚠️ May go to spam
- ⚠️ Slower delivery

### SMS (Twilio)
- 💰 $0.0075 per SMS (US)
- 💰 Varies by country
- ✅ Fast delivery
- ✅ High open rate
- 🎁 $15 free trial credit

### WhatsApp (Twilio)
- 💰 $0.005 per message
- ✅ Cheaper than SMS
- ✅ Very high open rate
- ✅ Rich formatting
- ⚠️ Requires business approval

---

## Twilio Free Trial Limitations

During trial:
- ✅ Can send to verified numbers only
- ✅ $15 free credit (~2000 SMS)
- ✅ All features available
- ⚠️ "Sent from Twilio trial account" prefix

After upgrade:
- ✅ Send to any number
- ✅ No prefix message
- ✅ Higher sending limits

---

## Alternative SMS Providers

If you don't want Twilio, you can use:

### 1. AWS SNS (Amazon)
- Pay as you go
- $0.00645 per SMS
- Requires AWS account

### 2. MessageBird
- Similar to Twilio
- Good international coverage

### 3. Vonage (Nexmo)
- €2 free credit
- Good for Europe

### 4. Africa's Talking (For Africa)
- Best rates for African countries
- Local payment methods

---

## Security Best Practices

1. **Rate Limiting**: Limit verification attempts
2. **Phone Validation**: Validate format before sending
3. **Code Expiration**: 10 minutes (already implemented)
4. **One-time Use**: Codes can't be reused (already implemented)
5. **Secure Storage**: Never log codes in production

---

## Testing Checklist

- [ ] Email verification works
- [ ] SMS verification works (if enabled)
- [ ] WhatsApp verification works (if enabled)
- [ ] Codes expire after 10 minutes
- [ ] Can't register with same email twice
- [ ] Can't register with same phone twice
- [ ] Invalid codes are rejected
- [ ] Expired codes are rejected

---

## Troubleshooting

### SMS Not Sending?
1. Check Twilio credentials in .env
2. Verify phone number format (+country code)
3. Check Twilio console for errors
4. Ensure phone number has SMS capability
5. For trial: Verify recipient number in Twilio console

### WhatsApp Not Working?
1. Enable WhatsApp on your Twilio number
2. Complete WhatsApp business profile
3. Wait for approval (can take 1-2 days)
4. Use correct WhatsApp number format

### Code Not Received?
1. Check spam folder (email)
2. Verify phone number is correct
3. Check Twilio logs for delivery status
4. Try different verification method

---

## Frontend Integration Example

```javascript
// Send verification code
async function sendVerificationCode(email, method = 'email') {
  const response = await fetch('/api/auth/send-verification-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      email, 
      method,
      type: 'registration' 
    })
  });
  return response.json();
}

// Verify code
async function verifyCode(email, code, method = 'email') {
  const response = await fetch('/api/auth/verify-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code, method })
  });
  return response.json();
}

// Usage
await sendVerificationCode('user@example.com', 'email');
await verifyCode('user@example.com', '123456', 'email');
```

---

## Next Steps

1. **For Email Only**: Just configure Gmail (see VERIFICATION_SETUP_GUIDE.md)
2. **For SMS**: Sign up for Twilio and follow steps above
3. **For Both**: Configure both services
4. **For Production**: Upgrade Twilio account to remove trial limitations

Need help? Let me know which verification method you want to use!
