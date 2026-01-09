“use client”;

import { useState } from "react";
import Link from "next/link";
import { Star, Loader2, ArrowRight, Bot, CheckCircle2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export default function UserDashboard() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const isFormInvalid =
    rating === 0 || reviewText.trim().length < 10 || isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setAiResponse("");
    setSuccess(false);

    if (rating === 0) {
      setError("Please select a star rating");
      return;
    }

    if (reviewText.trim().length < 10) {
      setError("Review must be at least 10 characters");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          review_text: reviewText.trim(),
        }),
      });

      const data = await response.json();

      if (data.status === "error") {
        setError(data.message || "Failed to submit review");
      } else {
        setAiResponse(data.ai_response);
        setSuccess(true);
        setRating(0);
        setReviewText("");
        setHoverRating(0);
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return [1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        className={cn(
          "transition-all duration-200 hover:scale-110 focus:outline-none",
          (hoverRating || rating) >= star
            ? "text-amber-400"
            : "text-muted-foreground/30",
        )}
        onClick={() => setRating(star)}
        onMouseEnter={() => setHoverRating(star)}
        onMouseLeave={() => setHoverRating(0)}
        aria-label={`Rate ${star} stars`}
      >
        <Star
          className={cn(
            "w-10 h-10",
            (hoverRating || rating) >= star ? "fill-current" : "fill-none",
          )}
        />
      </button>
    ));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
      {/* Header */}
      <header className="w-full max-w-2xl mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 via-sky-400 to-indigo-500 bg-clip-text text-transparent">
            Share Your Feedback
          </h1>
          <p className="text-muted-foreground mt-2">
            We value your opinion and use AI to improve our services.
          </p>
        </div>
        <Button variant="ghost" asChild>
          <Link href="/admin" className="gap-2">
            Admin <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </header>

      {/* Main Form */}
      <main className="w-full max-w-2xl">
        <Card className="border-border/40 bg-background/60 backdrop-blur-xl shadow-2xl">
          <form onSubmit={handleSubmit}>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">How was your experience?</CardTitle>
              <CardDescription>
                Select a rating and tell us what you think.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Star Rating */}
              <div className="flex flex-col items-center gap-4">
                <div className="flex justify-center gap-2">
                  {renderStars()}
                </div>
                {rating > 0 && (
                  <p className="text-sm font-medium animate-in fade-in slide-in-from-bottom-2">
                    {rating === 5 && "Excellent! 🌟"}
                    {rating === 4 && "Great! 😊"}
                    {rating === 3 && "Good 👍"}
                    {rating === 2 && "Fair 😐"}
                    {rating === 1 && "Poor 😞"}
                  </p>
                )}
              </div>

              {/* Review Text */}
              <div className="space-y-3">
                <Label htmlFor="review" className="text-base">
                  Tell us more
                </Label>
                <Textarea
                  id="review"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your experience with us..."
                  className="min-h-[160px] bg-background/50 resize-none border-border/50 focus:border-primary/50 transition-all"
                  maxLength={5000}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Minimum 10 characters</span>
                  <span
                    className={cn(
                      reviewText.length > 0 && reviewText.length < 10
                        ? "text-destructive"
                        : "",
                    )}
                  >
                    {reviewText.length}/5000
                  </span>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <Alert className="bg-destructive/10 border-destructive/20">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                disabled={isFormInvalid}
                className="w-full h-12 text-base font-semibold transition-all bg-gradient-to-r from-emerald-400 via-sky-400 to-indigo-500 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Feedback"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* AI Response */}
        {aiResponse && (
          <Card className="mt-8 border-primary/20 bg-primary/5 backdrop-blur-sm animate-in fade-in slide-in-from-top-4 duration-500">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <Bot className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">AI Response</CardTitle>
                <CardDescription>Thank you for your feedback!</CardDescription>
              </div>
              {success && (
                <CheckCircle2 className="w-6 h-6 text-success" />
              )}
            </CardHeader>
            <CardContent>
              <p className="text-foreground/90 leading-relaxed whitespace-pre-line">
                "{aiResponse}"
              </p>
            </CardContent>
            {success && (
              <CardFooter className="pt-0">
                <div className="w-full py-2 px-4 bg-success/10 border border-success/20 rounded-lg text-success text-center text-sm font-medium">
                  Review submitted successfully!
                </div>
              </CardFooter>
            )}
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 text-center text-muted-foreground text-xs">
        <p>© 2026 Fynd AI Feedback System · Built with Shadcn UI</p>
      </footer>
    </div>
  );
}
