"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UploadButton } from "@/lib/uploadthing";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type Note = {
  id: string;
  title: string;
  content: string;
  attachmentUrl: string | null;
  createdAt: string;
};

export default function DashboardPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchNotes = async () => {
    try {
      const res = await fetch("/api/notes");
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return toast.error("Title is required");

    setSaving(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, attachmentUrl }),
      });
      if (res.ok) {
        toast.success("Note saved!");
        setTitle("");
        setContent("");
        setAttachmentUrl("");
        fetchNotes();
      } else {
        toast.error("Failed to save note");
      }
    } catch (e) {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid md:grid-cols-[1fr_2fr] gap-8">
      {/* Create Note Form */}
      <div>
        <Card className="sticky top-24 border-none shadow-xl shadow-neutral-200/50">
          <CardHeader>
            <CardTitle>Create Note</CardTitle>
            <CardDescription>Jot down your thoughts and attach files.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveNote} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input 
                  id="title" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="Note title..." 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea 
                  id="content" 
                  value={content} 
                  onChange={(e) => setContent(e.target.value)} 
                  placeholder="Write your note here (Markdown supported)..."
                  className="min-h-[150px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Attachment</Label>
                {attachmentUrl ? (
                  <div className="text-sm p-3 bg-blue-50 text-blue-700 rounded-md border border-blue-100 flex items-center justify-between">
                    <span className="truncate">File Appended</span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setAttachmentUrl("")} className="h-auto p-1 px-2 text-blue-700 hover:bg-blue-100">Remove</Button>
                  </div>
                ) : (
                  <div className="border border-dashed rounded-md p-4 bg-neutral-50 flex items-center justify-center">
                    <UploadButton
                      endpoint="imageUploader"
                      onClientUploadComplete={(res) => {
                        if (res?.[0]) {
                          setAttachmentUrl(res[0].url);
                          toast.success("File uploaded successfully");
                        }
                      }}
                      onUploadError={(error: Error) => {
                        toast.error(`Upload failed: ${error.message}`);
                      }}
                    />
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save Note
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Notes List */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Your Notes</h2>
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
          </div>
        ) : notes.length === 0 ? (
          <Card className="bg-neutral-50/50 border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center h-48 text-center px-4">
              <p className="text-neutral-500 font-medium">No notes yet</p>
              <p className="text-sm text-neutral-400 mt-1">Create your first note using the form on the left.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {notes.map((note) => (
              <Card key={note.id} className="transition-all hover:shadow-md border-neutral-200/60">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{note.title}</CardTitle>
                    <span className="text-xs text-neutral-400 font-medium bg-neutral-100 px-2 py-1 rounded-md">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="whitespace-pre-wrap text-sm text-neutral-600 leading-relaxed">
                    {note.content || <span className="italic text-neutral-400">No content...</span>}
                  </p>
                  {note.attachmentUrl && (
                    <div className="pt-4 border-t border-neutral-100">
                      <a 
                        href={note.attachmentUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium"
                      >
                        <span className="flex items-center gap-1.5 bg-blue-50/50 px-3 py-1.5 rounded-md">
                           View Attachment
                        </span>
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
