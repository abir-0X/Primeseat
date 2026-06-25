const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

let transporter;

// Create transporter helper that resolves SMTP or falls back to console logger/Ethereal
const getTransporter = async () => {
    if (transporter) return transporter;

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        console.log('Nodemailer: Configured Gmail SMTP');
        return transporter;
    }

    // Fallback to ethereal if no Gmail user/pass is configured
    try {
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: testAccount.smtp.host,
            port: testAccount.smtp.port,
            secure: testAccount.smtp.secure,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        });
        console.log('Nodemailer: Ethereal email service initialized.');
        console.log(`Ethereal credentials: User: ${testAccount.user}, Pass: ${testAccount.pass}`);
        return transporter;
    } catch (err) {
        console.log('Nodemailer: Failed to initialize Ethereal. Falling back to console-only logging.');
        transporter = {
            sendMail: async (options) => {
                console.log('==================================================');
                console.log('MOCK EMAIL SENDING (CONSOLE FALLBACK):');
                console.log(`To: ${options.to}`);
                console.log(`Subject: ${options.subject}`);
                console.log(`Content:\n${options.html.replace(/<[^>]*>/g, '')}`); // Strip simple html tags
                console.log('==================================================');
                return { messageId: 'mock-id' };
            }
        };
        return transporter;
    }
};

const sendBookingEmail = async (userEmail, userName, eventTitle) => {
    try {
        const tx = await getTransporter();
        const mailOptions = {
            from: process.env.EMAIL_USER || 'no-reply@primeseat.com',
            to: userEmail,
            subject: `Booking Confirmed: ${eventTitle}`,
            html: `
        <h2>Hi ${userName}!</h2>
        <p>Your booking for the event <strong>${eventTitle}</strong> is successfully confirmed.</p>
        <p>Thank you for choosing Primeseat.</p>
      `
        };
        const info = await tx.sendMail(mailOptions);
        if (info.messageId && nodemailer.getTestMessageUrl) {
            const url = nodemailer.getTestMessageUrl(info);
            if (url) console.log(`Ethereal Confirmation Email Link: ${url}`);
        }
        console.log('Email sent successfully to', userEmail);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

const sendOTPEmail = async (userEmail, otp, type) => {
    try {
        const tx = await getTransporter();
        const title = type === 'account_verification' ? 'Verify your Primeseat Account' : 'Primeseat Booking Verification';
        const msg = type === 'account_verification'
            ? 'Please use the following OTP to verify your new Primeseat account.'
            : 'Please use the following OTP to verify and confirm your event booking.';

        const mailOptions = {
            from: process.env.EMAIL_USER || 'no-reply@primeseat.com',
            to: userEmail,
            subject: title,
            html: `
                <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
                    <h2 style="color: #111;">${title}</h2>
                    <p style="color: #555; font-size: 16px;">${msg}</p>
                    <div style="margin: 20px auto; padding: 15px; font-size: 24px; font-weight: bold; background: #f4f4f4; width: max-content; letter-spacing: 5px;">
                        ${otp}
                    </div>
                    <p style="color: #999; font-size: 12px;">This code expires in 2 minutes. If you didn't request this, please ignore this email.</p>
                </div>
            `
        };
        const info = await tx.sendMail(mailOptions);
        console.log(`\n=========================================`);
        console.log(`[OTP SENT] To: ${userEmail} | Code: ${otp} | Type: ${type}`);
        console.log(`=========================================\n`);
        if (info.messageId && nodemailer.getTestMessageUrl) {
            const url = nodemailer.getTestMessageUrl(info);
            if (url) console.log(`Ethereal OTP Email Link: ${url}`);
        }
    } catch (error) {
        console.error('Error sending OTP email:', error);
    }
};

module.exports = { sendBookingEmail, sendOTPEmail };
