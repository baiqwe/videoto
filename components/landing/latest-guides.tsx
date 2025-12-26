"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";

interface Guide {
    id: string;
    title: string;
    created_at: string;
}

export function LatestGuides() {
    const [guides, setGuides] = useState<Guide[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchGuides() {
            try {
                const response = await fetch('/api/guides/latest');
                if (response.ok) {
                    const data = await response.json();
                    setGuides(data.guides || []);
                }
            } catch (error) {
                console.error('Failed to fetch latest guides:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchGuides();
    }, []);

    if (loading || guides.length === 0) {
        return null;
    }

    return (
        <section className="py-20 border-t">
            <div className="container px-4 md:px-6">
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight mb-2">Recently Created Guides</h2>
                        <p className="text-muted-foreground">
                            See what others are converting with StepSnip
                        </p>
                    </div>
                    <Link
                        href="/explore"
                        className="hidden md:flex items-center gap-2 text-primary hover:underline"
                    >
                        View all <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {guides.map((guide) => (
                        <Link
                            key={guide.id}
                            href={`/guides/${guide.id}`}
                            className="group p-4 rounded-xl border bg-card hover:shadow-md transition-all"
                        >
                            <h3 className="font-semibold text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                                {guide.title}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                {new Date(guide.created_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric'
                                })}
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="md:hidden flex justify-center mt-8">
                    <Link
                        href="/explore"
                        className="flex items-center gap-2 text-primary hover:underline"
                    >
                        View all guides <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
