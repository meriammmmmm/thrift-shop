# 📧 Email Setup with Brevo (FREE & Works on Render!)

## Why Brevo?
- ✅ FREE 300 emails/day
- ✅ Works perfectly with Render (no blocking)
- ✅ Easy 5-minute setup
- ✅ No credit card required

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Brevo Account
1. Go to: https://www.brevo.com/
2. Click "Sign up free"
3. Enter your email and create password
4. Verify your email

### Step 2: Get SMTP Key
1. Login to Brevo
2. Go to: **Settings** (top right) → **SMTP & API**
3. Click **SMTP** tab
4. Click **Create a new SMTP key**
5. Name it: `Mery Rose`
6. **COPY THE KEY** (looks like: `xsmtpsib-xxxxx`)

### Step 3: Add to Render
1. Go to: https://dashboard.render.com
2. Find: `mery-rose-backend`
3. Click **Environment** tab
4. Add these 4 variables:

```
EMAIL_HOST = smtp-relay.brevo.com
EMAIL_PORT = 587
EMAIL_USER = your-email@gmail.com
EMAIL_PASSWORD = xsmtpsib-your-brevo-smtp-key-here
EMAIL_FROM = Mery Rose <your-email@gmail.com>
```

5. Click **Save Changes**
6. Wait 2-3 minutes for redeploy

### Step 4: Test!
1. Wait for Render to show "Live"
2. Go to your forgot password page
3. Enter your email
4. Check your inbox! 📧

---

## 📋 Configuration Summary

Add these to Render environment variables:

```
EMAIL_HOST = smtp-relay.brevo.com
EMAIL_PORT = 587
EMAIL_USER = your-email@gmail.com
EMAIL_PASSWORD = xsmtpsib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM = Mery Rose <your-email@gmail.com>
```

---

## ✨ What You Get

- Password reset emails
- Beautiful branded templates
- 10-minute code expiration
- Automatic fallback to logs if email fails

---

## 🐛 Troubleshooting

### Not receiving emails?
1. Check spam folder
2. Verify SMTP key is correct in Render
3. Make sure EMAIL_USER matches your Brevo account email
4. Check Render logs for errors

### "Authentication failed"
- Make sure you copied the SMTP key (not API key)
- SMTP key starts with `xsmtpsib-`

### Still having issues?
- The system will show codes in Render logs as fallback
- Go to Render → Logs → search for "Verification code:"

---

## 🎉 Done!

Your forgot password feature will work perfectly with Brevo!

No more Gmail blocking issues! 🚀
