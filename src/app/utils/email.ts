import nodemailer from "nodemailer";
import { envVars } from "../config/env";

const transporter = nodemailer.createTransport({
  host: envVars.EMAIL_SENDER.SMTP_HOST,
  port: Number(envVars.EMAIL_SENDER.SMTP_PORT),
  secure: Number(envVars.EMAIL_SENDER.SMTP_PORT) === 465,
  auth: {
    user: envVars.EMAIL_SENDER.SMTP_USER,
    pass: envVars.EMAIL_SENDER.SMTP_PASS,
  },
});

interface ISendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: ISendEmailOptions): Promise<void> => {
  const { to, subject, html } = options;

  await transporter.sendMail({
    from: `"Portfolio Server" <${envVars.EMAIL_SENDER.SMTP_FROM}>`,
    to,
    subject,
    html,
  });
};
