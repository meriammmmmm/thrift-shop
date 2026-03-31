# Your Twilio Credentials

## ✅ What You Have
- **Account SID**: `AC06984a8cafafcd87b1266cebc80b1257`
- **Auth Token**: `dce1e7d42afa9168335a141b70eb6c54`

## ❌ What You Still Need
- **Phone Number**: You need to buy one from Twilio

---

## Next Steps

### Step 1: Get a Phone Number (3 minutes)

1. Go to Twilio Console: https://console.twilio.com
2. In the left sidebar, click **"Phone Numbers"** or **"# Phone Numbers"**
3. Click **"Buy a number"** or **"Get a number"**
4. Make sure **"SMS"** is checked
5. Click **"Search"**
6. Click **"Buy"** next to any number you like
7. Copy the phone number (format: `+1234567890`)

### Step 2: Add to Render (2 minutes)

1. Go to: https://dashboard.render.com
2. Click your **backend service** (mery-rose-backend)
3. Click **"Environment"** in left sidebar
4. Click **"Add Environment Variable"** and add these 3:

**Variable 1:**
```
Key: TWILIO_ACCOUNT_SID
Value: AC06984a8cafafcd87b1266cebc80b1257
```

**Variable 2:**
```
Key: TWILIO_AUTH_TOKEN
Value: dce1e7d42afa9168335a141b70eb6c54
```

**Variable 3:**
```
Key: TWILIO_PHONE_NUMBER
Value: +1234567890
```
(Replace with the phone number you get from Step 1)

5. Click **"Save Changes"**
6. Wait for Render to redeploy (5-10 minutes)

---

## Important Notes

### Free Trial Restrictions
- You can only send SMS to **verified phone numbers**
- To verify a phone number:
  1. Go to Twilio Console
  2. Click "Phone Numbers" → "Verified Caller IDs"
  3. Click "Add a new number"
  4. Enter the phone number and verify it

### Testing
After setup, test with a verified phone number:
1. Go to your website
2. Sign up with the verified phone number
3. Choose "SMS" verification
4. You should receive the code!

---

## Quick Links

- **Twilio Console**: https://console.twilio.com
- **Buy Phone Number**: https://console.twilio.com/us1/develop/phone-numbers/manage/search
- **Verify Phone Numbers**: https://console.twilio.com/us1/develop/phone-numbers/manage/verified
- **Render Dashboard**: https://dashboard.render.com

---

## Summary

✅ Account SID: Ready
✅ Auth Token: Ready
❌ Phone Number: **Get this now from Twilio**
❌ Add to Render: **Do this after getting phone number**

Total time remaining: ~5 minutes
