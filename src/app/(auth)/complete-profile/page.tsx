"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { TeacherProfileForm } from "@/components/auth/TeacherProfileForm";
import { StudentProfileForm } from "@/components/auth/StudentProfileForm";
import { Icons } from "@/components/ui/icons";

export default function CompleteProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkProfileStatus = async () => {
      if (status === "loading") return;

      if (status === "unauthenticated") {
        router.push("/signup");
        return;
      }

      if (session?.user) {
        // Check if user has a profile
        try {
          const response = await fetch("/api/profile/check");
          const data = await response.json();

          if (data.hasProfile) {
            // Profile exists, redirect to dashboard
            router.push("/dashboard");
          } else {
            // No profile, show the form
            setIsChecking(false);
          }
        } catch (error) {
          console.error("Error checking profile:", error);
          setIsChecking(false);
        }
      }
    };

    checkProfileStatus();
  }, [session, status, router]);

  if (status === "loading" || isChecking) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-linear-to-br from-(--first-color) via-(--second-color) to-(--third-color)">
        <div className="text-center">
          <Icons.spinner className="w-12 h-12 animate-spin text-white mx-auto mb-4" />
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  const userRole = session?.user?.role;

  return (
    <div className='w-screen h-screen bg-[url("/auth-bg.jpg")] bg-cover bg-center flex justify-center items-center lg:p-12 md:p-6 p-4 font-sans'>
      <div className="w-full max-w-6xl h-full flex rounded-3xl overflow-hidden shadow-2xl bg-white/80 backdrop-blur-md border border-white/20">
        {/* Left Side: Visual Section with animated background */}
        <div className="relative hidden lg:block lg:w-1/2 h-full p-4">
          <div className="relative h-full w-full rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--first-color)] via-[var(--second-color)] to-[var(--third-color)]">
              {/* Animated background elements */}
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

            <div className="absolute inset-0 flex items-center justify-center p-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="text-center text-white"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm mb-4 shadow-lg">
                  <svg
                    className="w-10 h-10"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h2 className="text-4xl font-bold mb-4">
                  {userRole === "TEACHER" ? "Complete Your Faculty Profile" : "Complete Your Student Profile"}
                </h2>
                <p className="text-lg opacity-90">
                  {userRole === "TEACHER" 
                    ? "Help us know you better by completing your faculty profile" 
                    : "Tell us about yourself to personalize your experience"}
                </p>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Right Side: Form Section */}
        <div className="w-full lg:w-1/2 h-full flex flex-col p-4 overflow-y-auto relative bg-gradient-to-br from-[var(--first-color)] via-[var(--second-color)] to-[var(--third-color)]">
          {/* Render appropriate form based on role */}
          {userRole === "TEACHER" && (
            <TeacherProfileForm userId={session?.user?.id || ""} />
          )}
          {userRole === "STUDENT" && (
            <StudentProfileForm userId={session?.user?.id || ""} />
          )}
          {userRole === "ADMIN" && (
            <div className="flex flex-col items-center justify-center h-full text-center text-white">
              <p className="text-xl mb-6">Admin users don't need to complete a profile.</p>
              <button
                onClick={() => router.push("/dashboard")}
                className="px-6 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl font-semibold hover:bg-white/30 transition-all"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
