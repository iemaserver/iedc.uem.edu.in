import { Resend } from "resend";
import VerificationEmail from "../../../emails/varificationMail";


const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(to: string, otpCode: string) {
  await resend.emails.send({
    from: "Acme <onboarding@resend.dev>",
    to,
    subject: "Your verification code",
    react: VerificationEmail({ otpCode }),
  });
}
