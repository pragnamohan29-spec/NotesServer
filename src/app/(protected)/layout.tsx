import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { BookOpen, Search, Video } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-white">
        <div className="container flex h-16 items-center mx-auto px-4 justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-bold text-xl text-neutral-900 tracking-tight">
                NotesServer<span className="text-blue-600">.</span>
              </span>
            </Link>
            <nav className="hidden md:flex gap-6">
              <Link href="/dashboard" className="text-sm font-medium text-neutral-600 hover:text-black flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Notes
              </Link>
              <Link href="/youtube" className="text-sm font-medium text-neutral-600 hover:text-black flex items-center gap-2">
                <Video className="w-4 h-4" /> YT Summarizer
              </Link>
              <Link href="/jobs" className="text-sm font-medium text-neutral-600 hover:text-black flex items-center gap-2">
                <Search className="w-4 h-4" /> Job Search
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <UserButton />
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
