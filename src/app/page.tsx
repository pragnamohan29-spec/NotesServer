"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Search, Video, Sparkles } from "lucide-react";
import { motion, Variants } from "framer-motion";
import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";

export default function Home() {
  const { isSignedIn } = useUser();

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { 
        staggerChildren: 0.1 
      } 
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1, 
      transition: { type: "spring", stiffness: 100 } 
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-blue-500/30 overflow-hidden relative">
      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
      
      {/* Navbar */}
      <header className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold flex items-center gap-1 group">
            NotesServer<span className="text-blue-500 h-2 w-2 rounded-full bg-blue-500 inline-block" />
          </Link>
          <div className="flex gap-4">
            {isSignedIn ? (
               <Link href="/dashboard">
                 <Button variant="secondary" className="bg-white text-black hover:bg-neutral-200">
                   Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
                 </Button>
               </Link>
            ) : (
               <>
                 <SignInButton mode="modal">
                   <Button variant="ghost" className="text-neutral-300 hover:text-white hover:bg-white/10">Sign In</Button>
                 </SignInButton>
                 <SignUpButton mode="modal">
                   <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]">Get Started</Button>
                 </SignUpButton>
               </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 pt-40 pb-20 relative z-10">
        <motion.div 
          className="max-w-4xl mx-auto text-center space-y-8"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-blue-400 mb-4 backdrop-blur-md">
            <Sparkles className="w-4 h-4" /> The All-in-One AI Workspace
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-extrabold tracking-tight pb-2 bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-neutral-400">
            Supercharge your workflow.
          </motion.h1>
          
          <motion.p variants={itemVariants} className="text-xl text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            Centralize your notes, instantly summarize hours of YouTube content with AI, and hunt for your dream job using advanced web scraping.
          </motion.p>
          
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            {isSignedIn ? (
               <Link href="/dashboard">
                  <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8 bg-blue-600 hover:bg-blue-700 shadow-[0_0_30px_rgba(37,99,235,0.4)]">
                    Enter Workspace <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
               </Link>
            ) : (
               <SignUpButton mode="modal">
                  <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8 bg-white text-black hover:bg-neutral-200">
                    Start for free <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
               </SignUpButton>
            )}
          </motion.div>
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          className="grid md:grid-cols-3 gap-6 mt-32 max-w-6xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          {/* Feature 1 */}
          <motion.div variants={itemVariants} className="relative group rounded-2xl border border-white/10 bg-white/5 p-8 overflow-hidden hover:bg-white/[0.07] transition-colors">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center mb-6 border border-blue-500/20">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Rich Notes</h3>
            <p className="text-neutral-400 leading-relaxed">Take distraction-free notes in Markdown. Seamlessly upload and manage attachments with Uploadthing.</p>
          </motion.div>

          {/* Feature 2 */}
          <motion.div variants={itemVariants} className="relative group rounded-2xl border border-white/10 bg-white/5 p-8 overflow-hidden hover:bg-white/[0.07] transition-colors">
            <div className="absolute inset-0 bg-gradient-to-b from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-12 h-12 bg-red-500/20 text-red-400 rounded-xl flex items-center justify-center mb-6 border border-red-500/20">
              <Video className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-3">YouTube AI</h3>
            <p className="text-neutral-400 leading-relaxed">Paste a link and let Google Gemini instantly extract the key insights and create structured summaries.</p>
          </motion.div>

          {/* Feature 3 */}
          <motion.div variants={itemVariants} className="relative group rounded-2xl border border-white/10 bg-white/5 p-8 overflow-hidden hover:bg-white/[0.07] transition-colors">
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center mb-6 border border-emerald-500/20">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Job Hunter</h3>
            <p className="text-neutral-400 leading-relaxed">Leverage Firecrawl to scrape the web for the latest roles, perfectly formatted and categorized by AI.</p>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
