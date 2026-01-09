import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { generateAdminSummary, generateRecommendedActions } from "@/lib/openrouter";

export async function POST() {
    try {
        const supabase = createServerClient();
        
        // Fetch all reviews
        const { data: reviews, error: fetchError } = await supabase
            .from("reviews")
            .select("*")
            .order("created_at", { ascending: false });

        if (fetchError) {
            return NextResponse.json(
                { status: "error", message: "Failed to fetch reviews" },
                { status: 500 }
            );
        }

        if (!reviews || reviews.length === 0) {
            return NextResponse.json({
                status: "success",
                message: "No reviews to regenerate",
                updated: 0
            });
        }

        let updated = 0;
        const errors: string[] = [];

        // Regenerate summaries and actions for each review
        for (const review of reviews) {
            try {
                const [newSummary, newActions] = await Promise.all([
                    generateAdminSummary(review.rating, review.review_text),
                    generateRecommendedActions(review.rating, review.review_text)
                ]);

                const { error: updateError } = await supabase
                    .from("reviews")
                    .update({
                        ai_summary: newSummary,
                        ai_actions: newActions
                    })
                    .eq("id", review.id);

                if (updateError) {
                    errors.push(`Failed to update review ${review.id}: ${updateError.message}`);
                } else {
                    updated++;
                }
            } catch (err) {
                errors.push(`Error processing review ${review.id}: ${String(err)}`);
            }
        }

        return NextResponse.json({
            status: "success",
            message: `Successfully regenerated ${updated} out of ${reviews.length} reviews`,
            updated,
            total: reviews.length,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error("Regeneration error:", error);
        return NextResponse.json(
            { status: "error", message: "Failed to regenerate reviews" },
            { status: 500 }
        );
    }
}
