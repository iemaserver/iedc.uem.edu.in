"use client";

import Image from "next/image";
import React from "react";
import { Quintessential } from "next/font/google";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Icons } from "@/components/ui/icons";

const quintessential = Quintessential({
  subsets: ["latin"],
  weight: "400",
  variable: "--quintessential-font",
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [emailSent, setEmailSent] = React.useState(false);
  const router = useRouter();

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    try {
      const response = await axios.post("/api/auth/forgot-password", {
        email: data.email,
      });

      toast.success("Password reset email sent! Check your inbox.");
      setEmailSent(true);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Something went wrong!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='w-screen h-screen bg-[url("/auth-bg.jpg")] bg-cover bg-center flex justify-center items-center lg:p-12 md:p-6 p-4 font-sans'>
      <div className="w-full max-w-6xl h-full flex justify-between items-center rounded-3xl overflow-hidden shadow-2xl bg-white/80 backdrop-blur-md border border-white/20">
        {/* Left Side: Visual/Branding Section */}
        <div className="relative hidden lg:block lg:w-1/2 h-full p-4">
          <div className="relative h-full w-full rounded-2xl overflow-hidden shadow-inner">
            <Image
              src="/bg-signup.jpg"
              alt="Reset Password"
              fill
              className="object-cover transition-transform duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            <div
              className={`${quintessential.className} absolute bottom-12 left-8 right-8 text-white`}
            >
              <h2 className="text-4xl font-bold mb-2">
                Reset Your
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {" "}
                  Password
                </span>
              </h2>
              <p className="text-lg opacity-90 leading-relaxed">
                Don't worry! We'll help you get back into your account.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Form Section */}
        <div className="w-full lg:w-1/2 h-full flex flex-col p-4 overflow-y-auto relative">
          {/* Watermark Logo */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
            <Image
              src={"/iedc-logo.png"}
              alt="IEDC Logo"
              width={400}
              height={200}
              className="opacity-5"
            />
          </div>

          {/* Form Content */}
          <div className="relative z-10">
            <div className="flex justify-center items-center gap-3 mb-4">
              <Image
                src={"/iedc-logo.png"}
                alt="IEDC Logo"
                width={60}
                height={60}
                className=""
              />
              <span className="flex flex-col  ">
                <span className="text-xl font-bold ">
                  Innovation and Entrepreneurship
                </span>
                <span className="text-xl font-bold ">Development Cell</span>
              </span>
            </div>
            <Separator className="mb-3" />
            
            {/* Header & Logo */}
            <div className="flex flex-col items-center mb-8">
              <h1 className="text-3xl font-black text-slate-900">
                Forgot Password?
              </h1>
              <p className="text-slate-500 text-sm mt-1 text-center">
                Enter your email and we'll send you a link to reset your password.
              </p>
            </div>

            {!emailSent ? (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6 w-full max-w-md mx-auto"
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="name@example.com"
                            type="email"
                            className="bg-white/50"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white h-11 rounded-xl shadow-lg transition-all active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Send Reset Link
                  </Button>

                  <div className="text-center text-sm text-slate-600">
                    Remember your password?{" "}
                    <Link
                      href={"/signin"}
                      className="text-blue-600 font-semibold hover:underline"
                    >
                      Sign In
                    </Link>
                  </div>
                </form>
              </Form>
            ) : (
              <div className="w-full max-w-md mx-auto text-center space-y-6">
                <div className="flex justify-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-10 h-10 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    Check Your Email
                  </h3>
                  <p className="text-slate-600 text-sm">
                    We've sent a password reset link to your email address. Please check your inbox and follow the instructions.
                  </p>
                </div>
                <Button
                  onClick={() => router.push("/signin")}
                  variant="outline"
                  className="w-full"
                >
                  Back to Sign In
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
