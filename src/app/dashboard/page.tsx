"use client";

import { DynamicGrowthChart } from "@/components/charts/dynamic-growth-chart";
import { DashboardTable } from "@/components/dashboard/dashboard-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Student, Teacher } from "@prisma/client";
import axios from "axios";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

interface ExtendedUser {
  id?: string;
  email?: string;
  image?: string;
  fullName?: string;
  userType?: "STUDENT" | "TEACHER" | "ADMIN";
  studentProfile?: Student;
  teacherProfile?: Teacher;
}

export default function Page() {
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState<ExtendedUser | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (session?.user?.email) {
        try {
          // First try to get user as STUDENT
          let res = await axios.get(
            `/api/general/user?email=${session.user.email}&userType=STUDENT`
          );
          
          if (res.data.data && res.data.data.length > 0) {
            setUserData(res.data.data[0]);
            return;
          }

          // If not found as student, try TEACHER
          res = await axios.get(
            `/api/general/user?email=${session.user.email}&userType=TEACHER`
          );
          
          if (res.data.data && res.data.data.length > 0) {
            setUserData(res.data.data[0]);
            return;
          }

          // If not found as teacher, try ADMIN
          res = await axios.get(
            `/api/general/user?email=${session.user.email}&userType=ADMIN`
          );
          
          if (res.data.data && res.data.data.length > 0) {
            setUserData(res.data.data[0]);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };
    fetchData();
  }, [session]);

  if (status === "loading") return <div>Loading...</div>;
  if (status === "unauthenticated") return <div>Unauthorized</div>;
  if (!session) return <div>Please sign in to access this page</div>;

  return (
    <>
      <Toaster position="top-right" />
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 items-stretch">
        
        {/* Profile Card */}
        <Card className="flex flex-col justify-center items-center text-center p-6 h-full">
          <div className="w-32 h-32 mb-4">
            <Image
              src={session.user.image || "/default-avatar.png"}
              alt={userData?.fullName || "Profile Image"}
              height={100}
              width={100}
              className="rounded-full object-cover w-full h-full"
            />
          </div>
          <CardContent className="p-0 space-y-2 w-full">
            <div className=" flex justify-between w-full items-center">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-semibold text-xs">{userData?.email || session.user.email}</p>
            </div>
            <div className=" flex justify-between w-full items-center">
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-semibold text-xs">{userData?.fullName || session.user.fullName}</p>
            </div>
            <div className="flex justify-between w-full items-center">
              <p className="text-sm text-muted-foreground">User Type</p>
              <Badge variant="secondary">{userData?.userType}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Student/Teacher/Admin Details Card */}
        <Card className="p-6 h-full flex flex-col justify-center">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-lg text-center">Details</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col justify-center">
            {userData?.studentProfile && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Roll Number:</span>
                  <span className="font-semibold">{userData.studentProfile.rollNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Section:</span>
                  <span className="font-semibold">{userData.studentProfile.section}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Year:</span>
                  <span className="font-semibold">{userData.studentProfile.year}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Batch:</span>
                  <span className="font-semibold">{userData.studentProfile.batch}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Department:</span>
                  <span className="font-semibold">{userData.studentProfile.department}</span>
                </div>
              </div>
            )}
            {userData?.teacherProfile && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Affiliation:</span>
                  <span className="font-semibold">{userData.teacherProfile.affiliation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Designation:</span>
                  <span className="font-semibold">{userData.teacherProfile.designation}</span>
                </div>
                {userData.teacherProfile.subjectOfInterest && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Subject:</span>
                    <span className="font-semibold text-xs">{userData.teacherProfile.subjectOfInterest}</span>
                  </div>
                )}
              </div>
            )}
            {userData?.userType === 'ADMIN' && !userData?.studentProfile && !userData?.teacherProfile && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Role:</span>
                  <span className="font-semibold">Administrator</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Access Level:</span>
                  <span className="font-semibold">Full System Access</span>
                </div>
                <div className="text-center mt-4">
                  <p className="text-xs text-muted-foreground">
                    Manage users, content, and system settings
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Big Card spanning 2 columns */}
        <div className=" h-full flex flex-col md:col-span-2 lg:col-span-2 justify-center items-center">
          <DynamicGrowthChart />
        </div>
      </div>
      
      {/* Dashboard Table Section */}
      <div className="mt-8">
        {userData?.userType && userData?.id && (
          <DashboardTable 
            userRole={userData.userType} 
            userId={userData.id} 
          />
        )}
      </div>
      <Toaster position="top-right" />
    </>
  );
}
