"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/ui/icons";
import { toast } from "react-hot-toast";
import Link from "next/link";

type AuthMode = "signin" | "signup";

function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<AuthMode>("signin");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });

  const error = searchParams.get("error");

  // Redirect if already authenticated (middleware will handle profile check)
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("google", { 
        callbackUrl: "/dashboard",
        redirect: true
      });
    } catch (error) {
      toast.error("Failed to sign in with Google");
      setIsLoading(false);
    }
  };

  const handleCredentialAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "signup") {
        // Register new user
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to create account");
        }

        toast.success("Account created! Please sign in.");
        // Sign in the user after successful registration
        const result = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (result?.error) {
          throw new Error(result.error);
        }

        // Redirect to dashboard (middleware will handle profile completion)
        router.push("/dashboard");
      } else {
        // Sign in existing user
        const result = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (result?.error) {
          throw new Error(result.error);
        }

        toast.success("Welcome back!");
        router.push("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Main auth page
  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-[var(--first-color)] via-[var(--second-color)] to-[var(--third-color)]">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute w-96 h-96 bg-[var(--third-color)] rounded-full blur-3xl opacity-20"
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ top: "10%", left: "10%" }}
        />
        <motion.div
          className="absolute w-96 h-96 bg-[var(--forth-color)] rounded-full blur-3xl opacity-20"
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ bottom: "10%", right: "10%" }}
        />
      </div>

      {/* Auth Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Header */}
          <div className="p-8 pb-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[var(--third-color)] to-[var(--forth-color)] mb-4 shadow-lg"
            >
              <svg
                className="w-10 h-10 text-[var(--first-color)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {mode === "signin" ? "Welcome Back" : "Get Started"}
            </h1>
            <p className="text-[var(--forth-color)] text-sm">
              {mode === "signin"
                ? "Sign in to continue your journey"
                : "Create your account to begin"}
            </p>
          </div>

          {/* Form */}
          <div className="p-8 pt-0">
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm"
              >
                {error === "OAuthAccountNotLinked"
                  ? "Email already exists with different provider"
                  : "Authentication failed. Please try again."}
              </motion.div>
            )}

            <form onSubmit={handleCredentialAuth} className="space-y-4">
              <AnimatePresence mode="wait">
                {mode === "signup" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Label htmlFor="name" className="text-white text-sm font-medium">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[var(--third-color)] focus:ring-[var(--third-color)]"
                      required={mode === "signup"}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <Label htmlFor="email" className="text-white text-sm font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[var(--third-color)] focus:ring-[var(--third-color)]"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-white text-sm font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[var(--third-color)] focus:ring-[var(--third-color)]"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[var(--third-color)] to-[var(--forth-color)] hover:from-[var(--forth-color)] hover:to-[var(--third-color)] text-[var(--first-color)] font-semibold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <Icons.spinner className="mr-2 h-5 w-5 animate-spin" />
                ) : mode === "signin" ? (
                  "Sign In"
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-transparent text-white/60">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full bg-white/10 hover:bg-white/20 border-white/20 text-white py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
            >
              <Icons.google className="w-5 h-5 mr-2" />
              Continue with Google
            </Button>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                className="text-sm text-[var(--forth-color)] hover:text-white transition-colors duration-200"
              >
                {mode === "signin" ? (
                  <>
                    Don't have an account?{" "}
                    <span className="font-semibold underline">Sign up</span>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <span className="font-semibold underline">Sign in</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/60 text-xs mt-6">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-white">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-white">
            Privacy Policy
          </Link>
        </p>
      </motion.div>
    </div>
  );
}



export default function SignUpPage (){
  return(
    <Suspense>
    <AuthPage />
    </Suspense>
  )
}