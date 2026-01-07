"use client";

import { useState } from "react";
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
        // Reset form
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

  const renderStars = () => {
    return [1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        className={`star ${(hoverRating || rating) >= star ? "filled" : "empty"}`}
        onClick={() => setRating(star)}
        onMouseEnter={() => setHoverRating(star)}
        onMouseLeave={() => setHoverRating(0)}
        aria-label={`Rate ${star} stars`}
      >
        ★
      </button>
    ));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      {/* Header */}
      <header className="w-full max-w-2xl mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              Share Your Feedback
            </h1>
            <p className="text-muted mt-2">We value your opinion</p>
          </div>
          <Link
            href="/admin"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            Admin Dashboard →
          </Link>
        </div>
      </header>

      {/* Main Form */}
      <main className="w-full max-w-2xl">
        <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 space-y-8">
          {/* Star Rating */}
          <div className="text-center">
            <label className="block text-lg font-medium mb-4">
              How would you rate your experience?
            </label>
            <div className="flex justify-center gap-2">
              {renderStars()}
            </div>
            {rating > 0 && (
              <p className="mt-3 text-muted">
                {rating === 5 && "Excellent! 🌟"}
                {rating === 4 && "Great! 😊"}
                {rating === 3 && "Good 👍"}
                {rating === 2 && "Fair 😐"}
                {rating === 1 && "Poor 😞"}
              </p>
            )}
          </div>

          {/* Review Text */}
          <div>
            <label htmlFor="review" className="block text-lg font-medium mb-3">
              Tell us more
            </label>
            <textarea
              id="review"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience with us..."
              className="w-full h-40 px-4 py-3 bg-background/50 border border-border rounded-xl 
                         focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary
                         placeholder:text-muted resize-none transition-all"
              maxLength={5000}
            />
            <div className="flex justify-between mt-2 text-sm text-muted">
              <span>Minimum 10 characters</span>
              <span>{reviewText.length}/5000</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-danger/10 border border-danger/30 rounded-xl text-danger text-center">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full py-4 rounded-xl font-semibold text-white
                       flex items-center justify-center gap-3"
          >
            {isSubmitting ? (
              <>
                <div className="spinner"></div>
                Submitting...
              </>
            ) : (
              "Submit Feedback"
            )}
          </button>
        </form>

        {/* AI Response */}
        {aiResponse && (
          <div className="ai-response mt-8 glass rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-purple-500 
                              flex items-center justify-center text-xl">
                🤖
              </div>
              <div>
                <h3 className="font-semibold">AI Response</h3>
                <p className="text-sm text-muted">Thank you for your feedback!</p>
              </div>
            </div>
            <p className="text-foreground/90 leading-relaxed">{aiResponse}</p>
            {success && (
              <div className="mt-6 p-4 bg-secondary/10 border border-secondary/30 rounded-xl 
                              text-secondary text-center flex items-center justify-center gap-2">
                <span>✓</span> Review submitted successfully!
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 text-center text-muted text-sm">
        <p>Fynd AI Feedback System</p>
      </footer>
    </div>
  );
}
