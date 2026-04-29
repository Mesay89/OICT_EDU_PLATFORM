import axios from 'axios';

/**
 * Send SMS to a phone number
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} message - Message content
 */
export const sendSMS = async (phoneNumber, message) => {
  try {
    // 1. Check if SMS is enabled in .env
    if (process.env.SMS_ENABLED !== 'true') {
      console.log('--- SMS SIMULATION ---');
      console.log(`To: ${phoneNumber}`);
      console.log(`Message: ${message}`);
      console.log('----------------------');
      return true;
    }

    // 2. Format phone number for Ethiopia (ensure starts with 251)
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '251' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('251')) {
      formattedPhone = '251' + formattedPhone;
    }

    // 3. Integration logic for SMSEthiopia
    const response = await axios.post(process.env.SMS_PROVIDER_URL, {
      msisdn: formattedPhone,
      text: message
    }, {
      headers: {
        'KEY': process.env.SMS_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log(`Real SMS sent to ${formattedPhone} via SMSEthiopia`);
    return response.status === 200;
  } catch (error) {
    console.error('SMS Send Error:', error.message);
    return false;
  }
};
