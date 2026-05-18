const nodemailer = require("nodemailer");

const sendWelcomeEmail = async (email, name) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Welcome to SkillSphere 🚀",
      html: `
        <h2>Welcome to SkillSphere, ${name}!</h2>
        <p>Your account has been created successfully.</p>
        <p>Start exploring SkillSphere today.</p>
      `,
    });

    console.log("Welcome email sent");
  } catch (error) {
    console.log(error);
  }
};

module.exports = sendWelcomeEmail;