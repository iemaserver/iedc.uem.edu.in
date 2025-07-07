import {
  Html,
  Head,
  Preview,
  Tailwind,
  Section,
  Text,
  Button,
  Container,
} from "@react-email/components";

interface ResetPasswordEmailProps {
  name?: string;
  resetUrl: string;
}

export default function ResetPasswordEmail({
  name = "User",
  resetUrl,
}: ResetPasswordEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your password</Preview>
      <Tailwind>
        <Section className="bg-white py-10">
          <Container className="max-w-lg mx-auto border border-gray-200 shadow-md rounded-lg px-6 py-8">
            <Text className="text-xl font-semibold text-black">
              Hello {name},
            </Text>

            <Text className="text-base text-gray-800 mt-4">
              We received a request to reset your password. Click the button below to choose a new one.
            </Text>

            <div className="text-center mt-6">
              <Button
                href={resetUrl}
                className="bg-blue-600 text-white font-bold px-5 py-3 rounded-md"
              >
                Reset Password
              </Button>
            </div>

            <Text className="text-sm text-gray-700 mt-6">
              If the button doesn't work, you can also copy and paste this URL into your browser:
            </Text>

            <Text className="text-xs text-blue-600 break-all">{resetUrl}</Text>

            <Text className="text-xs text-gray-500 mt-6">
              If you didn't request a password reset, you can safely ignore this email.
            </Text>
          </Container>
        </Section>
      </Tailwind>
    </Html>
  );
}
