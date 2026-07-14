import nodemailer from 'nodemailer';

// ✅ CREATE TRANSPORTER ONCE (Connection Pooling)
// This avoids creating a new connection for every email
let transporter = null;

const getTransporter = () => {
  // Check if email is configured
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD || 
      process.env.SMTP_EMAIL === 'your-email@gmail.com') {
    return null; // Email not configured
  }

  // Create transporter once and reuse it
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
      pool: true, // ✅ Use connection pooling for better performance
      maxConnections: 5, // ✅ Allow up to 5 simultaneous connections
      maxMessages: 100, // ✅ Send up to 100 emails per connection
      rateLimit: 10 // ✅ Send max 10 emails per second
    });

    // ✅ Verify connection on startup (helps catch config errors early)
    transporter.verify((error, success) => {
      if (error) {
        console.error('❌ Email transporter verification failed:', error.message);
      } else {
        console.log('✅ Email server is ready to send messages');
      }
    });
  }

  return transporter;
};

const sendEmail = async (options) => {
  try {
    const emailTransporter = getTransporter();

    // If email not configured, simulate in development
    if (!emailTransporter) {
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

    const message = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html || options.message.replace(/\n/g, '<br>'),
    };

    // ✅ FAST: Reuses existing connection instead of creating new one
    const info = await emailTransporter.sendMail(message);
    console.log('✅ Email sent successfully: %s', info.messageId);
    
    return info;
  } catch (error) {
    console.error('❌ Email sending error:', error.message);
    throw new Error('Failed to send email. Please check your email configuration.');
  }
};

export default sendEmail;
