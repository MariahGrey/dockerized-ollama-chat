import { PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    console.log("Starting signup process...");
    const { name, email, password } = await request.json();

    console.log("Received signup data:", {
      name,
      email,
      passwordLength: password?.length,
    });

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log("User already exists:", email);
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Create new user
    console.log("Creating new user...");
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password,
      },
    });

    console.log("User created successfully:", {
      id: user.id,
      email: user.email,
    });

    return NextResponse.json(
      { message: "User created successfully" },
      { status: 201 }
    );
  } catch (error) {
    // More detailed error logging
    console.error("Detailed signup error:", {
      name: (error as Error).name,
      message: (error as Error).message,
      stack: (error as Error).stack,
    });

    // Check for specific Prisma errors
    if (error instanceof PrismaClientKnownRequestError) {
      return NextResponse.json(
        { error: "Database error occurred" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Something went wrong during signup" },
      { status: 500 }
    );
  }
}
