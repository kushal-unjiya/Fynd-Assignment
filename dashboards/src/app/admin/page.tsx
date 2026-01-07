"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { MessageSquare, Star, RefreshCw, Filter, Eye, ChevronDown, Calendar, Search, X, Pause } from "lucide-react";

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
    const [filterDateRange, setFilterDateRange] = useState<string>("all");
    const [searchText, setSearchText] = useState("");
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const [nextRefresh, setNextRefresh] = useState(10);
    const [selectedReview, setSelectedReview] = useState<Review | null>(null);
    const [isPageVisible, setIsPageVisible] = useState(true);

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

        let timer: NodeJS.Timeout | null = null;

        const startTimer = () => {
            if (timer) clearInterval(timer);
            timer = setInterval(() => {
                setNextRefresh((prev) => {
                    if (prev <= 1) {
                        fetchReviews();
                        return 10;
                    }
                    return prev - 1;
                });
            }, 1000);
        };

        const stopTimer = () => {
            if (timer) {
                clearInterval(timer);
                timer = null;
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                // User came back to the tab - fetch fresh data and restart timer
                setIsPageVisible(true);
                fetchReviews();
                startTimer();
            } else {
                // Tab is hidden - pause the timer
                setIsPageVisible(false);
                stopTimer();
            }
        };

        // Start timer only if page is visible
        if (document.visibilityState === "visible") {
            startTimer();
        }

        // Listen for visibility changes
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            stopTimer();
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [fetchReviews]);

    // Filter by date range
    const getDateFilter = (dateStr: string) => {
        const reviewDate = new Date(dateStr);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        switch (filterDateRange) {
            case "today":
                return reviewDate >= today;
            case "week":
                return reviewDate >= weekAgo;
            case "month":
                return reviewDate >= monthAgo;
            default:
                return true;
        }
    };

    // Apply all filters
    const filteredReviews = reviews.filter((r) => {
        const matchesRating = filterRating ? r.rating === filterRating : true;
        const matchesDate = getDateFilter(r.created_at);
        const matchesSearch = searchText
            ? r.review_text.toLowerCase().includes(searchText.toLowerCase()) ||
            (r.ai_summary && r.ai_summary.toLowerCase().includes(searchText.toLowerCase()))
            : true;
        return matchesRating && matchesDate && matchesSearch;
    });

    const averageRating = reviews.length
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : "0.0";

    const ratingCounts = [5, 4, 3, 2, 1].map(
        (r) => reviews.filter((review) => review.rating === r).length
    );

    const maxCount = Math.max(...ratingCounts, 1);

    const clearFilters = () => {
        setFilterRating(null);
        setFilterDateRange("all");
        setSearchText("");
    };

    const hasActiveFilters = filterRating !== null || filterDateRange !== "all" || searchText !== "";

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
            <header className="max-w-7xl mx-auto mb-6">
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
                        <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border transition-colors ${isPageVisible
                                ? "text-slate-500 bg-white border-slate-200"
                                : "text-amber-600 bg-amber-50 border-amber-200"
                            }`}>
                            {isPageVisible ? (
                                <>
                                    <RefreshCw size={14} className={nextRefresh <= 3 ? "animate-spin" : ""} />
                                    <span>{nextRefresh}s</span>
                                </>
                            ) : (
                                <>
                                    <Pause size={14} />
                                    <span>Paused</span>
                                </>
                            )}
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

            <div className="max-w-7xl mx-auto space-y-4">
                {/* Stats + Chart Row - Compact */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
                    {/* Total Reviews - 1/5 */}
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-500 text-xs font-medium">Total Reviews</p>
                                <p className="text-2xl font-bold text-slate-800 mt-1">{total}</p>
                            </div>
                            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                                <MessageSquare className="text-emerald-500" size={16} />
                            </div>
                        </div>
                    </div>

                    {/* Average Rating - 1/5 */}
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-500 text-xs font-medium">Average Rating</p>
                                <p className="text-2xl font-bold text-slate-800 mt-1">{averageRating}</p>
                            </div>
                            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                                <Star className="text-amber-500 fill-amber-500" size={16} />
                            </div>
                        </div>
                    </div>

                    {/* Rating Distribution - 3/5 - Compact */}
                    <div className="lg:col-span-3 bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                        <h3 className="text-slate-800 text-sm font-semibold flex items-center gap-2 mb-2">
                            <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                            Rating Distribution
                        </h3>
                        <div className="space-y-1">
                            {[5, 4, 3, 2, 1].map((star, idx) => (
                                <div key={star} className="flex items-center gap-2">
                                    <span className="text-xs text-slate-600 w-12">{star} stars</span>
                                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${star === 5 ? "bg-emerald-500" :
                                                star === 4 ? "bg-emerald-400" :
                                                    star === 3 ? "bg-amber-400" :
                                                        star === 2 ? "bg-orange-400" :
                                                            "bg-red-400"
                                                }`}
                                            style={{ width: `${maxCount > 0 ? (ratingCounts[idx] / maxCount) * 100 : 0}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-slate-500 w-6 text-right">{ratingCounts[idx]}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Filters - Enhanced */}
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-slate-600">
                            <Filter size={18} />
                            <span className="font-medium">Filters</span>
                            {hasActiveFilters && (
                                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                    {filteredReviews.length} results
                                </span>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Search Input */}
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search reviews..."
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48"
                                />
                            </div>

                            {/* Date Range Filter */}
                            <div className="relative">
                                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                <select
                                    value={filterDateRange}
                                    onChange={(e) => setFilterDateRange(e.target.value)}
                                    className="appearance-none bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-10 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="all">All Time</option>
                                    <option value="today">Today</option>
                                    <option value="week">Last 7 Days</option>
                                    <option value="month">Last 30 Days</option>
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>

                            {/* Rating Filter */}
                            <div className="relative">
                                <Star size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                <select
                                    value={filterRating || ""}
                                    onChange={(e) => setFilterRating(e.target.value ? Number(e.target.value) : null)}
                                    className="appearance-none bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-10 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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

                            {/* Clear Filters */}
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <X size={16} />
                                    Clear
                                </button>
                            )}

                            {/* Refresh Button */}
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
                            <p>{hasActiveFilters ? "No reviews match your filters" : "No reviews found"}</p>
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="mt-3 text-sm text-emerald-600 hover:underline"
                                >
                                    Clear all filters
                                </button>
                            )}
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
