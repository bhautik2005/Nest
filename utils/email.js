const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendGuestConfirmationEmail = async ({ guestEmail, guestName, hostName, homeTitle, checkIn, checkOut, guestsCount, totalPrice }) => {
  try {
    console.log("📧 Sending booking notification email to GUEST...");
    await transporter.sendMail({
      from: `"Airbnb Clone" <${process.env.EMAIL_USER}>`,
      to: guestEmail, 
      subject: `Booking Confirmed: ${homeTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #FF5A5F;">Booking Confirmation! 🎉</h2>
          <p>Hi ${guestName},</p>
          <p>Your booking for <strong>${homeTitle}</strong> has been successfully confirmed. We are excited for your upcoming trip!</p>
          
          <div style="background: #f8f8f8; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Reservation Details:</h3>
            <p><strong>Check-in:</strong> ${checkIn}</p>
            <p><strong>Check-out:</strong> ${checkOut}</p>
            <p><strong>Guests:</strong> ${guestsCount}</p>
            <p><strong>Total Price Paid:</strong> $${totalPrice}</p>
          </div>

          <p>If you have any questions, feel free to reach out to your host, ${hostName}.</p>
          <p>Safe travels,</p>
          <p><strong>The Airbnb Clone Team</strong></p>
        </div>
      `,
    });
    console.log("✅ Guest confirmation email sent successfully");
  } catch (error) {
    console.error("❌ Email Error (Guest):", error.message);
  }
};

const sendHostAlertEmail = async ({ hostEmail, hostName, guestName, guestId, guestEmail, homeTitle, checkIn, checkOut, guestsCount, totalPrice, paymentMethod }) => {
  try {
    console.log("📧 Sending booking notification email to HOST...");
    if (!hostEmail) return;

    await transporter.sendMail({
      from: `"Airbnb Clone" <${process.env.EMAIL_USER}>`,
      to: hostEmail, 
      subject: `New Confirmed Booking: ${homeTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #00A699;">New Confirmed Booking! 🔔</h2>
          <p>Hi ${hostName},</p>
          <p>Great news! <strong>${guestName}</strong> has successfully booked your property, <strong>${homeTitle}</strong>.</p>
          
          <div style="background: #f8f8f8; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Booking & Guest Details:</h3>
            <p><strong>Guest Name:</strong> ${guestName}</p>
            <p><strong>Guest ID:</strong> ${guestId}</p>
            <p><strong>Guest Email:</strong> ${guestEmail}</p>
            <hr style="border-top: 1px solid #ddd; margin: 10px 0;" />
            <p><strong>Check-in:</strong> ${checkIn}</p>
            <p><strong>Check-out:</strong> ${checkOut}</p>
            <p><strong>Members (Guests):</strong> ${guestsCount}</p>
            <hr style="border-top: 1px solid #ddd; margin: 10px 0;" />
            <p><strong>Total Amount:</strong> $${totalPrice}</p>
            <p><strong>Payment Method:</strong> ${paymentMethod}</p>
          </div>

          <p>The payment has been successfully processed. Please make sure the property is ready for their arrival.</p>
          <p>Happy Hosting,</p>
          <p><strong>The Airbnb Clone Team</strong></p>
        </div>
      `,
    });
    console.log("✅ Host alert email sent successfully");
  } catch (error) {
    console.error("❌ Email Error (Host):", error.message);
  }
};

module.exports = {
  sendGuestConfirmationEmail,
  sendHostAlertEmail
};
