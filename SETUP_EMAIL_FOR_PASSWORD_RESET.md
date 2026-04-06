# 📧 Setup Email for Password Reset

## Why You're Not Getting Emails

Your backend `.env` file has placeholder email credentials:
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
```

You need to replace these with REAL Gmail credentials!

## 🚀 Quick Setup (5 minutes)

### Step 1: Use Gmail App Password

1. **Go to your Google Account:**
   - Visit: https://myaccount.google.com/apppasswords
   - Sign in with your Gmail account

2. **Enable 2-Factor Authentication (if not already enabled):**
   - Go to: https://myaccount.google.com/security
   - Enable "2-Step Verification"

3. **Create App Password:**
   - Go back to: https://myaccount.google.com/apppasswords
   - Select app: "Mail"
   - Select device: "Other (Custom name)"
   - Enter name: "Mery Rose Backend"
   - Click "Generate"
   - **Copy the 16-character password** (looks like: `abcd efgh ijkl mnop`)

### Step 2: Update Backend .env File

Open `backend/.env` and update these lines:

```env
# Replace with YOUR Gmail
EMAIL_USER=your-actual-email@gmail.com

# Replace with the App Password you just generated
EMAIL_PASSWORD=abcdefghijklmnop

# Update the FROM name
EMAIL_FROM=Mery Rose <your-actual-email@gmail.com>
```

### Step 3: Update on Render

Since your backend is on Render, you MUST update the environment variables there:

1. Go to: https://dashboard.render.com
2. Find your backend service: `mery-rose-backend`
3. Click **Environment** tab
4. Add/Update these variables:
   ```
   EMAIL_USER=your-actual-email@gmail.com
   EMAIL_PASSWORD=abcdefghijklmnop
   EMAIL_FROM=Mery Rose <your-actual-email@gmail.com>
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   ```
5. Click **Save Changes**
6. Wait for auto-redeploy

### Step 4: Test It!

After Render redeploys (takes 2-3 minutes):

1. Go to your test page: `test-forgot-password-api.html`
2. Enter your email
3. Click "Send Reset Code"
4. **Check your email inbox!** 📬

## 📧 What the Email Will Look Like

```
Subject: Password Reset Code

Password Reset Request

You requested to reset your password. Use the code below:

┌─────────────┐
│   123456    │
└─────────────┘

This code will expire in 10 minutes.

If you didn't request this, ignore this email.
```

## 🔧 Alternative: Use a Different Email Service

If you don't want to use Gmail, you can use:

### SendGrid (Free tier: 100 emails/day)
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
```

### Mailgun (Free tier: 5,000 emails/month)
```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=your-mailgun-username
EMAIL_PASSWORD=your-mailgun-password
```

### Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

## 🐛 Troubleshooting

### "Invalid credentials" error?
- Make sure you're using an App Password, not your regular Gmail password
- Check that 2FA is enabled on your Google account
- Remove any spaces from the app password

### Still not receiving emails?
- Check your spam folder
- Verify EMAIL_USER is correct
- Make sure you updated Render environment variables
- Wait for Render to finish redeploying

### Emails going to spam?
- This is normal for new sending addresses
- Mark the email as "Not Spam"
- Consider using a professional email service like SendGrid

## ✅ Quick Checklist

- [ ] Enable 2FA on Google Account
- [ ] Generate Gmail App Password
- [ ] Update `backend/.env` with real credentials
- [ ] Update Render environment variables
- [ ] Wait for Render to redeploy
- [ ] Test forgot password
- [ ] Check email inbox (and spam folder)

## 💡 Pro Tip

For production, consider using a professional email service like:
- **SendGrid** - Free tier, reliable
- **Mailgun** - Good for transactional emails
- **AWS SES** - Very cheap, scalable

But Gmail App Password works great for testing and small-scale production!

## 🎯 After Setup

Once configured, users will receive:
- ✅ Password reset codes via email
- ✅ Registration verification codes
- ✅ Professional-looking emails
- ✅ 10-minute expiration for security

Your forgot password feature will be fully functional! 🎉
