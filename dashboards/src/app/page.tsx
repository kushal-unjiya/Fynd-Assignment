"use client";

import { useState } from "react";
import { Star, Send, MessageSquare, CheckCircle, AlertCircle, Bot, Loader2, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";

export default function UserDashboard() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

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
          review_text: reviewText.trim()
        })
      });

      const data = await response.json();

      if (data.status === "error") {
        setError(data.message || "Failed to submit review");
      } else {
        setAiResponse(data.ai_response);
        setSuccess(true);
        setRating(0);
        setReviewText("");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingLabel = (r: number) => {
    switch (r) {
      case 5: return { text: "Excellent!", emoji: "🌟", color: "text-green-500" };
      case 4: return { text: "Great!", emoji: "😊", color: "text-lime-500" };
      case 3: return { text: "Good", emoji: "👍", color: "text-yellow-500" };
      case 2: return { text: "Fair", emoji: "😐", color: "text-orange-500" };
      case 1: return { text: "Poor", emoji: "😞", color: "text-red-500" };
      default: return null;
    }
  };

  const getStarColor = (starPosition: number, currentRating: number) => {
    if (starPosition > currentRating) return "text-muted-foreground/30 hover:text-muted-foreground/50";

    switch (currentRating) {
      case 5: return "fill-green-500 text-green-500";
      case 4: return "fill-lime-500 text-lime-500";
      case 3: return "fill-yellow-500 text-yellow-500";
      case 2: return "fill-orange-500 text-orange-500";
      case 1: return "fill-red-500 text-red-500";
      default: return "text-muted-foreground/30";
    }
  };

  const ratingInfo = getRatingLabel(rating);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-2xl mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Fynd Feedback</h1>
              <p className="text-xs text-muted-foreground">Share your experience</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin">Admin →</Link>
            </Button>
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Review Form Card */}
        <Card className="shadow-lg border-border/50 overflow-hidden">
          <CardHeader className="border-b bg-muted/30 pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
                <MessageSquare size={16} />
              </div>
              Submit a Review
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Star Rating */}
              <div className="text-center py-4">
                <label className="block text-sm font-medium text-muted-foreground mb-5">
                  How would you rate your experience?
                </label>
                <div className="flex justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1.5 rounded-lg transition-all duration-150 hover:scale-110 hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      aria-label={`Rate ${star} stars`}
                    >
                      <Star
                        size={32}
                        className={`transition-all duration-150 ${getStarColor(star, hoverRating || rating)}`}
                      />
                    </button>
                  ))}
                </div>
                <div className="h-6 mt-3">
                  {ratingInfo && (
                    <p className={`text-sm font-medium ${ratingInfo.color} animate-in fade-in-0 slide-in-from-bottom-2 duration-200`}>
                      {ratingInfo.emoji} {ratingInfo.text}
                    </p>
                  )}
                </div>
              </div>

              {/* Review Text */}
              <div className="space-y-2">
                <label htmlFor="review" className="block text-sm font-medium text-foreground">
                  Tell us more about your experience
                </label>
                <Textarea
                  id="review"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your thoughts, suggestions, or feedback..."
                  className="min-h-32 resize-none transition-all duration-200 focus:shadow-md"
                  maxLength={5000}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className={reviewText.length < 10 && reviewText.length > 0 ? "text-orange-500" : ""}>
                    {reviewText.length < 10 ? `${10 - reviewText.length} more characters needed` : "Looking good!"}
                  </span>
                  <span>{reviewText.length}/5000</span>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <Alert variant="destructive" className="animate-in fade-in-0 slide-in-from-top-2 duration-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting || rating === 0}
                className="w-full h-12 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    <span>Submit Feedback</span>
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* AI Response Card */}
        {aiResponse && (
          <Card className="shadow-lg border-primary/20 overflow-hidden animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
            <CardHeader className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent pb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
                  <Bot size={20} className="text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">AI Response</CardTitle>
                  <p className="text-sm text-muted-foreground">Thank you for your feedback!</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-4">
              <p className="text-muted-foreground leading-relaxed">{aiResponse}</p>

              {success && (
                <Alert className="border-green-500/30 bg-green-500/5 text-green-600 dark:text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription className="font-medium">
                    Review submitted successfully!
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tips Card */}
        {!aiResponse && (
          <Card className="shadow-sm border-border/50 bg-muted/30">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/10 flex-shrink-0">
                  <Sparkles className="text-amber-500" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Tips for a great review</h3>
                  <ul className="text-sm text-muted-foreground space-y-1.5">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                      Be specific about what you liked or disliked
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                      Mention particular features or experiences
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                      Your feedback helps us improve our service
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/20">
        <div className="max-w-2xl mx-auto py-6 px-6 text-center text-muted-foreground text-sm">
          <p>Fynd AI Feedback System</p>
        </div>
      </footer>
    </div>
  );
}
