import { Users, Code, GraduationCap } from "lucide-react";

export function UseCases() {
    const cases = [
        {
            icon: <Users className="w-8 h-8" />,
            title: "For Creators",
            description: "Turn YouTube videos into SEO Blog Posts",
            detail: "Repurpose your video content into written articles that rank on Google. Extract transcripts, add headings, and publish faster."
        },
        {
            icon: <Code className="w-8 h-8" />,
            title: "For Developers",
            description: "Create Documentation from coding tutorials",
            detail: "Convert technical screencasts into searchable docs. Capture code snippets and commands with perfect accuracy."
        },
        {
            icon: <GraduationCap className="w-8 h-8" />,
            title: "For Students",
            description: "Get Lecture Summaries and Transcripts",
            detail: "Transform educational videos into study guides. Review key concepts without rewatching entire lectures."
        }
    ];

    return (
        <section className="py-20">
            <div className="container px-4 md:px-6">
                <div className="text-center mb-12 space-y-4">
                    <h2 className="text-3xl font-bold tracking-tight">Who Uses Video to Text Converters?</h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Whether you're a content creator, developer, or student—turn videos into your preferred learning format.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {cases.map((item, i) => (
                        <div
                            key={i}
                            className="group relative p-8 rounded-2xl border bg-card hover:shadow-lg transition-all duration-300"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity -z-10" />

                            <div className="mb-4 w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                {item.icon}
                            </div>

                            <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                            <p className="text-primary font-semibold mb-3">{item.description}</p>
                            <p className="text-muted-foreground text-sm">{item.detail}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
