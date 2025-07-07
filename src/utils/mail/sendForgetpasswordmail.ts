import { Resend } from "resend";

import ResetPasswordEmail from "../../../emails/resetMail";


const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await resend.emails.send({
    from: "Acme <onboarding@resend.dev>",
    to,
    subject: "Password Reset",
    react: ResetPasswordEmail({ resetUrl, name: "User" }),
  });
}
