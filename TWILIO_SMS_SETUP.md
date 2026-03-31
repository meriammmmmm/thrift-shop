# 📱 Twilio SMS Setup Guide - Step by Step

## What You'll Get
- `TWILIO_ACCOUNT_SID` - Your account identifier
- `TWILIO_AUTH_TOKEN` - Your authentication token
- `TWILIO_PHONE_NUMBER` - A phone number to send SMS from

## Cost
- **Free Trial**: $15 credit (enough for ~1,900 SMS messages)
- **After Trial**: $0.0079 per SMS (~$8 for 1,000 messages)
- **Phone Number**: $1/month

---

## Step 1: Create Twilio Account (3 minutes)

### 1.1 Sign Up
1. Go to: https://www.twilio.com/try-twilio
2. Click "Sign up for free" or "Start for free"
3. Fill in the form:
   - First Name
   - Last Name
   - Email
   - Password
4. Click "Start your free trial"

### 1.2 Verify Your Email
1. Check your email inbox
2. Click the verification link from Twilio
3. You'll be redirected back to Twilio

### 1.3 Verify Your Phone Number
1. Twilio will ask you to verify your phone number
2. Enter your phone number (with country code)
3. Choose "Text me" or "Call me"
4. Enter the verification code you receive
5. Click "Submit"

**Important:** During the free trial, you can only send SMS to verified phone numbers!

---

## Step 2: Get Your Credentials (2 minutes)

### 2.1 Find Account SID and Auth Token
After signing up, you'll see the Twilio Console Dashboard.

**Look for a box that says "Account Info"** - it contains:

