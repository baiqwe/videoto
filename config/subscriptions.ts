import { ProductTier } from "@/types/subscriptions";

export const SUBSCRIPTION_TIERS: ProductTier[] = [
  {
    name: "Starter",
    id: "tier-hobby",
    productId: "prod_63JTQmsUcQrlZe94IL76fI", // $11 monthly subscription
    priceMonthly: "$11",
    description: "Perfect for individual developers and small projects.",
    features: [
      "Global authentication system",
      "Database integration",
      "Secure API routes",
      "Modern UI components",
      "Dark/Light mode",
      "Community forum access",
    ],
    featured: false,
    discountCode: "", // Optional discount code
  },
  {
    name: "Business",
    id: "tier-pro",
    productId: "prod_6rOJtTwlyjsH9AVuSzh8aR", // $29 monthly subscription (测试产品)
    priceMonthly: "$29",
    description: "Ideal for growing businesses and development teams.",
    features: [
      "Everything in Starter",
      "Multi-currency payments",
      "Priority support",
      "Advanced analytics",
      "Custom branding options",
      "API usage dashboard",
    ],
    featured: true,
    discountCode: "", // Optional discount code - 临时移除
  },
  {
    name: "Enterprise",
    id: "tier-enterprise",
    productId: "prod_3qPYksZMtk94wQsdkgajrJ", // $99 monthly subscription
    priceMonthly: "$99",
    description: "For large organizations with advanced requirements.",
    features: [
      "Everything in Business",
      "Dedicated account manager",
      "Custom implementation support",
      "High-volume transaction processing",
      "Advanced security features",
      "Service Level Agreement (SLA)",
    ],
    featured: false,
    discountCode: "", // Optional discount code
  },
];

export const CREDITS_TIERS: ProductTier[] = [
  {
    name: "Basic Package",
    id: "tier-50-credits",
    productId: "prod_MqcjVo0Bpx0rbYmHVlrh2", // $9 one-time purchase - Update this with your actual Creem product ID
    priceMonthly: "$9",
    description: "50 credits - Process approximately 5 videos (10 credits per video).",
    creditAmount: 50,
    features: [
      "50 credits for video processing",
      "Process ~5 videos (10 credits per video)",
      "No expiration date",
      "Access to all features",
      "Community support"
    ],
    featured: false,
    discountCode: "", // Optional discount code
  },
  {
    name: "Pro Package",
    id: "tier-200-credits",
    productId: "prod_4ICkTovEC6o9QY6UuL3aI0", // $29 one-time purchase - Update this with your actual Creem product ID
    priceMonthly: "$29",
    description: "200 credits - Process approximately 20 videos. Best value for content creators.",
    creditAmount: 200,
    features: [
      "200 credits for video processing",
      "Process ~20 videos (10 credits per video)",
      "No expiration date",
      "Priority processing",
      "Email support",
      "Best value per credit"
    ],
    featured: true,
    discountCode: "", // Optional discount code
  },
];
