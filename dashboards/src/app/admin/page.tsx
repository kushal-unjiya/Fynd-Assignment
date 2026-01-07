"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { MessageSquare, Star, RefreshCw, Filter, Eye, ChevronDown } from "lucide-react";

interface Review {
    id: string;
    rating: number;
    review_text: string;
    ai_response: string;
    ai_summary: string;
    ai_actions: string[];
    created_at: string;
}

export default function AdminDashboard() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [filterRating, setFilterRating] = useState<number | null>(null);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const [nextRefresh, setNextRefresh] = useState(10);
    const [selectedReview, setSelectedReview] = useState<Review | null>(null);

    const fetchReviews = useCallback(async () => {
        try {
            const response = await fetch("/api/admin/reviews");
            const data = await response.json();

            if (data.status === "error") {
                setError(data.message || "Failed to fetch reviews");
            } else {
                setReviews(data.reviews);
                setTotal(data.total);
                setError("");
            }
        } catch (err) {
            setError("Network error. Please try again.");
            console.error(err);
        } finally {
            setIsLoading(false);
            setLastRefresh(new Date());
            setNextRefresh(10);
        }
    }, []);

    useEffect(() => {
        fetchReviews();
        const timer = setInterval(() => {
            setNextRefresh((prev) => {
                if (prev <= 1) {
                    fetchReviews();
                    return 10;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [fetchReviews]);

    const filteredReviews = filterRating
        ? reviews.filter((r) => r.rating === filterRating)
        : reviews;

    const averageRating = reviews.length
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : "0.0";

    const ratingCounts = [5, 4, 3, 2, 1].map(
        (r) => reviews.filter((review) => review.rating === r).length
    );

    const maxCount = Math.max(...ratingCounts, 1);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "numeric",
            day: "numeric",
            year: "numeric"
        });
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        size={16}
                        className={star <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-8">
            {/* Header */}
            <header className="max-w-7xl mx-auto mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                            Feedback Dashboard
                        </h1>
                        <p className="text-slate-500 mt-1">
                            Monitor and analyze user feedback with AI-powered insights
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-sm text-slate-500 bg-white px-3 py-2 rounded-lg border border-slate-200">
                            <RefreshCw size={14} className={nextRefresh <= 3 ? "animate-spin" : ""} />
                            <span>{nextRefresh}s</span>
                        </div>
                        <Link
                            href="/"
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            ← User Dashboard
                        </Link>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Total Reviews */}
                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-slate-500 text-sm font-medium">Total Reviews</p>
                                <p className="text-4xl font-bold text-slate-800 mt-2">{total}</p>
                                <p className="text-slate-400 text-sm mt-1">All time submissions</p>
                            </div>
                            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                                <MessageSquare className="text-emerald-500" size={24} />
                            </div>
                        </div>
                    </div>

                    {/* Average Rating */}
                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-slate-500 text-sm font-medium">Average Rating</p>
                                <p className="text-4xl font-bold text-slate-800 mt-2">{averageRating}</p>
                                <p className="text-slate-400 text-sm mt-1">Out of 5 stars</p>
                            </div>
                            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                                <Star className="text-amber-500 fill-amber-500" size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Rating Distribution */}
                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                    <h3 className="text-slate-800 font-semibold flex items-center gap-2 mb-6">
                        <div className="w-1 h-5 bg-emerald-500 rounded-full"></div>
                        Rating Distribution
                    </h3>
                    <div className="space-y-4">
                        {[5, 4, 3, 2, 1].map((star, idx) => (
                            <div key={star} className="flex items-center gap-4">
                                <span className="text-sm text-slate-600 w-16">{star} stars</span>
                                <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${star === 5 ? "bg-emerald-500" :
                                                star === 4 ? "bg-emerald-400" :
                                                    star === 3 ? "bg-amber-400" :
                                                        star === 2 ? "bg-orange-400" :
                                                            "bg-red-400"
                                            }`}
                                        style={{ width: `${(ratingCounts[idx] / maxCount) * 100}%` }}
                                    />
                                </div>
                                <span className="text-sm text-slate-500 w-12 text-right">{ratingCounts[idx]}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-600">
                            <Filter size={18} />
                            <span className="font-medium">Filters</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <select
                                    value={filterRating || ""}
                                    onChange={(e) => setFilterRating(e.target.value ? Number(e.target.value) : null)}
                                    className="appearance-none bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 pr-10 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="">All Ratings</option>
                                    <option value="5">5 Stars</option>
                                    <option value="4">4 Stars</option>
                                    <option value="3">3 Stars</option>
                                    <option value="2">2 Stars</option>
                                    <option value="1">1 Star</option>
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                            <button
                                onClick={fetchReviews}
                                className="p-2 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                <RefreshCw size={18} className="text-slate-600" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Reviews Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="spinner"></div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-20 text-red-500">
                            <p>{error}</p>
                            <button
                                onClick={fetchReviews}
                                className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg"
                            >
                                Retry
                            </button>
                        </div>
                    ) : filteredReviews.length === 0 ? (
                        <div className="text-center py-20 text-slate-400">
                            <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                            <p>No reviews found</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4 w-12">#</th>
                                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4 w-32">Rating</th>
                                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Review</th>
                                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">
                                        <span className="flex items-center gap-1">✨ AI Summary</span>
                                    </th>
                                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4 w-28">Date</th>
                                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4 w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredReviews.map((review, index) => (
                                    <tr key={review.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-slate-500">{index + 1}</td>
                                        <td className="px-6 py-4">{renderStars(review.rating)}</td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-slate-700 line-clamp-2 max-w-xs">
                                                {review.review_text}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-slate-500 line-clamp-2 max-w-sm">
                                                {review.ai_summary || "Processing..."}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">{formatDate(review.created_at)}</td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => setSelectedReview(review)}
                                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                            >
                                                <Eye size={16} className="text-slate-400" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Review Detail Modal */}
            {selectedReview && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedReview(null)}>
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-slate-800">Review Details</h3>
                                <button onClick={() => setSelectedReview(null)} className="text-slate-400 hover:text-slate-600">✕</button>
                            </div>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex items-center gap-4">
                                {renderStars(selectedReview.rating)}
                                <span className="text-sm text-slate-500">{formatDate(selectedReview.created_at)}</span>
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold text-slate-600 mb-2">Customer Review</h4>
                                <p className="text-slate-700 bg-slate-50 p-4 rounded-lg">{selectedReview.review_text}</p>
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold text-emerald-600 mb-2 flex items-center gap-2">
                                    ✨ AI Summary
                                </h4>
                                <p className="text-slate-600">{selectedReview.ai_summary}</p>
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold text-amber-600 mb-2 flex items-center gap-2">
                                    💡 Recommended Actions
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {(selectedReview.ai_actions || []).map((action, idx) => (
                                        <span key={idx} className="text-sm bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full border border-amber-200">
                                            {action}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold text-blue-600 mb-2 flex items-center gap-2">
                                    🤖 AI Response to Customer
                                </h4>
                                <p className="text-slate-600 bg-blue-50 p-4 rounded-lg border border-blue-100">{selectedReview.ai_response}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="max-w-7xl mx-auto mt-8 text-center text-slate-400 text-sm" suppressHydrationWarning>
                <p>Last updated: {lastRefresh.toLocaleTimeString()}</p>
            </footer>
        </div>
    );
}
