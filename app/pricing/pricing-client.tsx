"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { Check, Mail, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

// Price configuration
const PLANS = [
    {
        name: "Free Starter",
        price: "$0",
        period: "/mo",
        description: "Perfect for trying out the magic.",
        features: [
            "30 Free Credits on Sign Up",
            "Basic AI Summary",
            "Standard Support",
            "Community Access",
        ],
        buttonText: "Get Started Free",
        priceId: "",
        productType: "",
        credits: 0,
        popular: false,
        isFree: true,
    },
    {
        name: "Pro Creator",
        price: "$19",
        period: "/mo",
        description: "For serious content repurposing.",
        features: [
            "50 Video Conversions / month",
            "Advanced GPT-4 Analysis",
            "SEO Blog Post Generation",
            "Priority Email Support",
            "Remove Watermark",
            "Export to Markdown/PDF",
        ],
        buttonText: "Upgrade to Pro",
        priceId: process.env.NEXT_PUBLIC_CREEM_PRICE_PRO || "",
        productType: "subscription",
        credits: 0,
        popular: true,
        isFree: false,
    },
    {
        name: "Credit Pack",
        price: "$10",
        period: "one-time",
        description: "Pay as you go. No subscription.",
        features: [
            "20 Credits (Valid forever)",
            "Access to all Pro features",
            "No monthly commitment",
            "Ideal for sporadic use",
        ],
        buttonText: "Buy Credits",
        priceId: process.env.NEXT_PUBLIC_CREEM_PRICE_CREDITS || "",
        productType: "credits",
        credits: 20,
        popular: false,
        isFree: false,
    },
];

export default function PricingPageClient() {
    const router = useRouter();
    const { toast } = useToast();
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

    const handleCheckout = async (plan: typeof PLANS[0]) => {
        if (plan.isFree) {
            router.push("/sign-up");
            return;
        }

        if (!plan.priceId) {
            toast({
                title: "Payment Temporarily Unavailable",
                description: "Please contact support@stepsnip.com to purchase this plan.",
                variant: "default",
            });
            return;
        }

        setLoadingPlan(plan.name);

        try {
            const formData = new FormData();
            formData.append("priceId", plan.priceId);
            formData.append("productType", plan.productType);
            if (plan.credits) {
                formData.append("credits", plan.credits.toString());
            }

            const response = await fetch("/api/creem/checkout", {
                method: "POST",
                body: formData,
            });

            if (response.redirected) {
                // If redirected to login
                window.location.href = response.url;
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to create checkout");
            }

            // Redirect to Creem checkout
            if (data.checkout_url) {
                window.location.href = data.checkout_url;
            }
        } catch (error) {
            console.error("Checkout error:", error);
            toast({
                title: "Checkout Failed",
                description:
                    error instanceof Error
                        ? error.message
                        : "Failed to initiate checkout. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoadingPlan(null);
        }
    };

    // JSON-LD for SEO
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "PriceSpecification",
        priceCurrency: "USD",
        minPrice: "0",
        maxPrice: "19.00",
        name: "StepSnip Pricing",
    };

    return (
        <div className="min-h-screen bg-background pb-20 pt-10">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <div className="container px-4 md:px-6">
                {/* H1 Title */}
                <div className="text-center mb-12 space-y-4">
                    <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                        Simple Pricing for <span className="text-primary">Video Content</span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Stop manually transcribing. Turn your YouTube videos into SEO-ready blog posts
                        and guides in seconds.
                    </p>
                </div>

                {/* Price Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {PLANS.map((plan) => (
                        <Card
                            key={plan.name}
                            className={`flex flex-col relative transition-all duration-200 ${plan.popular
                                    ? "border-primary shadow-lg scale-105 z-10"
                                    : "border-border hover:border-primary/50"
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-0 mr-6">
                                    <Badge className="bg-primary text-primary-foreground px-3 py-1 text-sm font-medium">
                                        Most Popular
                                    </Badge>
                                </div>
                            )}

                            <CardHeader>
                                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                                <CardDescription className="min-h-[40px]">
                                    {plan.description}
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="flex-1">
                                <div className="mb-6 flex items-baseline gap-1">
                                    <span className="text-4xl font-bold">{plan.price}</span>
                                    <span className="text-muted-foreground font-medium">{plan.period}</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="text-sm font-medium text-muted-foreground">Includes:</div>
                                    <ul className="space-y-3">
                                        {plan.features.map((feature) => (
                                            <li key={feature} className="flex items-start gap-2">
                                                <Check className="h-4 w-4 text-primary mt-1 shrink-0" />
                                                <span className="text-sm text-foreground/80">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </CardContent>

                            <CardFooter className="flex flex-col gap-4">
                                <Button
                                    className="w-full"
                                    variant={plan.popular ? "default" : "outline"}
                                    size="lg"
                                    onClick={() => handleCheckout(plan)}
                                    disabled={loadingPlan === plan.name}
                                >
                                    {loadingPlan === plan.name ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        plan.buttonText
                                    )}
                                </Button>

                                {!plan.isFree && !plan.priceId && (
                                    <div className="text-center space-y-2">
                                        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            Payment setup in progress
                                        </p>
                                        <Link
                                            href="mailto:support@stepsnip.com?subject=Upgrade%20Request%20for%20StepSnip"
                                            className="text-xs font-medium text-primary hover:underline flex items-center justify-center gap-1.5"
                                        >
                                            <Mail className="w-3 h-3" />
                                            Contact support@stepsnip.com to upgrade
                                        </Link>
                                    </div>
                                )}
                            </CardFooter>
                        </Card>
                    ))}
                </div>

                {/* FAQ Section */}
                <div className="mt-24 max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-10">
                        Frequently Asked Questions
                    </h2>
                    <div className="grid gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    What happens to my unused credits?
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Credits from the "Credit Pack" never expire. Monthly subscription credits
                                    reset each billing cycle, encouraging you to create consistent content.
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Can I cancel my subscription?</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Yes, absolutely. You can cancel anytime from your dashboard. You will
                                    retain access to Pro features until the end of your current billing
                                    period.
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Do you offer refunds?</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    We offer a 7-day money-back guarantee if you haven't used more than 3
                                    credits. Contact support for assistance.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Trust Footer */}
                <div className="mt-16 text-center text-sm text-muted-foreground">
                    <p>Secure payment processing via Creem. All prices in USD.</p>
                </div>
            </div>
        </div>
    );
}
