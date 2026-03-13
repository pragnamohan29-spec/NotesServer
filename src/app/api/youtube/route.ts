import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { youtubeSummaries } from "@/db/schema";
import { v4 as uuidv4 } from "uuid";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { YoutubeTranscript } from "youtube-transcript";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { videoUrl } = await req.json();

    // Extract video ID for better compatibility
    const getYouTubeID = (url: string) => {
      const regl = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
      const match = url.match(regl);
      return match?.[1];
    };

    const videoId = getYouTubeID(videoUrl);
    if (!videoId) {
      return new NextResponse("Could not extract a valid YouTube video ID.", { status: 400 });
    }

    // Attempt to fetch transcript
    let transcriptText = "";
    try {
      // Use video ID directly for more reliability
      const transcriptOpts = await YoutubeTranscript.fetchTranscript(videoId);
      transcriptText = transcriptOpts.map((t) => t.text).join(" ");
    } catch (e: any) {
      console.log("Could not fetch transcript:", e.message);
      return new NextResponse("Could not fetch transcript. The video might be private, unavailable, or have captions disabled.", { status: 400 });
    }

    if (!transcriptText || transcriptText.trim().length === 0) {
       return new NextResponse("No transcript found for this video. Please try a video with English captions enabled.", { status: 400 });
    }

    // Call Gemini to Summarize
    const { text: summaryText } = await generateText({
      model: google("gemini-1.5-flash"),
      prompt: `Summarize the following YouTube video transcript in a concise, well-structured manner with bullet points. Focus on the main ideas and actionable takeaways.\n\nTranscript: ${transcriptText.substring(0, 20000)}`, // increased limit slightly
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
    const { userId } = await auth();
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
