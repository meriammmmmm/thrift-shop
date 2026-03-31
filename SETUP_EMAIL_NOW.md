# 🚀 Set Up Email in 5 Minutes

## Step 1: Get Gmail App Password (2 minutes)

### 1.1 Enable 2-Factor Authentication
1. Open: https://myaccount.google.com/security
2. Scroll to "2-Step Verification"
3. Click "Get Started"
4. Follow the prompts (use your phone)

### 1.2 Create App Password
1. Open: https://myaccount.google.com/apppasswords
2. You'll see "App passwords" section
3. Click "Select app" → Choose "Mail"
4. Click "Select device" → Choose "Other (Custom name)"
5. Type: "Thrift Shop Backend"
6. Click "Generate"
7. **COPY THE 16-CHARACTER PASSWORD** (looks like: `abcd efgh ijkl mnop`)
8. Remove the spaces: `abcdefghijklmnop`

---

## Step 2: Add to Render (3 minutes)

### 2.1 Go to Render Dashboard
1. Open: https://dashboard.render.com
2. Click on your **backend service** (mery-rose-backend or similar)
3. Click "Environment" in the left sidebar

### 2.2 Add Environment Variables
Click "Add Environment Variable" and add these **5 variables**:

**Variable 1:**
- Key: `EMAIL_HOST`
- Value: `smtp.gmail.com`

**Variable 2:**
- Key: `EMAIL_PORT`
- Value: `587`

**Variable 3:**
- Key: `EMAIL_USER`
- Value: `your-email@gmail.com` (replace with YOUR Gmail)

**Variable 4:**
- Key: `EMAIL_PASSWORD`
- Value: `abcdefghijklmnop` (paste the 16-char password from Step 1.2, NO SPACES)

**Variable 5:**
- Key: `EMAIL_FROM`
- Value: `Thrift Shop <your-email@gmail.com>` (replace with YOUR Gmail)

### 2.3 Save and Deploy
1. Click "Save Changes" button at the bottom
2. Render will automatically redeploy (takes 5-10 minutes)

---

## Step 3: Test It (1 minute)

### Wait for deployment to finish
1. Watch the "Events" tab in Render
2. Wait for "Deploy succeeded" message

### Test on your website
1. Go to: https://mery-rose.onrender.com/login
2. Click "Sign up"
3. Fill in the form
4. Click "Continue to Verification"
5. **Check your email inbox** - you should receive the code!

---

## ⚠️ Important Notes

### Gmail Security
- You MUST have 2-Factor Authentication enabled
- Regular Gmail password will NOT work
- You MUST use the 16-character app password

### Common Mistakes
❌ Using regular Gmail password → Won't work
❌ Including spaces in app password → Won't work
❌ Not enabling 2FA first → Can't create app password
✅ Using 16-char app password without spaces → Works!

### If It Doesn't Work
1. Check Render logs for errors
2. Verify all 5 environment variables are set correctly
3. Make sure app password has no spaces
4. Try generating a new app password
5. Check spam folder for the email

---

## Alternative: Use a Test Email Service

If you don't want to use your personal Gmail, use **Mailtrap** (free for testing):

1. Go to: https://mailtrap.io/
2. Sign up for free
3. Go to "Email Testing" → "Inboxes"
4. Copy the SMTP credentials
5. Add to Render:
   ```
   EMAIL_HOST=sandbox.smtp.mailtrap.io
   EMAIL_PORT=2525
   EMAIL_USER=your-mailtrap-username
   EMAIL_PASSWORD=your-mailtrap-password
   EMAIL_FROM=noreply@thriftshop.com
   ```

**Note:** Mailtrap doesn't send real emails - it captures them for testing. Good for development!

---

## What Happens After Setup

### Before (Current):
- User signs up
- Message: "Development Mode: Your verification code is 123456"
- Code shown on screen

### After (With Email):
- User signs up
- Message: "Verification code sent to your email"
- User checks email
- User enters code
- Registration completes

---

## Need Help?

### Can't find App Passwords?
- Make sure 2FA is enabled first
- Try this direct link: https://myaccount.google.com/apppasswords
- If still not there, your account might not support it (use Mailtrap instead)

### Emails going to spam?
- This is normal for new senders
- Users should check spam folder
- After a few emails, Gmail will learn it's legitimate

### Want to use your own domain?
- You'll need to set up SPF, DKIM, and DMARC records
- Use SendGrid or Mailgun instead (they handle this)
- See EMAIL_SMS_SETUP_GUIDE.md for details

---

## Summary

1. ✅ Get Gmail app password (2 min)
2. ✅ Add 5 environment variables to Render (3 min)
3. ✅ Wait for deployment (5-10 min)
4. ✅ Test signup - check email!

**Total time: ~15 minutes**

That's it! Your users will now receive real verification emails.
