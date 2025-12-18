"use client";

import Image from "next/image";
import React from "react";
import { Quintessential } from "next/font/google";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { IconBrandGoogle, IconEyeOff, IconEye } from "@tabler/icons-react";
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
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Icons } from "@/components/ui/icons";

const quintessential = Quintessential({
  subsets: ["latin"],
  weight: "400",
  variable: "--quintessential-font",
});

const signinSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignInFormValues = z.infer<typeof signinSchema>;

const SignIn = () => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signinSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignInFormValues) => {
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Signed in successfully!");
        
        // Check if user needs to verify email
        const userResponse = await axios.get("/api/profile/check");
        if (!userResponse.data.emailVerified) {
          router.push("/verify");
        } else if (!userResponse.data.hasProfile) {
          router.push("/complete-profile");
        } else {
          router.push("/dashboard");
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Something went wrong!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (error) {
      toast.error("Failed to sign in with Google");
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
              alt="Sign Up Image"
              fill
              className="object-cover transition-transform duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            <div
              className={`${quintessential.className} absolute bottom-12 left-8 right-8 text-white`}
            >
              <h2 className="text-4xl font-bold mb-2">
                Welcome Back to Our
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {" "}
                  Community
                </span>
              </h2>
             
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
                <Image src={"/iedc-logo.png"} alt="IEDC Logo" width={60} height={60} className=""/>
                <span className="flex flex-col  ">

                <span className="text-xl font-bold ">Innovation and Entrepreneurship</span>
                <span className="text-xl font-bold ">Development Cell</span>
                </span>
            </div>
           <Separator className="mb-3"/>
            {/* Header & Logo */}
            <div className="flex flex-col items-center mb-8">
              <h1 className="text-3xl font-black text-slate-900">
         Welcome Back
              </h1>
              <p className="text-slate-500 text-sm mt-1">
          Restart your journey with us.
              </p>
            </div>

            {/* Input Fields */}
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

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
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

                <div className="flex justify-end">
                  <Link
                    href="/forgot-password"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white h-11 rounded-xl shadow-lg transition-all active:scale-[0.98]"
                >
                  {isLoading ? (
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Sign In
                </Button>

                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white/0 px-2 text-slate-500 backdrop-blur-sm">
                      Or continue with
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  variant="outline"
                  className="h-11 w-full rounded-xl border-slate-200 hover:bg-slate-50 my-5"
                >
                  <IconBrandGoogle className="mr-2 h-4 w-4" /> Google
                </Button>

                <div className="text-center text-sm text-slate-600">
                  No Account in IEDC?{" "}
                  <Link
                    href={"/signup"}
                    className="text-blue-600 font-semibold hover:underline"
                  >
                    Sign Up
                  </Link>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
