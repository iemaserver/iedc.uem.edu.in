import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

// Admin view-only endpoint for students
export async function POST(req: NextRequest) {
  try {
   
    const {email,role} = await req.json();
    if (!email || !role) {
      return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
    }
    if(!Object.values(UserRole).includes(role)){
      return NextResponse.json({ error: "Invalid role" }, { status: 401 });
    }
    const user = await prisma.facultyUser.findUnique({
        where: { email: email },
    });
    if (user) {
      return NextResponse.json({ message: "Email is already in use in FacultyUser Table" },{ status: 409 });
    }
    await  prisma.facultyUser.create({
        data: {
          email,
            role,
        },
    });
    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    })
    if (existingUser) {
      if(role === UserRole.TEACHER){
        await prisma.user.update({
          where: { email: email },
          data: { role: UserRole.TEACHER  },
        });
        await prisma.teacherProfile.create({
          data: {
            userId: existingUser.id,
            department: "",
            designation: "",
            affiliation: "",
          },
        });
      }
    }
    return NextResponse.json({ message: "Faculty user created successfully" }, { status: 201 });

  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}



export async function GET(req: NextRequest) {
  try {
    const users = await prisma.facultyUser.findMany();
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching faculty users:", error);
    return NextResponse.json({ error: "Failed to fetch faculty users" }, { status: 500 });
  }
}


export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    await prisma.facultyUser.delete({
      where: { email: email },
    });
    return NextResponse.json({ message: "Faculty user deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting faculty user:", error);
    return NextResponse.json({ error: "Failed to delete faculty user" }, { status: 500 });
  }
}
export async function PATCH(req: NextRequest) {
  try {
    const { email, role } = await req.json();
    if (!email || !role) {
      return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
    }
    if (!Object.values(UserRole).includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 401 });
    }
    await prisma.facultyUser.update({
      where: { email: email },
      data: { role: role },
    });
    return NextResponse.json({ message: "Faculty user role updated successfully" }, { status: 200 });
  }
    catch (error) {
    console.error("Error updating faculty user:", error);
    return NextResponse.json({ error: "Failed to update faculty user" }, { status: 500 });
  }
}