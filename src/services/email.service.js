import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  // Add debug logging in development
  debug: process.env.NODE_ENV === 'development',
  logger: process.env.NODE_ENV === 'development'
});

// Verify SMTP connection configuration
const verifyConnection = async () => {
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('SMTP connection verification failed:', error);
    return false;
  }
};

// Call verify on startup
verifyConnection();

export const sendEmail = async ({ to, subject, text, html, email }) => {
  try {
    // Development mode logging
    if (process.env.NODE_ENV === 'development') {
      console.log('Attempting to send email:', {
        to,
        subject,
        text,
        html,
        email,
        from: process.env.SMTP_FROM
      });
    }

    // Ensure we have a plain text version
    const plainText = text || (html ? html.replace(/<[^>]*>/g, '') : '');

    // Send mail with defined transport object
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject: `${subject} ${email ? `| sent by ${email}` : ''}`,
      text: plainText, // Always include plain text
      ...(html && { html }) // Only include HTML if provided
    });
    if (process.env.NODE_ENV === 'development') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', {
      error: error.message,
      code: error.code,
      command: error.command
    });
    // Provide more detailed error messages
    let errorMessage = 'Failed to send email';
    if (error.code === 'EAUTH') {
      errorMessage = 'SMTP authentication failed. Please check your credentials.';
    } else if (error.code === 'ESOCKET') {
      errorMessage = 'Could not connect to SMTP server. Please check your connection settings.';
    }
    
    throw new Error(errorMessage);
  }
};

// Example of a formatted email template
export const sendAdminNotification = async ({ subject, message }) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  
  // Create a simple plain text version
  const plainText = `Subject: ${subject}\n\n${message}\n\nThis is an automated message from the Tech Radar application.\nSent at: ${new Date().toLocaleString()}`;

  // HTML version (optional)
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
        <h2 style="color: #2c3e50; margin-bottom: 20px;">${subject}</h2>
        <div style="color: #34495e; line-height: 1.6;">
          ${message}
        </div>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #7f8c8d; font-size: 12px; margin: 0;">
          This is an automated message from the Tech Radar application.
          <br>
          Sent at: ${new Date().toLocaleString()}
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: adminEmail,
    subject,
    text: plainText,
    html
  });
}; 