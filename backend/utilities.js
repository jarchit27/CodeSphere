const jwt = require('jsonwebtoken')
function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = (authHeader && authHeader.split(" ")[1]) || req.query.token;

    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(401);
        req.user = user;
        next();
    });
}

const nodemailer = require('nodemailer');
const dns = require('dns');
// dns.setDefaultResultOrder('ipv4first');

const sendVerificationEmail = async (email, otp, context = "signup") => {
    // In production, these should be in .env. We fallback to console log if missing.
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn("⚠️ EMAIL_USER or EMAIL_PASS missing in .env. Logging OTP instead of sending email.");
        console.log(`\n==========================================\n`);
        console.log(`📧 MOCK EMAIL TO: ${email}`);
        console.log(`🔑 OTP CODE: ${otp}`);
        console.log(`\n==========================================\n`);
        return true;
    }

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        // Force IPv4 because Render's IPv6 outbound routing is broken
        family: 4,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const isReset = context === "reset";
    const subject = isReset ? 'Reset your CodeSphere Password' : 'Verify your CodeSphere Account';
    const headerText = isReset ? 'Password Reset Request' : 'Welcome to CodeSphere!';
    const bodyText = isReset
        ? 'We received a request to reset your password. Please enter the following 6-digit code to proceed:'
        : 'Thank you for signing up. To complete your registration, please enter the verification code below:';
    const ignoreText = isReset
        ? 'If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.'
        : 'If you didn\'t create an account, you can safely ignore this email.';

    const mailOptions = {
        from: `"CodeSphere" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: subject,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <h2 style="color: #6366f1;">${headerText}</h2>
                <p>${bodyText}</p>
                <div style="background-color: #f3f4f6; padding: 16px; border-radius: 4px; text-align: center; margin: 24px 0;">
                    <h1 style="margin: 0; font-size: 32px; letter-spacing: 4px; color: #1f2937;">${otp}</h1>
                </div>
                <p>This code will expire in 15 minutes.</p>
                <p>${ignoreText}</p>
                <br>
                <p>Best regards,<br>The CodeSphere Team</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error("Error sending verification email:", error);
        return false;
    }
};

module.exports = { authenticateToken, sendVerificationEmail };