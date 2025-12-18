import { Metadata } from "next";
import Link from "next/link";
import { Check, Mail, AlertCircle } from "lucide-react";
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

// 1. SEO 元数据配置
export const metadata: Metadata = {
    title: "Pricing Plans - StepSnip",
    description: "Simple, transparent pricing for video to article conversion. Start for free, upgrade for unlimited guides and advanced AI features.",
    keywords: ["video to article pricing", "StepSnip cost", "video summary pricing", "content repurposing plans"],
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

// 2. 静态价格配置
const PLANS = [
    {
        name: "Free Starter",
        price: "$0",
        period: "/mo",
        description: "Perfect for trying out the magic.",
        features: ["3 Video Conversions / month", "Basic AI Summary", "Standard Support", "Community Access"],
        buttonText: "Current Plan",
        popular: false,
        disabled: true, // 免费版目前可能默认已激活
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
            "Export to Markdown/PDF"
        ],
        buttonText: "Upgrade to Pro",
        popular: true,
        disabled: true, // 暂时禁用支付
    },
    {
        name: "Credit Pack",
        price: "$10",
        period: "one-time",
        description: "Pay as you go. No subscription.",
        features: ["20 Credits (Valid forever)", "Access to all Pro features", "No monthly commitment", "Ideal for sporadic use"],
        buttonText: "Buy Credits",
        popular: false,
        disabled: true, // 暂时禁用支付
    },
];

export default function PricingPage() {
    // 3. 结构化数据 (JSON-LD) - 让 Google 在搜索结果显示价格区间
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "PriceSpecification",
        "priceCurrency": "USD",
        "minPrice": "0",
        "maxPrice": "19.00",
        "name": "StepSnip Pricing"
    };

    return (
        <div className="min-h-screen bg-background pb-20 pt-10">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <div className="container px-4 md:px-6">
                {/* H1 标题区：SEO 核心 */}
                <div className="text-center mb-12 space-y-4">
                    <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                        Simple Pricing for <span className="text-primary">Video Content</span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Stop manually transcribing. Turn your YouTube videos into SEO-ready blog posts and guides in seconds.
                    </p>
                </div>

                {/* 临时通告：支付系统升级中 */}
                <div className="max-w-2xl mx-auto mb-12">
                    <Alert variant="default" className="border-primary/50 bg-primary/5">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Payment System Maintenance</AlertTitle>
                        <AlertDescription>
                            We are currently upgrading our billing system. To purchase a plan immediately, please contact our support team manually.
                        </AlertDescription>
                    </Alert>
                </div>

                {/* 价格卡片区 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {PLANS.map((plan) => (
                        <Card
                            key={plan.name}
                            className={`flex flex-col relative transition-all duration-200 ${plan.popular
                                    ? 'border-primary shadow-lg scale-105 z-10'
                                    : 'border-border hover:border-primary/50'
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
                                <CardDescription className="min-h-[40px]">{plan.description}</CardDescription>
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
                                    disabled={plan.disabled}
                                    size="lg"
                                >
                                    {plan.buttonText}
                                </Button>

                                {/* 🔴 核心修改：联系客服提示 */}
                                {plan.disabled && plan.name !== "Free Starter" && (
                                    <div className="text-center space-y-2">
                                        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            Purchases currently disabled
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

                {/* FAQ 区域：SEO 流量的宝藏 */}
                <div className="mt-24 max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-10">Frequently Asked Questions</h2>
                    <div className="grid gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">What happens to my unused credits?</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">Credits from the "Credit Pack" never expire. Monthly subscription credits reset each billing cycle, encouraging you to create consistent content.</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Can I cancel my subscription?</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">Yes, absolutely. You can cancel anytime from your dashboard. You will retain access to Pro features until the end of your current billing period.</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Do you offer refunds?</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">We offer a 7-day money-back guarantee if you haven't used more than 3 credits. Contact support for assistance.</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* 底部信任增强 */}
                <div className="mt-16 text-center text-sm text-muted-foreground">
                    <p>Secure payment processing via Stripe (Coming Soon). All prices in USD.</p>
                </div>
            </div>
        </div>
    );
}
