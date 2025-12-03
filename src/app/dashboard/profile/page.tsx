"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      router.push("/signup");
      return;
    }

    // Redirect based on user role
    const role = session.user.role;
    if (role === "STUDENT") {
      router.push("/dashboard/profile/student");
    } else if (role === "TEACHER") {
      router.push("/dashboard/profile/teacher");
    } else if (role === "ADMIN") {
      router.push("/dashboard/profile/admin");
    } else {
      // Fallback
      router.push("/dashboard");
    }
  }, [session, status, router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading your profile...</p>
      </div>
    </div>
  );
}
