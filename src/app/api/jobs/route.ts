import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { jobSearches } from "@/db/schema";
import { v4 as uuidv4 } from "uuid";
import FirecrawlApp from "@mendable/firecrawl-js";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

export async function POST(req: Request) {
  try {
    const { userId } = getAuth(req as any);
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { query } = await req.json();

    if (!query) {
      return new NextResponse("Search query is required", { status: 400 });
    }

    // Use firecrawl to search Google/web for job postings based on the query
    console.log("Searching Firecrawl for:", query);
    const searchResult = await firecrawl.search(query, {
      limit: 4,
      scrapeOptions: { formats: ['markdown'] }
    }) as any;

    if (!searchResult.data) {
       console.error("Firecrawl Error:", searchResult);
       return new NextResponse("Failed to fetch jobs.", { status: 500 });
    }

    // Gather concatenated markdown text from the top results
    const combinedMarkdown = searchResult.data
      .map((d: any) => `Source: ${d.url}\n\n${d.markdown?.substring(0, 3000) || d.title}`)
      .join("\n\n---\n\n");

    // Use Gemini to structure the messy markdown into clean JSON job objects
    const { text: structuredJobsJson } = await generateText({
      model: google("gemini-2.5-flash"),
      prompt: `Extract job postings from the following scraped search results.
Return ONLY a valid JSON array of objects with the following schema:
[
  {
    "title": "Job Title",
    "company": "Company Name",
    "location": "Location (Remote/City)",
    "url": "Application or source URL",
    "summary": "1 sentence description of the role"
  }
]
If you cannot find any jobs, return an empty array [].
Do NOT include markdown formatting (like \`\`\`json) in your response, just the raw JSON text.

Search Results Markdown:
${combinedMarkdown.substring(0, 15000)}`,
    });

    let resultsData = [];
    try {
      // clean up any potential markdown blocks Gemini might have added
      const cleanJson = structuredJobsJson.replace(/```json/g, '').replace(/```/g, '').trim();
      resultsData = JSON.parse(cleanJson);
    } catch (e) {
      console.error("Failed to parse Gemini output into JSON:", structuredJobsJson);
      // Fallback to storing raw output if json parsing fails
      resultsData = [{ title: "Error parsing AI response", company: "System", location: "N/A", summary: structuredJobsJson, url: "#" }];
    }

    const searchId = uuidv4();

    await db.insert(jobSearches).values({
      id: searchId,
      userId,
      query,
      resultsData: JSON.stringify(resultsData),
    });

    return NextResponse.json({ id: searchId, results: resultsData }, { status: 201 });
  } catch (error) {
    console.error("[JOBS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = getAuth(req as any);
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const searches = await db.query.jobSearches.findMany({
      where: (searches, { eq }) => eq(searches.userId, userId),
      orderBy: (searches, { desc }) => [desc(searches.createdAt)],
    });

    return NextResponse.json(searches);
  } catch (error) {
    console.error("[JOBS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
