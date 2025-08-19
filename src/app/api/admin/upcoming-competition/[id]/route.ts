// app/api/upcoming-competitions/[id]/route.ts

import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

import { z } from 'zod';


// Zod schema for updating an upcoming competition (all fields optional for partial updates)
const updateUpcomingCompetitionSchema = z.object({
  title: z.string().min(1, "Title cannot be empty").optional(),
  description: z.string().optional(),
  startDate: z.string().datetime("Invalid start date format (ISO 8601 expected)").transform(str => new Date(str)).optional(),
  endDate: z.string().datetime("Invalid end date format (ISO 8601 expected)").transform(str => new Date(str)).optional(),
  location: z.string().optional(),
  organizer: z.string().optional(),
  prizeDetails: z.string().optional(),
  registrationLink: z.string().url("Invalid registration link URL").optional(),
  isPublished: z.boolean().optional(),
}).refine(data => {
  if (data.endDate && data.startDate && data.endDate < data.startDate) {
    return false; // endDate cannot be before startDate
  }
  return true;
}, {
  message: "End date cannot be before start date",
  path: ["endDate"],
});


export async function GET(
  request: NextRequest, 
   context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ message: "Competition ID is required" }, { status: 400 });
    }

    const competition = await prisma.upcomingCompetition.findUnique({
      where: { id: id },
    });

    if (!competition) {
      return NextResponse.json({ message: "Upcoming competition not found" }, { status: 404 });
    }

    return NextResponse.json(competition);

  } catch (error) {
    console.error("Error fetching upcoming competition:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest, 
 context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ message: "Competition ID is required" }, { status: 400 });
    }
    const body = await request.json();
    const parsedData = updateUpcomingCompetitionSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json({ 
        message: "Invalid input for update", 
        errors: parsedData.error.format() 
      }, { status: 400 });
    }

    const updatedCompetition = await prisma.upcomingCompetition.update({
      where: { id: id },
      data: parsedData.data,
    });

    return NextResponse.json(updatedCompetition);

  } catch (error) {
    console.error("Error updating upcoming competition:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest, 
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ message: "Competition ID is required" }, { status: 400 });
    }

    await prisma.upcomingCompetition.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: "Upcoming competition deleted successfully" }, { status: 204 });

  } catch (error) {
    console.error("Error deleting upcoming competition:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}