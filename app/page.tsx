"use client";

import { motion } from "framer-motion";
import { WaitlistForm } from "@/components/landing/waitlist-form";
import { ExampleShowcase } from "@/components/landing/example-showcase";
import { CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">

      {/* 1. Hero Section - Waitlist Focus */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-primary/5 to-transparent -z-10" />

        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary"
            >
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
              Coming Soon
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl max-w-4xl"
            >
              Turn Video Content into <br />
              <span className="text-primary">Step-by-Step Guides</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-muted-foreground max-w-2xl"
            >
              Stop pausing and rewinding. StepSnip automatically converts YouTube tutorials into clean, visual articles with screenshots.
            </motion.p>

            {/* Waitlist Form Replacement */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="w-full max-w-md"
            >
              <WaitlistForm />
              <p className="text-sm text-muted-foreground mt-4">
                Join 200+ creators on the waiting list. Early access coming soon.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. Example Showcase - The "Proof" */}
      <ExampleShowcase />

      {/* 3. Features Grid (Trust Signals) */}
      <section className="py-20 border-t">
        <div className="container px-4 md:px-6">
          <div className="grid lg:grid-cols-3 gap-8">
            {[
              { title: "AI Summarization", desc: "Extracts key insights instantly." },
              { title: "Smart Screenshots", desc: "Captures HD frames at every step." },
              { title: "Export to Markdown", desc: "Ready for your blog or documentation." }
            ].map((item, i) => (
              <div key={i} className="flex gap-4 p-6 rounded-xl border bg-card">
                <div className="mt-1 bg-primary/10 p-2 rounded-lg h-fit">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
