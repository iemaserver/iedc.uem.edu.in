

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import axios from "axios";
import { IconBrandGoogle } from "@tabler/icons-react";

// --- Zod schema for validation ---
const signupSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    fullName: z.string().min(3, "Full name must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate with Zod
    const validation = signupSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      // Call signup API with Axios
      await axios.post("/api/auth/signup", {
        email: formData.email,
        fullName: formData.fullName,
        password: formData.password,
      });

      router.push("/login"); // redirect after successful signup
    } catch (err: any) {
      setErrors({
        general:
          err.response?.data?.message || "Signup failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 bg-gray-400/20 rounded-md bg-clip-padding backdrop-filter backdrop-blur-sm">
        <CardContent className="grid p-0">
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl md:text-3xl font-extrabold">
                  Welcome to IEDC
                </h1>
                <p className="text-muted-foreground text-balance">
                  Create your IEDC account
                </p>
              </div>

              {errors.general && (
                <p className="text-red-500 text-sm">{errors.general}</p>
              )}

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label htmlFor="email" className="text-white text-lg">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={formData.email}
                    onChange={handleChange}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm">{errors.email}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="fullName" className="text-white text-lg">
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                  />
                  {errors.fullName && (
                    <p className="text-red-500 text-sm">{errors.fullName}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="password" className="text-white text-lg">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                />
                {errors.password && (
                  <p className="text-red-500 text-sm">{errors.password}</p>
                )}
              </div>

              <div className="grid gap-3">
                <Label
                  htmlFor="confirmPassword"
                  className="text-white text-lg"
                >
                  Confirm password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating..." : "Sign Up"}
              </Button>

              <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t"></div>

              <div className="grid gap-4">
                <Button
                  variant="outline"
                  type="button"
                  className="w-full flex gap-2 cursor-pointer"
                  onClick={handleGoogleSignIn}
                >
                  <IconBrandGoogle/>
                  Sign up with Google
                </Button>
              </div>

              <div className="text-center text-sm">
                Have an account?{" "}
                <Link
                  href="/login"
                  className="underline underline-offset-4 text-white"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
