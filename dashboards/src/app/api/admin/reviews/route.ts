import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

// Response schema
interface Review {
    id: string;
    rating: number;
    review_text: string;
    ai_response: string;
    ai_summary: string;
    ai_actions: string[];
    created_at: string;
}

interface AdminReviewsResponse {
    reviews: Review[];
    total: number;
    status: "success" | "error";
    message?: string;
}

export async function GET(): Promise<NextResponse<AdminReviewsResponse>> {
    try {
        const supabase = createServerClient();

        const { data, error, count } = await supabase
            .from("reviews")
            .select("*", { count: "exact" })
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Database error:", error);
            return NextResponse.json(
                { reviews: [], total: 0, status: "error", message: "Failed to fetch reviews" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            reviews: data || [],
            total: count || 0,
            status: "success"
        });

    } catch (error) {
        console.error("API error:", error);
        return NextResponse.json(
            { reviews: [], total: 0, status: "error", message: "An unexpected error occurred" },
            { status: 500 }
        );
    }
}
