import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the SSR package. It exchanges an auth code for the user's session.
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const origin = requestUrl.origin;
  const redirectTo = requestUrl.searchParams.get("redirect_to")?.toString();

  // Handle OAuth errors
  if (error) {
    console.error("OAuth error:", error, errorDescription);
    return NextResponse.redirect(
      `${origin}/sign-in?error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  if (code) {
    try {
      const supabase = await createClient();
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) {
        console.error("Error exchanging code for session:", exchangeError);
        return NextResponse.redirect(
          `${origin}/sign-in?error=${encodeURIComponent(exchangeError.message)}`
        );
      }
    } catch (err) {
      console.error("Unexpected error in callback:", err);
      return NextResponse.redirect(
        `${origin}/sign-in?error=${encodeURIComponent("Authentication failed. Please try again.")}`
      );
    }
  } else {
    // No code provided, redirect to sign in
    return NextResponse.redirect(`${origin}/sign-in?error=${encodeURIComponent("No authorization code provided")}`);
  }

  // Redirect to the specified path or dashboard
  if (redirectTo) {
    return NextResponse.redirect(`${origin}${redirectTo}`);
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${origin}/dashboard`);
}
