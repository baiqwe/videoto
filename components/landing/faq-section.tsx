"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
    {
        question: "How to convert YouTube video to text for free?",
        answer: "StepSnip offers free YouTube to text conversion with 30 credits included on sign-up. Simply paste any YouTube URL, and our AI will extract the transcript, generate summaries, and create a structured guide—all without requiring a credit card."
    },
    {
        question: "Can I extract screenshots from YouTube video automatically?",
        answer: "Yes! StepSnip automatically captures screenshots from key moments in the video. Our AI identifies important visual frames and includes them in your guide, so you don't have to manually pause and screenshot."
    },
    {
        question: "Is there a tool to summarize YouTube videos into articles?",
        answer: "StepSnip specializes in turning YouTube videos into SEO-optimized blog articles and step-by-step guides. The AI analyzes the video content and restructures it into a readable format perfect for publishing on your website or knowledge base."
    },
    {
        question: "How accurate are the transcripts?",
        answer: "Our AI provides highly accurate transcriptions by combining YouTube's subtitle data with advanced context-aware processing. For videos without subtitles, we use state-of-the-art vision AI to analyze the content directly, ensuring accuracy for documentation and content repurposing."
    },
    {
        question: "Can I export guides to Notion or Obsidian?",
        answer: "Yes, all guides are exportable in Markdown format, making them compatible with Notion, Obsidian, and other note-taking apps. You can also copy the content directly to your clipboard or export as PDF for offline use."
    }
];

export function FAQSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    // JSON-LD Schema for FAQPage
    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
            }
        }))
    };

    return (
        <section className="py-20 bg-muted/30">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />

            <div className="container px-4 md:px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tight mb-4">Frequently Asked Questions</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Everything you need to know about converting YouTube videos to text and guides
                    </p>
                </div>

                <div className="max-w-3xl mx-auto space-y-4">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className="bg-card border rounded-xl overflow-hidden transition-shadow hover:shadow-md"
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full flex items-center justify-between p-6 text-left"
                            >
                                <h3 className="font-semibold text-lg pr-4">{faq.question}</h3>
                                <ChevronDown
                                    className={`w-5 h-5 text-muted-foreground transition-transform flex-shrink-0 ${openIndex === index ? 'transform rotate-180' : ''
                                        }`}
                                />
                            </button>

                            {openIndex === index && (
                                <div className="px-6 pb-6">
                                    <p className="text-muted-foreground leading-relaxed">
                                        {faq.answer}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
