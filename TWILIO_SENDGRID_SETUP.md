# 📧 Twilio SendGrid Setup Guide

## What is Twilio SendGrid?

Twilio SendGrid is an email service owned by Twilio. It's the BEST option for sending emails from Render because:
- ✅ FREE (100 emails/day)
- ✅ Works perfectly with Render
- ✅ No connection issues
- ✅ Professional and reliable

---

## Step 1: Create Twilio SendGrid Account

### 1.1 Go to SendGrid
- Visit: **https://signup.sendgrid.com/**
- Or: **https://www.twilio.com/sendgrid/email-api**

### 1.2 Sign Up
- **Email**: Your email address
- **Password**: Create a password
- Click **"Create Account"**

### 1.3 Verify Email
- Check your inbox
- Click the verification link
- Complete the quick survey:
  - Role: Developer
  - Purpose: Transactional emails
  - Volume: Less than 1,000/month

---

## Step 2: Get SendGrid API Key

### 2.1 Go to API Keys
- Direct link: **https://app.sendgrid.com/settings/api_keys**
- Or: Settings → API Keys

### 2.2 Create API Key
1. Click **"Create API Key"** (blue button)
2. **Name**: `Mery Rose Backend`
3. **Permissions**: Select **"Full Access"**
4. Click **"Create & View"**

### 2.3 Copy Your API Key
- Copy the key (starts with `SG.`)
- **Save it somewhere safe!**
- You won't see it again!

Example:
```
SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Step 3: Verify Your Sender Email

This is REQUIRED by SendGrid!

### 3.1 Go to Sender Authentication
- Visit: **https://app.sendgrid.com/settings/sender_auth**
- Or: Settings → Sender Authentication

### 3.2 Verify Single Sender
1. Click **"Verify a Single Sender"**
2. Click **"Create New Sender"**

### 3.3 Fill in Details
```
From Name: Mery Rose
From Email: your-email@gmail.com
Reply To: your-email@gmail.com
Company Address: 123 Main St
City: Tunis
State: Tunis
Zip: 1000
Country: Tunisia
Nickname: Mery Rose Store
```

4. Click **"Create"**

### 3.4 Verify Email
- Check your inbox
- Click **"Verify Single Sender"**
- Done!

---

## Step 4: Add to Render

### 4.1 Go to Render
- Visit: **https://dashboard.render.com**
- Find: `mery-rose-backend`
- Click **"Environment"** tab

### 4.2 Add These Variables

**Remove old Gmail variables if they exist!**

Add these NEW variables:

```
EMAIL_HOST = smtp.sendgrid.net
EMAIL_PORT = 587
EMAIL_USER = apikey
EMAIL_PASSWORD = SG.your-actual-api-key-here
EMAIL_FROM = Mery Rose <your-verified-email@gmail.com>
```

### Example:
```
EMAIL_HOST = smtp.sendgrid.net
EMAIL_PORT = 587
EMAIL_USER = apikey
EMAIL_PASSWORD = SG.abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
EMAIL_FROM = Mery Rose <meriam@gmail.com>
```

### 4.3 Save
- Click **"Save Changes"**
- Wait 2-3 minutes for redeploy

---

## Step 5: Test!

### 5.1 Wait for Deploy
- Check Render logs
- Wait for "Live" status

### 5.2 Test Forgot Password
1. Open `test-forgot-password-api.html`
2. Enter your email
3. Click "Send Reset Code"
4. **Check your email!** 📧

### 5.3 Success!
You should receive:
```
From: Mery Rose <your-email@gmail.com>
Subject: Password Reset Code

Your reset code: 123456
```

---

## 🎯 Final Configuration

Your Render environment should have:

```
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=SG.your-sendgrid-api-key
EMAIL_FROM=Mery Rose <your-verified-email@gmail.com>
```

---

## 🐛 Troubleshooting

### "Sender address rejected"
- **Fix**: Verify your sender email in SendGrid dashboard
- Go to: https://app.sendgrid.com/settings/sender_auth

### "Invalid API key"
- **Fix**: Make sure you copied the entire key
- Should start with `SG.`
- No spaces

### Still no emails?
1. Check spam folder
2. Verify sender email is verified
3. Check Render logs for errors
4. Make sure Render finished redeploying

---

## 📊 SendGrid Free Tier

- ✅ 100 emails per day
- ✅ Forever free
- ✅ No credit card required
- ✅ Perfect for password resets

---

## 🎉 You're Done!

Emails will now work perfectly! Users will receive:
- ✅ Password reset codes
- ✅ Registration verification codes
- ✅ Professional emails
- ✅ Fast delivery (5-10 seconds)

---

## 💡 Pro Tips

1. **Monitor usage** at https://app.sendgrid.com/
2. **Check activity** to see email delivery status
3. **Keep API key secret** (never commit to GitHub)
4. **Test regularly** to ensure it's working

---

## 🔗 Quick Links

- Dashboard: https://app.sendgrid.com/
- API Keys: https://app.sendgrid.com/settings/api_keys
- Sender Auth: https://app.sendgrid.com/settings/sender_auth
- Activity: https://app.sendgrid.com/email_activity
- Support: https://support.sendgrid.com/

---

## ✅ Checklist

- [ ] Created SendGrid account
- [ ] Verified email
- [ ] Created API key
- [ ] Verified sender email
- [ ] Added to Render environment
- [ ] Waited for redeploy
- [ ] Tested forgot password
- [ ] Received email successfully

---

Need help? Let me know! 🚀
