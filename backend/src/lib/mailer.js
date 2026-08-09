import nodemailer from "nodemailer";

let transporter;

export const getMailer = () => {
  if (!process.env.USER_EMAIL || !process.env.APP_PASSWORD) {
    throw new Error("Email service is not configured");
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.USER_EMAIL,
        pass: process.env.APP_PASSWORD,
      },
    });
  }

  return transporter;
};
