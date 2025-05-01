// src/Utils/Email.util.ts
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail", // or use your SMTP provider
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export const sendDeletionRequestEmail = async ({
  username,
  contact,
  reason,
}: {
  username: string;
  contact: string;
  reason?: string;
}) => {
  const mailOptions = {
    from: `"Account Deletion Request" <${process.env.MAIL_USER}>`,
    to: process.env.MAIL_RECEIVER, // your support email
    subject: `Account Deletion Request from ${username}`,
    text: `A user has requested account deletion.\n\nUsername: ${username}\nEmail/Phone: ${contact}\nReason: ${reason || "Not provided"}`,
  };

  return transporter.sendMail(mailOptions);
};

//To report
export const sendUserReportEmail = async ({
    reporterUsername,
    reportedUsername,
    reason,
  }: {
    reporterUsername: string;
    reportedUsername: string;
    reason: string;
  }) => {
    const mailOptions = {
      from: `"User Report Alert" <${process.env.MAIL_USER}>`,
      to: process.env.MAIL_RECEIVER, // your admin or support email
      subject: `🚨 Report: ${reportedUsername} was reported`,
      text: `User ${reporterUsername} has reported ${reportedUsername}.\n\nReason: ${reason}`,
    };
  
    return transporter.sendMail(mailOptions);
  };
  