import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { youtubeSummaries } from "@/db/schema";
import { v4 as uuidv4 } from "uuid";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { YoutubeTranscript } from "youtube-transcript";

export async function POST(req: Request) {
  try {
    const { userId } = getAuth(req as any);
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { videoUrl } = await req.json();

    if (!videoUrl || !videoUrl.includes("youtube.com")) {
      return new NextResponse("Valid YouTube URL is required", { status: 400 });
    }

    // Attempt to fetch transcript
    let transcriptText = "";
    try {
      const transcriptOpts = await YoutubeTranscript.fetchTranscript(videoUrl);
      transcriptText = transcriptOpts.map((t) => t.text).join(" ");
    } catch (e: any) {
      console.log("Could not fetch transcript:", e.message);
      return new NextResponse("Could not fetch transcript for this video. Make sure it has captions enabled.", { status: 400 });
    }

    if (!transcriptText) {
       return new NextResponse("Empty transcript obtained.", { status: 400 });
    }

    // Call Gemini to Summarize
    const { text: summaryText } = await generateText({
      model: google("gemini-2.5-flash"),
      prompt: `Summarize the following YouTube video transcript in a concise, well-structured manner with bullet points. Focus on the main ideas and actionable takeaways.\n\nTranscript: ${transcriptText.substring(0, 15000)}`, // limit chars to avoid token limit
    });

    const newSummaryId = uuidv4();

    await db.insert(youtubeSummaries).values({
      id: newSummaryId,
      userId,
      videoUrl,
      summaryText,
    });

    return NextResponse.json({ id: newSummaryId, summaryText }, { status: 201 });
  } catch (error) {
    console.error("[YOUTUBE_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = getAuth(req as any);
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const summaries = await db.query.youtubeSummaries.findMany({
      where: (summaries, { eq }) => eq(summaries.userId, userId),
      orderBy: (summaries, { desc }) => [desc(summaries.createdAt)],
    });

    return NextResponse.json(summaries);
  } catch (error) {
    console.error("[YOUTUBE_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
