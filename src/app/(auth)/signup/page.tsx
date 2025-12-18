"use client";

import Image from "next/image";
import React from "react";
import { Quintessential } from "next/font/google";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
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

const signupSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignUpFormValues = z.infer<typeof signupSchema>;

const SignUp = () => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      termsAccepted: false,
    },
  });

  const onSubmit = async (data: SignUpFormValues) => {
    setIsLoading(true);
    try {
      const response = await axios.post("/api/auth/signup", {
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        password: data.password,
      });

      toast.success("Account created successfully! Please verify your email.");
      router.push("/verify");
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
                Join Our
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {" "}
                  Community
                </span>
              </h2>
              <p className="text-lg opacity-90 leading-relaxed">
                Connect with the Innovation and Entrepreneurship Development
                Cell and turn your ideas into reality.
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
           
            {/* Header & Logo */}
            <div className="flex flex-col items-center mb-8">
              <h1 className="text-3xl font-black text-slate-900">
          Create an Account
              </h1>
              <p className="text-slate-500 text-sm mt-1">
          Start your journey with us today.
              </p>
            </div>

            {/* Input Fields */}
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-3 w-full max-w-md mx-auto"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="John"
                            type="text"
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
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Doe"
                            type="text"
                            className="bg-white/50"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
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

                <FormField
                  control={form.control}
                  name="termsAccepted"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-2 space-y-0 py-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-xs text-slate-500 cursor-pointer">
                          I agree to the{" "}
                          <span className="text-blue-600 underline">
                            Terms of Service
                          </span>{" "}
                          and{" "}
                          <span className="text-blue-600 underline">
                            Privacy Policy
                          </span>
                          .
                        </FormLabel>
                        <FormMessage />
                      </div>
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
                  Create Account
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
                  Already have an account?{" "}
                  <Link
                    href={"/signin"}
                    className="text-blue-600 font-semibold hover:underline"
                  >
                    Sign In
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

export default SignUp;
