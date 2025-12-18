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

const verifySchema = z.object({
  token: z.string().min(6, "Verification code must be 6 digits"),
});

type VerifyFormValues = z.infer<typeof verifySchema>;

const VerifyPage = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [verifySuccess, setVerifySuccess] = React.useState(false);
  const router = useRouter();

  const form = useForm<VerifyFormValues>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      token: "",
    },
  });

  const onSubmit = async (data: VerifyFormValues) => {
    setIsLoading(true);
    try {
      const response = await axios.post("/api/auth/verify-email", {
        token: data.token.trim(),
      });

      toast.success("Email verified successfully!");
      setVerifySuccess(true);
      setTimeout(() => {
        router.push("/complete-profile");
      }, 2000);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Verification failed!");
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
              alt="Verify Email"
              fill
              className="object-cover transition-transform duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            <div
              className={`${quintessential.className} absolute bottom-12 left-8 right-8 text-white`}
            >
              <h2 className="text-4xl font-bold mb-2">
                Verify Your
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {" "}
                  Email
                </span>
              </h2>
              <p className="text-lg opacity-90 leading-relaxed">
                We've sent a verification code to your email address.
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
                Verify Your Email
              </h1>
              <p className="text-slate-500 text-sm mt-1 text-center">
                Enter the 6-digit code we sent to your email address.
              </p>
            </div>

            {!verifySuccess ? (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6 w-full max-w-md mx-auto"
                >
                  <FormField
                    control={form.control}
                    name="token"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Verification Code</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="123456"
                            type="text"
                            maxLength={6}
                            className="bg-white/50 text-center text-2xl tracking-widest"
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
                    Verify Email
                  </Button>

                  <div className="text-center text-sm text-slate-600">
                    Didn't receive the code?{" "}
                    <button
                      type="button"
                      className="text-blue-600 font-semibold hover:underline"
                      onClick={() => toast.success("Resend feature coming soon!")}
                    >
                      Resend
                    </button>
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
                    Email Verified!
                  </h3>
                  <p className="text-slate-600 text-sm">
                    Your email has been successfully verified. Redirecting to complete your profile...
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyPage;