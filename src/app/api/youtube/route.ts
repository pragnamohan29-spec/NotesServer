import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { youtubeSummaries } from "@/db/schema";
import { v4 as uuidv4 } from "uuid";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { YoutubeTranscript } from "youtube-transcript";
import FirecrawlApp from "@mendable/firecrawl-js";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

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
    let isFallback = false;
    
    try {
      const transcriptOpts = await YoutubeTranscript.fetchTranscript(videoId);
      transcriptText = transcriptOpts.map((t) => t.text).join(" ");
    } catch (e: any) {
      console.log("Transcript unavailable, attempting fallback via Firecrawl:", e.message);
      
      try {
        // Fallback: Scrape the YouTube page for the description/metadata
        const scrapeResult = await firecrawl.scrape(videoUrl, {
          formats: ['markdown']
        }) as any;

        if (scrapeResult.success && scrapeResult.markdown) {
          transcriptText = scrapeResult.markdown;
          isFallback = true;
        }
      } catch (scrapeError: any) {
        console.error("Firecrawl fallback failed:", scrapeError.message);
      }
    }

    if (!transcriptText || transcriptText.trim().length === 0) {
       return new NextResponse("Could not obtain content (transcript or description) for this video. It might be private or unavailable.", { status: 400 });
    }

    // Call AI to Summarize
    const { text: summaryText } = await generateText({
      model: openrouter("google/gemini-1.5-flash"),
      prompt: isFallback 
        ? `The following is a markdown scrape of a YouTube video page (including title and description metadata). Based STRICTLY on this metadata, provide a concise summary of what the video is about and any key takeaways listed in the description. Note that this is based on metadata, not a transcript.\n\nContent:\n${transcriptText.substring(0, 15000)}`
        : `Summarize the following YouTube video transcript in a concise, well-structured manner with bullet points. Focus on the main ideas and actionable takeaways.\n\nTranscript: ${transcriptText.substring(0, 20000)}`,
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
