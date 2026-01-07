"use client";

import { useState } from "react";
import { Star, Send, MessageSquare, CheckCircle, AlertCircle, Bot } from "lucide-react";

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

  const getRatingLabel = (r: number) => {
    switch (r) {
      case 5: return { text: "Excellent!", emoji: "🌟", color: "text-emerald-500" };
      case 4: return { text: "Great!", emoji: "😊", color: "text-emerald-400" };
      case 3: return { text: "Good", emoji: "👍", color: "text-amber-500" };
      case 2: return { text: "Fair", emoji: "😐", color: "text-orange-500" };
      case 1: return { text: "Poor", emoji: "😞", color: "text-red-500" };
      default: return null;
    }
  };

  const ratingInfo = getRatingLabel(rating);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      {/* Header */}
      <header className="max-w-2xl mx-auto mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
            Share Your Feedback
          </h1>
          <p className="text-slate-500 mt-1">
            We value your opinion and want to hear from you
          </p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto space-y-6">
        {/* Review Form Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <div className="w-1 h-5 bg-emerald-500 rounded-full"></div>
              Submit a Review
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Star Rating */}
            <div className="text-center">
              <label className="block text-sm font-medium text-slate-600 mb-4">
                How would you rate your experience?
              </label>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded"
                    aria-label={`Rate ${star} stars`}
                  >
                    <Star
                      size={36}
                      className={`transition-colors ${(hoverRating || rating) >= star
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-300 hover:text-amber-200"
                        }`}
                    />
                  </button>
                ))}
              </div>
              {ratingInfo && (
                <p className={`mt-3 text-sm font-medium ${ratingInfo.color}`}>
                  {ratingInfo.emoji} {ratingInfo.text}
                </p>
              )}
            </div>

            {/* Review Text */}
            <div>
              <label htmlFor="review" className="block text-sm font-medium text-slate-600 mb-2">
                Tell us more about your experience
              </label>
              <textarea
                id="review"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your experience with us..."
                className="w-full h-40 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl 
                           focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20
                           placeholder:text-slate-400 resize-none transition-all text-slate-700"
                maxLength={5000}
              />
              <div className="flex justify-between mt-2 text-xs text-slate-400">
                <span>Minimum 10 characters</span>
                <span>{reviewText.length}/5000</span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
                <AlertCircle size={20} className="flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 
                         text-white font-medium rounded-xl transition-colors
                         flex items-center justify-center gap-2 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>Submit Feedback</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* AI Response Card */}
        {aiResponse && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-blue-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center shadow-sm">
                  <Bot size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">AI Response</h3>
                  <p className="text-sm text-slate-500">Thank you for your feedback!</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <p className="text-slate-600 leading-relaxed">{aiResponse}</p>

              {success && (
                <div className="mt-6 flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600">
                  <CheckCircle size={20} className="flex-shrink-0" />
                  <span className="text-sm font-medium">Review submitted successfully!</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State / Tips */}
        {!aiResponse && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <MessageSquare className="text-amber-500" size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-1">Tips for a great review</h3>
                <ul className="text-sm text-slate-500 space-y-1">
                  <li>• Be specific about what you liked or disliked</li>
                  <li>• Mention particular features or experiences</li>
                  <li>• Your feedback helps us improve our service</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-2xl mx-auto mt-8 text-center text-slate-400 text-sm">
        <p>Fynd AI Feedback System</p>
      </footer>
    </div>
  );
}
