# 🚀 Run Frontend Locally - Test Forgot Password

## Quick Start

Open your terminal and run these commands:

```bash
# Navigate to frontend folder
cd thrift-shop

# Start the development server
npm run dev
```

The frontend will start at: **http://localhost:3000**

## 🧪 Test Forgot Password Feature

### Step 1: Go to Login Page
Open your browser and visit:
```
http://localhost:3000/login
```

### Step 2: Click "Forgot password?"
You'll see a link at the bottom of the password field.

### Step 3: Enter Your Email
- Enter an email that exists in your database
- Click "Send Reset Code"

### Step 4: Get the Code
Since email might not be configured, check your **backend console** for the code.

The backend will show something like:
```
⚠️ Email not configured. Verification code: 123456
```

Or if you're using the Render backend, the code will be shown in the response.

### Step 5: Enter the Code
- Enter the 6-digit code
- Click "Verify Code"

### Step 6: Set New Password
- Enter your new password (min 6 characters)
- Confirm the password
- Click "Reset Password"

### Step 7: Login
You'll be redirected to login. Use your new password!

## 🔧 If Backend is Not Running

Make sure your backend is running too:

```bash
# In a new terminal window
cd backend
npm start
```

Backend runs at: **http://localhost:5001**

## 📱 Direct URL to Forgot Password

You can also go directly to:
```
http://localhost:3000/forgot-password
```

## 🎯 What to Test

1. ✅ Email input validation
2. ✅ Code sending (check backend console)
3. ✅ Code verification
4. ✅ Password reset
5. ✅ Login with new password
6. ✅ Error messages (wrong code, expired code, etc.)
7. ✅ Back navigation between steps
8. ✅ Mobile responsive design

## 🐛 Troubleshooting

### Port Already in Use?
If port 3000 is busy:
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

### Backend Not Responding?
Make sure backend is running on port 5001:
```bash
cd backend
npm start
```

### Can't Find npm?
Make sure Node.js is installed:
```bash
node --version
npm --version
```

## 📸 What You Should See

### Login Page:
- "Forgot password?" link below password field

### Forgot Password Page:
- Step 1: Email input
- Step 2: 6-digit code input
- Step 3: New password form

### Success:
- Green success message
- Auto-redirect to login after 2 seconds

## 🎨 UI Features to Check

- ✅ Mery Rose logo displays
- ✅ Gradient background (pink to purple)
- ✅ Smooth transitions between steps
- ✅ Loading states on buttons
- ✅ Error messages in red
- ✅ Success messages in green
- ✅ Password visibility toggle
- ✅ Responsive on mobile

## 💡 Tips

1. **Use a test email** that exists in your database
2. **Check backend console** for the verification code
3. **Code expires in 10 minutes** - be quick!
4. **Try wrong codes** to test error handling
5. **Test on mobile** by resizing browser window

Enjoy testing! 🎉