1. **Account SID**
   - Looks like: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - Click the "Copy" icon next to it
   - Save it somewhere (you'll need it later)

2. **Auth Token**
   - Click "Show" to reveal it
   - Looks like: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - Click the "Copy" icon
   - Save it somewhere

**Screenshot location:** Top right of the dashboard, in the "Account Info" panel

---

## Step 3: Get a Phone Number (3 minutes)

### 3.1 Buy a Phone Number
1. In the left sidebar, click "Phone Numbers" (or "# Phone Numbers")
2. Click "Buy a number" or "Get a number"
3. You'll see "Buy a Number" page

### 3.2 Choose Number Capabilities
1. Check the box for "SMS" (required)
2. Optionally check "Voice" and "MMS"
3. Choose your country (default is US)
4. Click "Search"

### 3.3 Select a Number
1. You'll see a list of available phone numbers
2. Each number shows its capabilities (SMS, Voice, MMS)
3. Click "Buy" next to any number you like
4. Confirm the purchase (uses your free trial credit)

### 3.4 Copy Your Phone Number
1. After purchase, you'll see your new number
2. Format: `+1234567890` (includes country code)
3. Copy this number - this is your `TWILIO_PHONE_NUMBER`

---

## Step 4: Add to Render Backend (2 minutes)

### 4.1 Go to Render Dashboard
1. Open: https://dashboard.render.com
2. Click on your **backend service**
3. Click "Environment" in the left sidebar

### 4.2 Add Environment Variables
Click "Add Environment Variable" and add these **3 variables**:

**Variable 1:**
- Key: `TWILIO_ACCOUNT_SID`
- Value: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (from Step 2.1)

**Variable 2:**
- Key: `TWILIO_AUTH_TOKEN`
- Value: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (from Step 2.1)

**Variable 3:**
- Key: `TWILIO_PHONE_NUMBER`
- Value: `+1234567890` (from Step 3.4, include the +)

### 4.3 Save and Deploy
1. Click "Save Changes"
2. Render will automatically redeploy (5-10 minutes)

---

## Step 5: Test SMS Verification (1 minute)

### 5.1 Add Test Phone Numbers (Free Trial Only)
During free trial, you can only send to verified numbers:

1. In Twilio Console, go to "Phone Numbers" → "Verified Caller IDs"
2. Click "Add a new number"
3. Enter the phone number you want to test with
4. Verify it (you'll receive a code)

### 5.2 Test on Your Website
1. Go to your website: https://mery-rose.onrender.com/login
2. Click "Sign up"
3. Fill in the form with a verified phone number
4. Choose "SMS" verification method
5. Click "Continue to Verification"
6. Check your phone - you should receive the code!

---

## Important Notes

### Free Trial Limitations
✅ $15 free credit (enough for testing)
✅ Can send SMS to verified phone numbers only
❌ Cannot send to unverified numbers
❌ SMS will include "Sent from your Twilio trial account"

### After Upgrading (Removing Trial)
✅ Can send to any phone number
✅ No "trial account" message
✅ Pay as you go: $0.0079 per SMS
✅ Phone number: $1/month

### To Upgrade Your Account
1. Go to Twilio Console
2. Click "Upgrade" in the top banner
3. Add payment method
4. No monthly fees - only pay for what you use!

---

## Troubleshooting

### "Account SID not found"
- Make sure you copied the full SID (starts with `AC`)
- Check for extra spaces
- Verify it's added to Render environment variables

### "Auth Token invalid"
- Click "Show" in Twilio Console to reveal the token
- Copy the entire token (no spaces)
- If you regenerated it, update Render with the new one

### "Phone number not found"
- Make sure to include the `+` and country code
- Format: `+1234567890` (not `1234567890`)
- Verify the number is active in Twilio Console

### "Permission denied" or "Not authorized"
- During trial, you can only send to verified numbers
- Go to "Verified Caller IDs" and add the recipient's number
- Or upgrade your account to send to anyone

### SMS not received
- Check if the phone number is verified (trial accounts)
- Verify the number format includes country code
- Check Twilio logs: Console → Monitor → Logs → Messaging
- Make sure the phone can receive SMS (not a landline)

---

## Alternative: Free SMS Testing (No Credit Card)

If you don't want to use Twilio yet, you can use a **mock SMS service** for testing:

### Option 1: Show Code on Screen (Current)
- Already implemented!
- When SMS service is not configured, code shows on screen
- Users can test without real SMS

### Option 2: Use Email Only
- Just set up email (see SETUP_EMAIL_NOW.md)
- Don't set up Twilio
- Users can only verify via email

### Option 3: Twilio Verify API (Easier)
Instead of regular SMS, use Twilio Verify (handles everything):
- Easier to implement
- Handles retries and rate limiting
- Same pricing
- See: https://www.twilio.com/docs/verify/api

---

## Cost Calculator

### Free Trial
- $15 credit
- ~1,900 SMS messages
- Perfect for testing and small launches

### Production Costs
| Users/Month | SMS Sent | Cost |
|-------------|----------|------|
| 100 | 100 | $0.79 + $1 = $1.79 |
| 500 | 500 | $3.95 + $1 = $4.95 |
| 1,000 | 1,000 | $7.90 + $1 = $8.90 |
| 5,000 | 5,000 | $39.50 + $1 = $40.50 |

**Note:** Most users verify once, so users/month ≈ SMS sent

---

## Quick Reference

### Where to Find Everything

**Account SID & Auth Token:**
- Twilio Console → Dashboard → Account Info panel (top right)

**Phone Numbers:**
- Twilio Console → Phone Numbers → Manage Numbers

**Verify Phone Numbers (Trial):**
- Twilio Console → Phone Numbers → Verified Caller IDs

**SMS Logs:**
- Twilio Console → Monitor → Logs → Messaging

**Upgrade Account:**
- Twilio Console → Top banner → "Upgrade" button

---

## Summary

1. ✅ Sign up at Twilio (3 min)
2. ✅ Copy Account SID and Auth Token (2 min)
3. ✅ Buy a phone number (3 min)
4. ✅ Add to Render environment (2 min)
5. ✅ Test SMS verification (1 min)

**Total time: ~10 minutes**
**Cost: Free trial ($15 credit)**

After setup, users can choose to verify via Email OR SMS!
