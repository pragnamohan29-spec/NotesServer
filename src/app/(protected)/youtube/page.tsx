"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Youtube } from "lucide-react";
import ReactMarkdown from 'react-markdown';

type Summary = {
  id: string;
  videoUrl: string;
  summaryText: string;
  createdAt: string;
};

export default function YouTubePage() {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  
  // Form State
  const [videoUrl, setVideoUrl] = useState("");
  const [generating, setGenerating] = useState(false);

  const fetchSummaries = async () => {
    try {
      const res = await fetch("/api/youtube");
      if (res.ok) {
        const data = await res.json();
        setSummaries(data);
      }
    } catch (e) {
      toast.error("Failed to load summaries");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchSummaries();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl) return toast.error("Video URL is required");

    setGenerating(true);
    try {
      const res = await fetch("/api/youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl }),
      });
      
      if (res.ok) {
        toast.success("Summary generated!");
        setVideoUrl("");
        fetchSummaries();
      } else {
        const errorText = await res.text();
        toast.error(`Generation failed: ${errorText}`);
      }
    } catch (e) {
      toast.error("An error occurred");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Input Section */}
      <Card className="border-none shadow-xl shadow-red-500/10">
        <CardHeader className="bg-gradient-to-r from-red-50 to-white rounded-t-xl border-b pb-6">
          <div className="flex items-center gap-3">
             <div className="p-3 bg-red-100 rounded-lg">
                <Youtube className="w-6 h-6 text-red-600" />
             </div>
             <div>
               <CardTitle className="text-2xl">AI YouTube Summarizer</CardTitle>
               <CardDescription className="text-base mt-1">Paste any public YouTube URL to get key takeaways instantly.</CardDescription>
             </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleGenerate} className="flex gap-4 items-end">
            <div className="space-y-2 flex-1">
              <Label htmlFor="videoUrl">YouTube URL</Label>
              <Input 
                id="videoUrl" 
                value={videoUrl} 
                onChange={(e) => setVideoUrl(e.target.value)} 
                placeholder="https://www.youtube.com/watch?v=..." 
                className="h-12"
              />
            </div>
            <Button type="submit" className="h-12 px-8 bg-red-600 hover:bg-red-700" disabled={generating}>
              {generating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              Summarize Video
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* History Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Your Summaries</h2>
        {loadingList ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
          </div>
        ) : summaries.length === 0 ? (
          <Card className="bg-neutral-50/50 border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center h-48 text-center px-4">
              <Youtube className="w-10 h-10 text-neutral-300 mb-3" />
              <p className="text-neutral-500 font-medium">No summaries yet</p>
              <p className="text-sm text-neutral-400 mt-1">Generate your first AI summary above.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {summaries.map((summary) => (
              <Card key={summary.id} className="transition-all hover:shadow-md border-neutral-200/60 overflow-hidden">
                <CardHeader className="bg-neutral-50 border-b py-3">
                  <div className="flex justify-between items-center">
                    <a href={summary.videoUrl} target="_blank" className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1.5 truncate max-w-[60%]">
                      {summary.videoUrl}
                    </a>
                    <span className="text-xs text-neutral-400 font-medium">
                      {new Date(summary.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="prose prose-sm max-w-none prose-neutral text-sm">
                    <ReactMarkdown>{summary.summaryText}</ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
