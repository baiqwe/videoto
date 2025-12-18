import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
    title: "Free YouTube to Text Converter | StepSnip",
    description: "Convert YouTube videos to text instantly. The best free video transcript generator with AI-powered summaries. Extract accurate text from any YouTube video in seconds.",
    keywords: ["youtube to text", "youtube transcript", "video to text converter", "youtube transcript generator", "free video transcription"],
    alternates: {
        canonical: "/features/youtube-to-text",
    },
    openGraph: {
        title: "Free YouTube to Text Converter | StepSnip",
        description: "The fastest way to convert YouTube videos to text. Get accurate transcripts, summaries, and guides.",
        type: "website",
        url: "https://www.stepsnip.com/features/youtube-to-text",
    },
};

export default function YouTubeToTextPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <section className="relative pt-32 pb-24 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-primary/5 to-transparent -z-10" />

                <div className="container px-4 md:px-6">
                    <div className="max-w-4xl mx-auto text-center space-y-8">
                        <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary">
                            <Sparkles className="w-4 h-4 mr-2" />
                            100% Free • No Login Required
                        </div>

                        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
                            The Fastest Way to Convert <br />
                            <span className="text-primary">YouTube Video to Text</span>
                        </h1>

                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Extract accurate transcripts from any YouTube video instantly. Perfect for meeting notes, lecture summaries, and quick reading.
                        </p>

                        <div className="pt-4">
                            <Button asChild size="lg" className="text-lg px-8">
                                <Link href="/">
                                    Start Converting Free <ArrowRight className="ml-2 w-5 h-5" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Use Cases */}
            <section className="py-20 bg-muted/30">
                <div className="container px-4 md:px-6">
                    <h2 className="text-3xl font-bold text-center mb-12">Why Convert YouTube to Text?</h2>
                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        <Card>
                            <CardHeader>
                                <CardTitle>📝 Meeting Transcripts</CardTitle>
                                <CardDescription>
                                    Turn recorded meetings and webinars into searchable text documents.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>🎓 Study Notes</CardTitle>
                                <CardDescription>
                                    Extract lecture content and tutorial transcripts for faster learning.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>🚀 Content Repurposing</CardTitle>
                                <CardDescription>
                                    Convert video content into blog posts, social media, and documentation.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </div>
                </div>
            </section>

            {/* How it Works */}
            <section className="py-20">
                <div className="container px-4 md:px-6">
                    <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
                    <div className="max-w-3xl mx-auto space-y-8">
                        <div className="flex gap-4 items-start">
                            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl shrink-0">
                                1
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">Paste YouTube URL</h3>
                                <p className="text-muted-foreground">
                                    Copy any YouTube video link and paste it into StepSnip.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4 items-start">
                            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl shrink-0">
                                2
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">AI Extracts Text</h3>
                                <p className="text-muted-foreground">
                                    Our AI generates accurate transcripts and summaries from the video content.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4 items-start">
                            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl shrink-0">
                                3
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">Export & Share</h3>
                                <p className="text-muted-foreground">
                                    Download as text, Markdown, or PDF. Copy to your favorite note-taking app.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-20 bg-muted/30">
                <div className="container px-4 md:px-6">
                    <h2 className="text-3xl font-bold text-center mb-12">Common Questions</h2>
                    <div className="max-w-3xl mx-auto space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Is this YouTube transcript tool really free?</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Yes! StepSnip offers free credits to convert YouTube videos to text. No payment required to start.
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Can I convert long videos?</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Absolutely. Our AI can process videos of any length, from short clips to multi-hour lectures.
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">What formats can I export to?</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Export your transcripts as plain text, Markdown, HTML, or PDF for maximum flexibility.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 border-t">
                <div className="container px-4 md:px-6 text-center">
                    <h2 className="text-3xl font-bold mb-4">Ready to Convert YouTube to Text?</h2>
                    <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                        Join thousands of students, professionals, and content creators who save hours every week.
                    </p>
                    <Button asChild size="lg">
                        <Link href="/">Get Started Free →</Link>
                    </Button>
                </div>
            </section>
        </div>
    );
}
