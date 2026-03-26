// SMS Verification Service using Twilio
// Install: npm install twilio

// Uncomment when you have Twilio credentials
// const twilio = require('twilio');

// const client = twilio(
//   process.env.TWILIO_ACCOUNT_SID,
//   process.env.TWILIO_AUTH_TOKEN
// );

// Generate 6-digit verification code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send SMS verification code
async function sendVerificationSMS(phoneNumber, code) {
  try {
    // Validate phone number format
    if (!phoneNumber || !phoneNumber.match(/^\+?[1-9]\d{1,14}$/)) {
      return { 
        success: false, 
        error: 'Invalid phone number format. Use international format: +1234567890' 
      };
    }

    // Check if Twilio is configured
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.log('Twilio not configured. Code would be:', code);
      return { 
        success: false, 
        error: 'SMS service not configured. Please add Twilio credentials to .env file' 
      };
    }

    // Uncomment when Twilio is configured
    /*
    const message = await client.messages.create({
      body: `Your verification code is: ${code}. Valid for 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });

    console.log('SMS sent successfully:', message.sid);
    return { success: true, messageId: message.sid };
    */

    // For development without Twilio
    console.log(`[DEV MODE] SMS to ${phoneNumber}: Your code is ${code}`);
    return { 
      success: true, 
      dev: true,
      message: 'Development mode: Check console for code' 
    };

  } catch (error) {
    console.error('SMS sending error:', error);
    return { success: false, error: error.message };
  }
}

// Send verification via WhatsApp (Twilio)
async function sendVerificationWhatsApp(phoneNumber, code) {
  try {
    if (!phoneNumber || !phoneNumber.match(/^\+?[1-9]\d{1,14}$/)) {
      return { 
        success: false, 
        error: 'Invalid phone number format. Use international format: +1234567890' 
      };
    }

    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.log('Twilio not configured. Code would be:', code);
      return { 
        success: false, 
        error: 'WhatsApp service not configured' 
      };
    }

    // Uncomment when Twilio WhatsApp is configured
    /*
    const message = await client.messages.create({
      body: `Your verification code is: ${code}. Valid for 10 minutes.`,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${phoneNumber}`
    });

    return { success: true, messageId: message.sid };
    */

    console.log(`[DEV MODE] WhatsApp to ${phoneNumber}: Your code is ${code}`);
    return { 
      success: true, 
      dev: true,
      message: 'Development mode: Check console for code' 
    };

  } catch (error) {
    console.error('WhatsApp sending error:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  generateVerificationCode,
  sendVerificationSMS,
  sendVerificationWhatsApp
};
