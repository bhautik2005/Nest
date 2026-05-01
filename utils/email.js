const nodemailer = require("nodemailer");
require("dotenv").config();

// ✅ Create transporter (Gmail)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // App Password
  },
});

// ===============================
// 📧 Guest Email
// ===============================
const sendGuestConfirmationEmail = async ({
  guestEmail,
  guestName,
  hostName,
  homeTitle,
  checkIn,
  checkOut,
  guestsCount,
  totalPrice,
}) => {
  try {
    console.log("📧 Sending booking email to GUEST...");

    await transporter.sendMail({
      from: `"Airbnb Clone" <${process.env.EMAIL_USER}>`,
      to: guestEmail,
      subject: `Booking Confirmed: ${homeTitle}`,
      html: `
        <h2>Booking Confirmed 🎉</h2>
        <p>Hi ${guestName},</p>
        <p>Your booking for <b>${homeTitle}</b> is confirmed.</p>

        <h3>Details:</h3>
        <p>Check-in: ${checkIn}</p>
        <p>Check-out: ${checkOut}</p>
        <p>Guests: ${guestsCount}</p>
        <p>Total Price: $${totalPrice}</p>

        <p>Host: ${hostName}</p>
        <br/>
        <p>Thanks for booking!</p>
      `,
    });

    console.log("✅ Guest email sent");
  } catch (error) {
    console.error("❌ Guest Email Error:", error.message);
  }
};

// ===============================
// 📧 Host Email
// ===============================
const sendHostAlertEmail = async ({
  hostEmail,
  hostName,
  guestName,
  guestId,
  guestEmail,
  homeTitle,
  checkIn,
  checkOut,
  guestsCount,
  totalPrice,
  paymentMethod,
}) => {
  try {
    console.log("📧 Sending booking email to HOST...");

    if (!hostEmail) return;

    await transporter.sendMail({
      from: `"Airbnb Clone" <${process.env.EMAIL_USER}>`,
      to: hostEmail,
      subject: `New Booking: ${homeTitle}`,
      html: `
        <h2>New Booking Alert 🔔</h2>
        <p>Hi ${hostName},</p>

        <p><b>${guestName}</b> booked your property: <b>${homeTitle}</b></p>

        <h3>Booking Details:</h3>
        <p>Check-in: ${checkIn}</p>
        <p>Check-out: ${checkOut}</p>
        <p>Guests: ${guestsCount}</p>

        <h3>Guest Info:</h3>
        <p>Name: ${guestName}</p>
        <p>Email: ${guestEmail}</p>
        <p>ID: ${guestId}</p>

        <h3>Payment:</h3>
        <p>Total: $${totalPrice}</p>
        <p>Method: ${paymentMethod}</p>

        <br/>
        <p>Please prepare your property.</p>
      `,
    });

    console.log("✅ Host email sent");
  } catch (error) {
    console.error("❌ Host Email Error:", error.message);
  }
};

// ===============================
// 🔐 Password Reset Email
// ===============================
const sendPasswordResetEmail = async ({ email, name, resetUrl }) => {
  try {
    console.log("📧 Sending password reset email...");

    await transporter.sendMail({
      from: `"Airbnb Clone" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Request",
      html: `
        <h2>Password Reset</h2>
        <p>Hello ${name || "User"},</p>

        <p>Click below to reset your password:</p>

        <a href="${resetUrl}" 
           style="background:#007bff;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">
           Reset Password
        </a>

        <p>This link expires in 1 hour.</p>
      `,
    });

    console.log("✅ Password reset email sent");
  } catch (error) {
    console.error("❌ Reset Email Error:", error.message);
    throw error;
  }
};

// ===============================
module.exports = {
  sendGuestConfirmationEmail,
  sendHostAlertEmail,
  sendPasswordResetEmail,
};