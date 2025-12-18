import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        // 1. 验证用户登录
        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            // 如果没登录，返回重定向到登录页面的响应
            const loginUrl = new URL("/sign-in", request.url);
            loginUrl.searchParams.set("next", "/pricing");
            return NextResponse.redirect(loginUrl);
        }

        // 2. 获取表单提交的 priceId 和产品类型
        const formData = await request.formData();
        const priceId = formData.get("priceId") as string;
        const productType = formData.get("productType") as string; // 'subscription' or 'credits'
        const credits = formData.get("credits") as string; // 如果是积分包，传入积分数量

        if (!priceId) {
            return NextResponse.json(
                { error: "Price ID is required" },
                { status: 400 }
            );
        }

        // 3. 调用 Creem API 创建 Checkout Session
        const response = await fetch(`${process.env.CREEM_API_URL}/checkouts`, {
            method: "POST",
            headers: {
                "x-api-key": process.env.CREEM_API_KEY!,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                product_id: priceId,
                customer_email: user.email,
                success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?checkout=success`,
                cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?checkout=cancel`,
                // 🔥 关键：将 User ID 和产品类型传入 metadata，以便 Webhook 识别
                metadata: {
                    user_id: user.id,
                    product_type: productType || "subscription",
                    ...(credits && { credits: parseInt(credits) }),
                },
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Creem API Error:", data);
            return NextResponse.json(
                { error: "Failed to create checkout session", details: data },
                { status: 500 }
            );
        }

        // 4. 返回 checkout URL，让前端重定向
        return NextResponse.json({ checkout_url: data.checkout_url });

    } catch (error) {
        console.error("Checkout error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
