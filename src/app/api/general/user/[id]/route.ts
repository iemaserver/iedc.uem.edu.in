// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";

import { z } from 'zod';
import prisma from "@/lib/prisma";


// Define Zod schemas for validation
const userUpdateSchema = z.object({
  fullName: z.string().optional(),
  image: z.string().optional(),
  
});

const studentUpdateSchema = z.object({
  section: z.string().optional(),
  year: z.number().int().optional(),
  batch: z.string().optional(),
  department: z.string().optional(),
  rollNumber: z.string().optional(),
});

const teacherUpdateSchema = z.object({
  affiliation: z.string().optional(),
  designation: z.string().optional(),
  subjectOfInterest: z.string().optional(),
  officialMail: z.string().email().optional(),
  address: z.string().optional(),
});

export async function PUT(
  request: NextRequest, 
   context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    // Find the user to get their userType
    const user = await prisma.user.findUnique({
      where: { id: id },
      include: {
        studentProfile: true,
        teacherProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Validate and update base User model
    const parsedUser = userUpdateSchema.safeParse(body);
    if (parsedUser.success) {
      await prisma.user.update({
        where: { id: id },
        data: parsedUser.data,
      });
    }

    // Conditionally validate and update the specific profile
    if (user.userType === "STUDENT") {
      const parsedStudent = studentUpdateSchema.safeParse(body);
      if (parsedStudent.success && user.studentProfile) {
        await prisma.student.update({
          where: { userId: id },
          data: parsedStudent.data,
        });
      }
    } else if (user.userType === "TEACHER") {
      const parsedTeacher = teacherUpdateSchema.safeParse(body);
      if (parsedTeacher.success && user.teacherProfile) {
        await prisma.teacher.update({
          where: { userId: id },
          data: parsedTeacher.data,
        });
      }
    }
    
    return NextResponse.json({ message: "User updated successfully" }, { status: 200 });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}