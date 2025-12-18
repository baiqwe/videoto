import { Metadata } from "next";
import PricingPageClient from "./pricing-client";

// SEO Metadata
export const metadata: Metadata = {
    title: "Pricing Plans - StepSnip",
    description:
        "Simple, transparent pricing for video to article conversion. Start for free, upgrade for unlimited guides and advanced AI features.",
    keywords: [
        "video to article pricing",
        "StepSnip cost",
        "video summary pricing",
        "content repurposing plans",
    ],
    alternates: {
        canonical: "/pricing",
    },
    openGraph: {
        title: "Pricing Plans - StepSnip",
        description: "Turn YouTube videos into articles. Choose the plan that fits your needs.",
        type: "website",
        url: "https://www.stepsnip.com/pricing",
    },
};

export default function PricingPage() {
    return <PricingPageClient />;
}
