import { getMailer } from "../../lib/mailer.js";
import { rejectEmailTemplate, verificationEmailTemplate } from "./emailTemplate.js";

const sender = () => ({
  name: "ClickRide",
  address: process.env.USER_EMAIL,
});

export const sendVerificationEmail = (email, temporaryPassword) =>
  getMailer().sendMail({
    from: sender(),
    to: email,
    subject: "Your ClickRide partner account",
    html: verificationEmailTemplate(temporaryPassword),
  });

export const rejectEmail = (email, fullName) =>
  getMailer().sendMail({
    from: sender(),
    to: email,
    subject: "ClickRide partner application update",
    html: rejectEmailTemplate(fullName),
  });
