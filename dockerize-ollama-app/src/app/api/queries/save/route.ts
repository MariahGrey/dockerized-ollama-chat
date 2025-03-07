import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { text, response } = await request.json();

    if (!text || !response) {
      return NextResponse.json(
        { error: "Query text and response are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const query = await prisma.query.create({
      data: {
        text,
        response,
        userId: user.id,
      },
    });

    return NextResponse.json({ query }, { status: 201 });
  } catch (error) {
    console.error("Error saving query:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
