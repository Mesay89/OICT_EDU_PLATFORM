import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  try {
    // Check if email is configured
    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD || 
        process.env.SMTP_EMAIL === 'your-email@gmail.com') {
      console.log('\n=== EMAIL NOT CONFIGURED ===');
      console.log('To enable email functionality, update these values in backend/.env:');
      console.log('SMTP_EMAIL=your-actual-email@gmail.com');
      console.log('SMTP_PASSWORD=your-app-password');
      console.log('\nFor Gmail:');
      console.log('1. Go to Google Account settings');
      console.log('2. Enable 2-Step Verification');
      console.log('3. Generate an App Password');
      console.log('4. Use the App Password in SMTP_PASSWORD');
      console.log('\n=== SIMULATED EMAIL (Development Mode) ===');
      console.log('To:', options.email);
      console.log('Subject:', options.subject);
      console.log('Message:', options.message);
      console.log('=====================================\n');
      
      // In development, we'll pretend the email was sent
      return { messageId: 'dev-mode-no-email-sent' };
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const message = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html || options.message.replace(/\n/g, '<br>'),
    };

    const info = await transporter.sendMail(message);
    console.log('Email sent successfully: %s', info.messageId);
    
    return info;
  } catch (error) {
    console.error('Email sending error:', error.message);
    throw new Error('Failed to send email. Please check your email configuration.');
  }
};

export default sendEmail;
