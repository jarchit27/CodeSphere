const jwt = require('jsonwebtoken')
function authenticateToken(req, res,next){
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if(!token ) return res.sendStatus(401);

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user)=>{
        if(err) return res.sendStatus(401);
        req.user = user;
        next();
    });
}

const nodemailer = require('nodemailer');

const sendVerificationEmail = async (email, otp) => {
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
        service: 'gmail', // You can change to SendGrid, Outlook, etc.
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: `"CodeSphere" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Verify your CodeSphere Account',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <h2 style="color: #6366f1;">Welcome to CodeSphere!</h2>
                <p>Thank you for signing up. To complete your registration, please enter the verification code below:</p>
                <div style="background-color: #f3f4f6; padding: 16px; border-radius: 4px; text-align: center; margin: 24px 0;">
                    <h1 style="margin: 0; font-size: 32px; letter-spacing: 4px; color: #1f2937;">${otp}</h1>
                </div>
                <p>This code will expire in 10 minutes.</p>
                <p>If you didn't create an account, you can safely ignore this email.</p>
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