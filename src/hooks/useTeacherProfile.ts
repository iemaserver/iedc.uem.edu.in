"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export function useTeacherProfile() {
  const { data: session } = useSession();
  const [teacherProfile, setTeacherProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch teacher list to get current user's teacher profile
        const response = await fetch("/api/teacher");
        const data = await response.json();
        
        // Find the teacher profile for current user
        const profile = data.data?.find(
          (teacher: any) => teacher.userId === session.user.id
        );
        
        setTeacherProfile(profile);
      } catch (err) {
        setError("Failed to fetch teacher profile");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [session?.user?.id]);

  return { teacherProfile, isLoading, error };
}
