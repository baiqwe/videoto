import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText, Zap, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
    title: "Turn YouTube Videos into Blog Posts | Video to Article AI",
    description: "Repurpose video content into SEO-optimized blog posts instantly. AI-powered video to article converter for content creators and marketers. Save hours of writing time.",
    keywords: ["video to blog", "video to article", "content repurposing", "youtube to blog post", "video content converter"],
    alternates: {
        canonical: "/features/video-to-blog",
    },
    openGraph: {
        title: "Turn YouTube Videos into Blog Posts | StepSnip",
        description: "Repurpose your video library into SEO-ready articles. The easiest way to scale content production.",
        type: "website",
        url: "https://www.stepsnip.com/features/video-to-blog",
    },
};

export default function VideoToBlogPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <section className="relative pt-32 pb-24 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-primary/5 to-transparent -z-10" />

                <div className="container px-4 md:px-6">
                    <div className="max-w-4xl mx-auto text-center space-y-8">
                        <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary">
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Boost SEO • Scale Content Production
                        </div>

                        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
                            Repurpose <span className="text-primary">Video Content</span> into <br />
                            SEO-Ready Blog Posts
                        </h1>

                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Turn your YouTube library into a content goldmine. AI-powered conversion from video to blog articles in minutes, not hours.
                        </p>

                        <div className="pt-4">
                            <Button asChild size="lg" className="text-lg px-8">
                                <Link href="/">
                                    Start Repurposing Free <ArrowRight className="ml-2 w-5 h-5" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits Grid */}
            <section className="py-20 bg-muted/30">
                <div className="container px-4 md:px-6">
                    <h2 className="text-3xl font-bold text-center mb-12">Why Repurpose Videos into Articles?</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="text-center">
                            <CardHeader>
                                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                                    <Zap className="w-6 h-6" />
                                </div>
                                <CardTitle className="text-lg">10x Content Output</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    One video = One blog post, one social thread, one newsletter.
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="text-center">
                            <CardHeader>
                                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                                <CardTitle className="text-lg">SEO Boost</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Google loves text. Rank for keywords your video never could.
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="text-center">
                            <CardHeader>
                                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <CardTitle className="text-lg">Reader-Friendly</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Some people prefer reading. Give them what they want.
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="text-center">
                            <CardHeader>
                                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                                    <ArrowRight className="w-6 h-6" />
                                </div>
                                <CardTitle className="text-lg">5-Minute Setup</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Paste URL, get article. No editing, no reformatting required.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Use Cases */}
            <section className="py-20">
                <div className="container px-4 md:px-6">
                    <h2 className="text-3xl font-bold text-center mb-12">Perfect For</h2>
                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        <div className="space-y-4">
                            <div className="text-4xl">🎥</div>
                            <h3 className="text-xl font-bold">Content Creators</h3>
                            <p className="text-muted-foreground">
                                Turn every YouTube video into a blog post. Double your content reach without doubling your workload.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <div className="text-4xl">📈</div>
                            <h3 className="text-xl font-bold">Digital Marketers</h3>
                            <p className="text-muted-foreground">
                                Repurpose webinars and product demos into SEO-optimized landing pages and case studies.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <div className="text-4xl">👨‍💻</div>
                            <h3 className="text-xl font-bold">SaaS Companies</h3>
                            <p className="text-muted-foreground">
                                Convert tutorial videos into help center articles and documentation automatically.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-20 bg-muted/30">
                <div className="container px-4 md:px-6">
                    <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
                    <div className="max-w-3xl mx-auto space-y-8">
                        <div className="flex gap-4 items-start">
                            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl shrink-0">
                                1
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">Pick Your Video</h3>
                                <p className="text-muted-foreground">
                                    Paste the YouTube URL of any tutorial, webinar, or presentation.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4 items-start">
                            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl shrink-0">
                                2
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">AI Rewrites for Web</h3>
                                <p className="text-muted-foreground">
                                    Our engine analyzes, summarizes, and restructures the content into a scannable blog format with headings and screenshots.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4 items-start">
                            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl shrink-0">
                                3
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">Publish Anywhere</h3>
                                <p className="text-muted-foreground">
                                    Export to WordPress, Medium, Notion, or copy as Markdown. SEO-ready from day one.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-20">
                <div className="container px-4 md:px-6">
                    <h2 className="text-3xl font-bold text-center mb-12">Common Questions</h2>
                    <div className="max-w-3xl mx-auto space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Will the blog post be unique enough for SEO?</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Yes. Our AI restructures the content with new headings, formatting, and context. It's not a raw transcript—it's a rewritten article optimized for reading and search engines.
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Can I edit the generated article?</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Absolutely. We provide clean Markdown or HTML that you can tweak in any editor before publishing.
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">How long does conversion take?</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Most videos are processed in under 60 seconds. Longer videos (1+ hours) may take a few minutes.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 border-t bg-muted/30">
                <div className="container px-4 md:px-6 text-center">
                    <h2 className="text-3xl font-bold mb-4">Start Repurposing Your Video Library Today</h2>
                    <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                        Every video is a blog post waiting to happen. Stop leaving traffic on the table.
                    </p>
                    <Button asChild size="lg">
                        <Link href="/">Convert Your First Video Free →</Link>
                    </Button>
                </div>
            </section>
        </div>
    );
}
