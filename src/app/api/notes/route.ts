import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { notes } from "@/db/schema";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
    const { userId } = getAuth(req as any);
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { title, content, attachmentUrl } = body;

    if (!title) {
      return new NextResponse("Title is required", { status: 400 });
    }

    const newNoteId = uuidv4();

    await db.insert(notes).values({
      id: newNoteId,
      userId,
      title,
      content,
      attachmentUrl,
    });

    return NextResponse.json({ id: newNoteId }, { status: 201 });
  } catch (error) {
    console.error("[NOTES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = getAuth(req as any);
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userNotes = await db.query.notes.findMany({
      where: (notes, { eq }) => eq(notes.userId, userId),
      orderBy: (notes, { desc }) => [desc(notes.createdAt)],
    });

    return NextResponse.json(userNotes);
  } catch (error) {
    console.error("[NOTES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
