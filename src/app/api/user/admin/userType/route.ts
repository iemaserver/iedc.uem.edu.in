import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Adjust import based on your prisma setup
import { UserType } from "@prisma/client";

// Update user type
export async function PATCH(req: NextRequest) {
  try {
    const { email, name, userType } = await req.json();

    if (!email  || !userType) {
      return NextResponse.json(
        { error: "Missing email, name or userType" },
        { status: 400 }
      );
    }

    if (!Object.values(UserType).includes(userType)) {
      return NextResponse.json(
        { error: "Invalid userType" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      await prisma.user.update({
        where: { email },
        data: { userType, name },
      });
    }

    // Check if userDetails exists
    const existingUserDetails = await prisma.userDetails.findUnique({
      where: { email },
    });

    if (!existingUserDetails) {
      return NextResponse.json(
        { error: "User not found in userDetails" },
        { status: 404 }
      );
    }

    const updatedUserDetails = await prisma.userDetails.update({
      where: { email },
      data: { userType, name },
    });

    return NextResponse.json({
      message: "User updated successfully",
      userDetails: updatedUserDetails,
    });
  } catch (error) {
    console.error("PATCH Error:", error);
    return NextResponse.json(
      { error: "Failed to update user type" },
      { status: 500 }
    );
  }
}


// Delete user and user details
export async function DELETE(req: NextRequest) {
  try {
    const { email } = await req.json();
    console.log("DELETE request received with email:", email);
    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }
    if (typeof email !== "string") {
await prisma.userDetails.delete({
      where: { email: email },
    });
    return NextResponse.json({ message: "User and user details deleted" });
    }
    if(Array.isArray(email)) {
      
      await prisma.user.deleteMany({
        where: { email: { in: email } },
      });
      return NextResponse.json({ message: "Users deleted successfully" });
    }

    // Delete user details first (assuming userDetails has userId as foreign key)
    
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const users = await prisma.userDetails.findMany();

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const {name, email, userType } = await req.json();
    if (!name || !email || !userType) {
      return NextResponse.json(
        { error: "Missing name, email or userType" },
        { status: 400 }
      );
    }
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });
    if (existingUser) {
      
      await prisma.user.update({
        where: { email: email },
        data: { userType: userType, name: name }, // Change 'userType' to the actual field name in your Prisma User model
      });
    }
    const existingUserDetails = await prisma.userDetails.findUnique({
      where: { email: email },
    });
    if (existingUserDetails) {
      return NextResponse.json(
        { error: "User already exists in userDetails Table" },
        { status: 400 }
      );
    }
    const newUser = await prisma.userDetails.create({
      data: {
        name: name,
        email: email,
        userType: userType, // Change 'userType' to the actual field name in your Prisma User model
      },
    });

    return NextResponse.json({ message: "User created", user: newUser });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}



