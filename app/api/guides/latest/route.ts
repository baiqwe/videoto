import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const supabase = await createClient();

        const { data: guides, error } = await supabase
            .from('projects')
            .select('id, title, created_at')
            .eq('status', 'completed')
            .eq('is_public', true)
            .order('created_at', { ascending: false })
            .limit(12);

        if (error) {
            console.error('Error fetching latest guides:', error);
            return NextResponse.json({ guides: [] });
        }

        return NextResponse.json({ guides: guides || [] });
    } catch (error) {
        console.error('Failed to fetch latest guides:', error);
        return NextResponse.json({ guides: [] }, { status: 500 });
    }
}
