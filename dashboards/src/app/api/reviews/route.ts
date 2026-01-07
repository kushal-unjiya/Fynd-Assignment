import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import {
    generateUserResponse,
    generateAdminSummary,
    generateRecommendedActions
} from "@/lib/openrouter";

// Request schema validation
interface ReviewRequest {
    rating: number;
    review_text: string;
}

// Response schema
interface ReviewResponse {
    id: string;
    ai_response: string;
    status: "success" | "error";
    message?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<ReviewResponse>> {
    try {
        const body: ReviewRequest = await request.json();

        // Validate rating
        if (!body.rating || body.rating < 1 || body.rating > 5) {
            return NextResponse.json(
                { id: "", ai_response: "", status: "error", message: "Rating must be between 1 and 5" },
                { status: 400 }
            );
        }

        // Validate review text
        const reviewText = body.review_text?.trim() || "";
        if (reviewText.length < 10) {
            return NextResponse.json(
                { id: "", ai_response: "", status: "error", message: "Review must be at least 10 characters" },
                { status: 400 }
            );
        }

        // Truncate long reviews
        const truncatedReview = reviewText.slice(0, 5000);

        // Generate AI responses in parallel
        const [aiResponse, aiSummary, aiActions] = await Promise.all([
            generateUserResponse(body.rating, truncatedReview),
            generateAdminSummary(body.rating, truncatedReview),
            generateRecommendedActions(body.rating, truncatedReview)
        ]);

        // Store in database
        const supabase = createServerClient();
        const { data, error } = await supabase
            .from("reviews")
            .insert({
                rating: body.rating,
                review_text: truncatedReview,
                ai_response: aiResponse,
                ai_summary: aiSummary,
                ai_actions: aiActions
            })
            .select("id")
            .single();

        if (error) {
            console.error("Database error:", error);
            return NextResponse.json(
                { id: "", ai_response: aiResponse, status: "error", message: "Failed to save review" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            id: data.id,
            ai_response: aiResponse,
            status: "success"
        });

    } catch (error) {
        console.error("API error:", error);
        return NextResponse.json(
            { id: "", ai_response: "", status: "error", message: "An unexpected error occurred" },
            { status: 500 }
        );
    }
}
