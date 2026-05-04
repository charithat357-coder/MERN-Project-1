// In a real application, you would install the twilio package and use it like this:
// const twilio = require('twilio');
// const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const sendSMS = async (to, message) => {
  console.log(`\n================= SMS NOTIFICATION =================`);
  console.log(`[Twilio Simulation] Sending SMS to: ${to}`);
  console.log(`[Message]: ${message}`);
  console.log(`====================================================\n`);

  /*
  // Real Twilio Integration Code (uncomment and configure environment variables when ready)
  try {
    const response = await client.messages.create({
      body: message,
      to: to, // Text this number
      from: process.env.TWILIO_PHONE_NUMBER // From a valid Twilio number
    });
    console.log('SMS sent successfully:', response.sid);
  } catch (error) {
    console.error('Error sending SMS:', error);
  }
  */
};

const sendNotification = async (user, otp) => {
  const message = `Your College Admin OTP is ${otp}. It will expire in 10 minutes.`;

  // As requested, send SMS to specific phone number for Admin (or fallback to user.phone)
  let phoneTarget = user.phone;
  
  if (user.role === 'Admin') {
    // Specifically route Admin OTPs to the requested number
    phoneTarget = '6302651338';
  } else if (!phoneTarget) {
    // Fallback if no phone is found
    phoneTarget = '6302651338';
  }

  await sendSMS(phoneTarget, message);
};

module.exports = { sendNotification };
