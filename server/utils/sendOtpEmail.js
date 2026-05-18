const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendOtpEmail = async (email, name, otp) => {

  await transporter.sendMail({

    from: process.env.EMAIL_USER,

    to: email,

    subject: 'SkillSphere Email Verification',

    html: `
      <div style="font-family: Arial">

        <h2>Welcome to SkillSphere, ${name}</h2>

        <p>Your verification OTP is:</p>

        <h1>${otp}</h1>

        <p>This OTP expires in 5 minutes.</p>

      </div>
    `
  });

};

module.exports = sendOtpEmail;
