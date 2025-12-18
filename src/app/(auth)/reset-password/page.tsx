"use client";

import Image from "next/image";
import React, { Suspense } from "react";
import { Quintessential } from "next/font/google";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { IconEyeOff, IconEye } from "@tabler/icons-react";
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
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { Icons } from "@/components/ui/icons";

const quintessential = Quintessential({
  subsets: ["latin"],
  weight: "400",
  variable: "--quintessential-font",
});

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [resetSuccess, setResetSuccess] = React.useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!token) {
      toast.error("Invalid reset link");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post("/api/auth/reset-password", {
        token: token,
        password: data.password,
      });

      toast.success("Password reset successfully!");
      setResetSuccess(true);
      setTimeout(() => {
        router.push("/signin");
      }, 2000);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Something went wrong!");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="w-full max-w-md mx-auto text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            Invalid Reset Link
          </h3>
          <p className="text-slate-600 text-sm">
            This password reset link is invalid or has expired.
          </p>
        </div>
        <Button onClick={() => router.push("/forgot-password")} className="w-full">
          Request New Link
        </Button>
      </div>
    );
  }

  return (
    <>
      {!resetSuccess ? (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 w-full max-w-md mx-auto"
          >
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="bg-white/50 pr-10"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                      >
                        {showPassword ? (
                          <IconEyeOff className="h-4 w-4" />
                        ) : (
                          <IconEye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="bg-white/50 pr-10"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                      >
                        {showConfirmPassword ? (
                          <IconEyeOff className="h-4 w-4" />
                        ) : (
                          <IconEye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
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
              Reset Password
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
              Password Reset Successful!
            </h3>
            <p className="text-slate-600 text-sm">
              Your password has been successfully reset. Redirecting to sign in...
            </p>
          </div>
        </div>
      )}
    </>
  );
}

const ResetPassword = () => {
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
                Create a New
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {" "}
                  Password
                </span>
              </h2>
              <p className="text-lg opacity-90 leading-relaxed">
                Choose a strong password to secure your account.
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
                Reset Password
              </h1>
              <p className="text-slate-500 text-sm mt-1 text-center">
                Enter your new password below.
              </p>
            </div>

            <Suspense fallback={<div>Loading...</div>}>
              <ResetPasswordForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
