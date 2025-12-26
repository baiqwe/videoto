import Image from "next/image";
import { Clock, Search, Copy } from "lucide-react";

export function ProblemSolution() {
    return (
        <section className="py-20 border-t bg-muted/20">
            <div className="container px-4 md:px-6">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left - Problem/Solution Text */}
                    <div className="space-y-6">
                        <div className="inline-flex items-center rounded-full border border-destructive/20 bg-destructive/5 px-3 py-1 text-sm font-medium text-destructive">
                            The Problem
                        </div>

                        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                            Stop Wasting Time Pausing and Rewinding
                        </h2>

                        <p className="text-lg text-muted-foreground leading-relaxed">
                            Watching a 20-minute tutorial to find one specific command is frustrating.
                            Constantly pausing, rewinding, and taking manual screenshots breaks your flow and wastes hours every week.
                        </p>

                        <div className="space-y-4 pt-4">
                            <div className="flex gap-3">
                                <div className="mt-1 p-2 rounded-lg bg-primary/10 h-fit">
                                    <Clock className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Save Hours of Manual Work</h3>
                                    <p className="text-sm text-muted-foreground">
                                        StepSnip extracts the <strong>key moments</strong>, <strong>code snippets</strong>, and <strong>instructions</strong> so you can read at your own pace.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <div className="mt-1 p-2 rounded-lg bg-primary/10 h-fit">
                                    <Search className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Searchable & Skimmable</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Find exactly what you need with Cmd+F. No more scrubbing through timelines.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <div className="mt-1 p-2 rounded-lg bg-primary/10 h-fit">
                                    <Copy className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Export Anywhere</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Copy to Notion, Obsidian, or save as PDF for offline reference.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right - Visual */}
                    <div className="relative lg:order-last order-first">
                        <div className="relative aspect-video rounded-xl overflow-hidden border shadow-2xl bg-muted">
                            {/* Placeholder - replace with actual screenshot/illustration */}
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                                <div className="text-center space-y-2 p-8">
                                    <div className="text-6xl">📹</div>
                                    <p className="text-sm text-muted-foreground max-w-xs">
                                        Video tutorials transformed into structured, searchable guides
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
