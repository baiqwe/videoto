"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Video as VideoIcon } from "lucide-react";

interface CreateProjectData {
    videoSourceUrl: string;
    title?: string;
    generationMode?: 'text_only' | 'text_with_images';
}

interface VideoInputFormProps {
    onCreate: (data: CreateProjectData) => void;
    isCreating: boolean;
}

export default function VideoInputForm({ onCreate, isCreating }: VideoInputFormProps) {
    const [url, setUrl] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!url.trim()) return;

        onCreate({
            videoSourceUrl: url,
            generationMode: 'text_with_images'
        });
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
            <div className="relative flex items-center w-full">
                <VideoIcon className="absolute left-3 w-5 h-5 text-muted-foreground" />
                <Input
                    type="url"
                    placeholder="Paste YouTube URL here..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="pl-10 h-12 text-base rounded-lg border-2 focus-visible:ring-primary/20"
                    disabled={isCreating}
                    required
                />
                <Button
                    type="submit"
                    disabled={isCreating || !url}
                    className="absolute right-1.5 h-9 rounded-md px-4 font-semibold shadow-sm"
                >
                    {isCreating ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing
                        </>
                    ) : (
                        "Generate Guide"
                    )}
                </Button>
            </div>
            {/* Optional: Add Generation Mode selector if needed later, currently forcing text_with_images as per handler default */}
        </form>
    );
}
