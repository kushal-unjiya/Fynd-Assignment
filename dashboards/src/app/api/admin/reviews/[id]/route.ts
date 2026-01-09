import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

interface RouteContext {
    params: Promise<{
        id: string;
    }>;
}

export async function DELETE(
    request: NextRequest,
    context: RouteContext
): Promise<NextResponse> {
    try {
        const { id } = await context.params;

        if (!id) {
            return NextResponse.json(
                { status: "error", message: "Review ID is required" },
                { status: 400 }
            );
        }

        const supabase = createServerClient();

        // Delete the review
        const { error } = await supabase
            .from("reviews")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("Delete error:", error);
            return NextResponse.json(
                { status: "error", message: "Failed to delete review" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            status: "success",
            message: "Review deleted successfully"
        });

    } catch (error) {
        console.error("API error:", error);
        return NextResponse.json(
            { status: "error", message: "An unexpected error occurred" },
            { status: 500 }
        );
    }
}
