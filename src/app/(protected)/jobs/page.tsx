"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Briefcase, MapPin, Building2, ExternalLink } from "lucide-react";

type Job = {
  title: string;
  company: string;
  location: string;
  url: string;
  summary: string;
};

type JobSearch = {
  id: string;
  query: string;
  resultsData: string; // JSON string
  createdAt: string;
};

export default function JobSearchPage() {
  const [searches, setSearches] = useState<JobSearch[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  
  const [query, setQuery] = useState("");
  const [generating, setGenerating] = useState(false);

  const fetchSearches = async () => {
    try {
      const res = await fetch("/api/jobs");
      if (res.ok) {
        const data = await res.json();
        setSearches(data);
      }
    } catch (e) {
      toast.error("Failed to load searches");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchSearches();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return toast.error("Search query is required");

    setGenerating(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      
      if (res.ok) {
        toast.success("Jobs found!");
        setQuery("");
        fetchSearches();
      } else {
        const errorText = await res.text();
        toast.error(`Search failed: ${errorText}`);
      }
    } catch (e) {
      toast.error("An error occurred");
    } finally {
      setGenerating(false);
    }
  };

  // Helper to parse the JSON securely
  const parseJobs = (jsonString: string): Job[] => {
    try {
       const parsed = JSON.parse(jsonString);
       return Array.isArray(parsed) ? parsed : [];
    } catch {
       return [];
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <Card className="border-none shadow-xl shadow-blue-500/10">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-white rounded-t-xl border-b pb-6">
          <div className="flex items-center gap-3">
             <div className="p-3 bg-blue-100 rounded-lg">
                <Briefcase className="w-6 h-6 text-blue-600" />
             </div>
             <div>
               <CardTitle className="text-2xl">AI Job Search via Firecrawl</CardTitle>
               <CardDescription className="text-base mt-1">Search the web for real-time job postings parsed by AI.</CardDescription>
             </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-4 items-end">
            <div className="space-y-2 flex-1">
              <Label htmlFor="query">Job Title, Keywords, or Location</Label>
              <Input 
                id="query" 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                placeholder="e.g. Next.js Developer in San Francisco" 
                className="h-12 text-lg"
              />
            </div>
            <Button type="submit" className="h-12 px-8 bg-blue-600 hover:bg-blue-700" disabled={generating}>
              {generating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              {generating ? "Searching the web..." : "Search Jobs"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-8">
        <h2 className="text-2xl font-bold tracking-tight">Recent Search Results</h2>
        {loadingList ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
          </div>
        ) : searches.length === 0 ? (
          <Card className="bg-neutral-50/50 border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center h-48 text-center px-4">
              <MapPin className="w-10 h-10 text-neutral-300 mb-3" />
              <p className="text-neutral-500 font-medium">No searches yet</p>
              <p className="text-sm text-neutral-400 mt-1">Start your first job search above.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-10">
            {searches.map((search) => {
               const jobs = parseJobs(search.resultsData);
               
               return (
                <div key={search.id} className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                     <h3 className="font-semibold text-lg flex items-center gap-2">
                       <MapPin className="w-4 h-4 text-neutral-400" /> 
                       &quot;{search.query}&quot;
                     </h3>
                     <span className="text-xs text-neutral-500">{new Date(search.createdAt).toLocaleString()}</span>
                  </div>
                  
                  {jobs.length === 0 ? (
                    <p className="text-sm text-neutral-500 italic py-2">No valid jobs found for this query.</p>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {jobs.map((job, idx) => (
                        <Card key={idx} className="flex flex-col h-full hover:shadow-md transition-shadow">
                           <CardHeader className="pb-3 flex-1">
                              <CardTitle className="text-base leading-snug">{job.title}</CardTitle>
                              <CardDescription className="flex flex-col gap-1.5 mt-2">
                                <span className="flex items-center gap-1.5 text-neutral-900 font-medium">
                                  <Building2 className="w-3.5 h-3.5 text-neutral-400" /> {job.company || "Unknown Company"}
                                </span>
                                <span className="flex items-center gap-1.5 pt-0.5">
                                  <MapPin className="w-3.5 h-3.5 text-neutral-400" /> {job.location || "Remote/Unspecified"}
                                </span>
                              </CardDescription>
                           </CardHeader>
                           <CardContent className="pb-4 flex-1">
                              <p className="text-sm text-neutral-600 line-clamp-3">{job.summary}</p>
                           </CardContent>
                           <CardFooter className="pt-0 pb-4 flex gap-2">
                              <a 
                                href={job.url !== '#' ? job.url : undefined} 
                                target="_blank" 
                                className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium h-9 rounded-md transition-colors ${job.url && job.url !== '#' ? 'bg-neutral-900 text-white hover:bg-neutral-800' : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'}`}
                              >
                                {job.url && job.url !== '#' ? (
                                  <>Apply <ExternalLink className="w-3.5 h-3.5" /></>
                                ) : (
                                  'No Link'
                                )}
                              </a>
                              {job.location && (
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.company + ' ' + job.location)}`}
                                  target="_blank"
                                  className="flex items-center justify-center px-3 h-9 rounded-md border border-neutral-200 hover:bg-neutral-50 transition-colors text-neutral-600"
                                  title="View on Google Maps"
                                >
                                  <MapPin className="w-4 h-4" />
                                </a>
                              )}
                           </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
               );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
