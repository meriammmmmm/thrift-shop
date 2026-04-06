# 📧 Gmail App Password - Complete Step-by-Step Guide

## 🎯 What You Need
- A Gmail account
- 5 minutes of your time

---

## Step 1: Enable 2-Factor Authentication (2FA)

### 1.1 Go to Google Security Settings
1. Open your browser
2. Go to: **https://myaccount.google.com/security**
3. Sign in with your Gmail account if needed

### 1.2 Find "2-Step Verification"
- Scroll down to find **"2-Step Verification"** section
- If it says **"Off"**, click on it to enable
- If it says **"On"**, you're good! Skip to Step 2

### 1.3 Enable 2FA
1. Click **"Get Started"**
2. Enter your phone number
3. Choose how to receive codes (Text message or Phone call)
4. Enter the verification code you receive
5. Click **"Turn On"**

✅ **2FA is now enabled!**

---

## Step 2: Create App Password

### 2.1 Go to App Passwords Page
1. Open: **https://myaccount.google.com/apppasswords**
2. You might need to sign in again

### 2.2 If You See "App passwords" Page
Great! Continue to 2.3

### 2.3 If You See "This setting is not available"
This means:
- 2FA is not enabled (go back to Step 1)
- OR your account doesn't support app passwords (use a different Gmail account)

### 2.4 Create New App Password
1. You'll see a dropdown that says **"Select app"**
2. Click the dropdown
3. Select **"Mail"**

4. Another dropdown appears: **"Select device"**
5. Click it
6. Select **"Other (Custom name)"**

7. A text box appears
8. Type: **"Mery Rose Backend"** (or any name you want)

9. Click **"Generate"**

### 2.5 Copy Your App Password
- A popup appears with a **16-character password**
- It looks like: `abcd efgh ijkl mnop` (4 groups of 4 letters)
- **COPY THIS PASSWORD!** You won't see it again!

Example:
```
Your app password for your device

abcd efgh ijkl mnop

Copy this password and paste it into the app
```

10. Click **"Done"**

✅ **You now have your App Password!**

---

## Step 3: Update Your Backend

### Option A: Update Render (For Production)

1. **Go to Render Dashboard:**
   - Visit: https://dashboard.render.com
   - Sign in

2. **Find Your Backend Service:**
   - Look for: `mery-rose-backend`
   - Click on it

3. **Go to Environment Tab:**
   - Click **"Environment"** in the left sidebar

4. **Add/Update Variables:**
   Click **"Add Environment Variable"** for each:

   **Variable 1:**
   ```
   Key: EMAIL_USER
   Value: your-actual-email@gmail.com
   ```

   **Variable 2:**
   ```
   Key: EMAIL_PASSWORD
   Value: abcdefghijklmnop
   ```
   (Paste the 16-character password WITHOUT spaces)

   **Variable 3:**
   ```
   Key: EMAIL_FROM
   Value: Mery Rose <your-actual-email@gmail.com>
   ```

   **Variable 4:**
   ```
   Key: EMAIL_HOST
   Value: smtp.gmail.com
   ```

   **Variable 5:**
   ```
   Key: EMAIL_PORT
   Value: 587
   ```

5. **Save Changes:**
   - Click **"Save Changes"** button
   - Render will automatically redeploy (takes 2-3 minutes)

6. **Wait for Deploy:**
   - Watch the logs
   - Wait for "Live" status

✅ **Backend is now configured!**

### Option B: Update Local Backend (For Testing)

1. **Open your project folder**

2. **Edit `backend/.env` file:**
   ```env
   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-actual-email@gmail.com
   EMAIL_PASSWORD=abcdefghijklmnop
   EMAIL_FROM=Mery Rose <your-actual-email@gmail.com>
   ```

3. **Restart your backend:**
   ```bash
   cd backend
   npm start
   ```

✅ **Local backend is configured!**

---

## Step 4: Test It!

### 4.1 Open Test Page
- Open `test-forgot-password-api.html` in your browser

### 4.2 Send Reset Code
1. Enter your email address
2. Click **"Send Reset Code"**
3. Wait a few seconds

### 4.3 Check Your Email
1. Open Gmail
2. Look for email from yourself
3. Subject: **"Password Reset Code"**
4. You should see a 6-digit code!

### 4.4 Complete Reset
1. Copy the code from email
2. Paste it in Step 2 of the test page
3. Click "Verify Code"
4. Enter new password
5. Click "Reset Password"

✅ **It works!**

---

## 🐛 Troubleshooting

### "App passwords" option not showing?
**Solution:**
1. Make sure 2FA is enabled
2. Wait 5 minutes after enabling 2FA
3. Try this direct link: https://security.google.com/settings/security/apppasswords
4. If still not working, your account might not support it (try a different Gmail)

### "Invalid credentials" error?
**Solution:**
1. Remove ALL spaces from the app password
2. Make sure you copied the entire 16-character password
3. Don't use your regular Gmail password - use the app password!

### Not receiving emails?
**Solution:**
1. Check spam folder
2. Verify EMAIL_USER is correct
3. Make sure Render finished redeploying
4. Check Render logs for errors

### Emails going to spam?
**Solution:**
- This is normal for new sending addresses
- Mark as "Not Spam" in Gmail
- After a few emails, Gmail will learn it's legitimate

---

## 📝 Quick Reference

After setup, your configuration should be:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
EMAIL_FROM=Mery Rose <your-email@gmail.com>
```

---

## 🎉 Success!

You should now be able to:
- ✅ Receive password reset codes via email
- ✅ Receive registration verification codes
- ✅ Send professional emails to users

---

## 💡 Alternative: Skip Email Setup

If you don't want to set up email right now, the system still works!

When email is not configured:
- The verification code is shown in the API response
- The test page displays it in a yellow box
- You can still test and use forgot password

This is perfect for development and testing!

---

## 🔒 Security Notes

- **Never share your app password**
- **Don't commit it to GitHub** (it's in .env which is gitignored)
- **Only add it to Render environment variables**
- **You can revoke it anytime** at https://myaccount.google.com/apppasswords

---

## Need Help?

If you're stuck:
1. Check the troubleshooting section above
2. Make sure 2FA is enabled
3. Try a different Gmail account
4. Or just use dev mode (no email needed)!
