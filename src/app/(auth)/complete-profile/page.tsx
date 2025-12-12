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
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[var(--first-color)] via-[var(--second-color)] to-[var(--third-color)]">
        <div className="text-center">
          <Icons.spinner className="w-12 h-12 animate-spin text-white mx-auto mb-4" />
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  const userRole = session?.user?.role;

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

      {/* Profile completion card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-4xl mx-4"
      >
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
          <div className="text-center mb-8">
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {userRole === "TEACHER" ? "Complete Your Faculty Profile" : "Complete Your Student Profile"}
            </h1>
            <p className="text-[var(--forth-color)]">
              {userRole === "TEACHER" 
                ? "Help us know you better by completing your faculty profile" 
                : "Tell us about yourself to personalize your experience"}
            </p>
          </div>

          {/* Render appropriate form based on role */}
          {userRole === "TEACHER" && (
            <TeacherProfileForm userId={session?.user?.id || ""} />
          )}
          {userRole === "STUDENT" && (
            <StudentProfileForm userId={session?.user?.id || ""} />
          )}
          {userRole === "ADMIN" && (
            <div className="text-center text-white">
              <p>Admin users don't need to complete a profile.</p>
              <button
                onClick={() => router.push("/dashboard")}
                className="mt-4 px-6 py-3 bg-gradient-to-r from-[var(--third-color)] to-[var(--forth-color)] rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
