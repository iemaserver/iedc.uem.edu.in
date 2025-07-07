import {
  Html,
  Head,
  Preview,
  Section,
  Text,
  Tailwind,
  Container,
} from "@react-email/components";

interface VerificationEmailProps {
  name?: string;
  otpCode: string;
}

export default function VerificationEmail({ name="User", otpCode }: VerificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your verification code</Preview>
      <Tailwind>
        <Section className="bg-white py-10">
          <Container className="mx-auto max-w-lg rounded-lg border border-gray-200 px-6 py-10 shadow-md">
            <Text className="text-xl font-semibold text-black">Hi {name},</Text>
            <Text className="text-base text-black mt-4">
              Your one-time verification code is:
            </Text>
            <Text className="text-4xl font-bold text-center tracking-widest text-blue-600 my-6">
              {otpCode}
            </Text>
            <Text className="text-sm text-gray-700">
              Please enter this code to verify your email address. This code is valid for 10 minutes.
            </Text>
            <Text className="text-xs text-gray-500 mt-6">
              If you did not request this code, you can safely ignore this email.
            </Text>
          </Container>
        </Section>
      </Tailwind>
    </Html>
  );
}
