import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
            return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
        }

        const supabase = await createClient();

        // Insert data, ignore duplicates (assuming unique constraint on email handled by error check or ON CONFLICT if DB supports)
        // Supabase simple insert will error on unique constraint violation
        const { error } = await supabase
            .from('waitlist')
            .insert({ email });

        if (error) {
            // If unique violation (code 23505), return success to avoid leaking/confusing
            if (error.code === '23505') {
                return NextResponse.json({ message: "You're already on the list!" });
            }
            console.error('Waitlist error:', error);
            return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
        }

        return NextResponse.json({ message: "You've been added to the waitlist!" });
    } catch (error) {
        console.error('Waitlist handler error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
