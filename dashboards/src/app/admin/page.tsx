"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    MessageSquare,
    Star,
    RefreshCw,
    Filter,
    Eye,
    ChevronDown,
    Calendar,
    Search,
    X,
    Pause,
    Clock,
    Bot,
    TrendingUp,
    Loader2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

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
    const [filterRating, setFilterRating] = useState<string>("all");
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
                setIsPageVisible(true);
                fetchReviews();
                startTimer();
            } else {
                setIsPageVisible(false);
                stopTimer();
            }
        };

        if (document.visibilityState === "visible") {
            startTimer();
        }

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            stopTimer();
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [fetchReviews]);

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

    const filteredReviews = reviews.filter((r) => {
        const matchesRating = filterRating !== "all" ? r.rating === Number(filterRating) : true;
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
        setFilterRating("all");
        setFilterDateRange("all");
        setSearchText("");
    };

    const hasActiveFilters = filterRating !== "all" || filterDateRange !== "all" || searchText !== "";

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    };

    const getStarColor = (rating: number) => {
        switch (rating) {
            case 5: return "fill-green-500 text-green-500";
            case 4: return "fill-lime-500 text-lime-500";
            case 3: return "fill-yellow-500 text-yellow-500";
            case 2: return "fill-orange-500 text-orange-500";
            case 1: return "fill-red-500 text-red-500";
            default: return "fill-muted-foreground text-muted-foreground";
        }
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        size={14}
                        className={cn(
                            star <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
                        )}
                    />
                ))}
            </div>
        );
    };

    const getRatingColor = (star: number) => {
        switch (star) {
            case 5: return "bg-emerald-500";
            case 4: return "bg-emerald-400";
            case 3: return "bg-amber-400";
            case 2: return "bg-orange-400";
            case 1: return "bg-destructive";
            default: return "bg-muted";
        }
    };

    return (
        <div className="min-h-screen bg-background p-4 md:p-8 space-y-8">
            {/* Header */}
            <header className="max-w-7xl mx-auto mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-shadow-slate-600">
                            Feedback Dashboard
                        </h1>
                        <p className="text-slate-500 mt-1">
                            Monitor and analyze user feedback with AI-powered insights
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge
                            variant={isPageVisible ? "secondary" : "outline"}
                            className={`gap-1.5 py-1.5 font-mono text-xs transition-colors ${!isPageVisible ? "bg-amber-500/10 text-amber-600 border-amber-500/30" : ""
                                }`}
                        >
                            {isPageVisible ? (
                                <>
                                    <RefreshCw size={12} className={nextRefresh <= 3 ? "animate-spin" : ""} />
                                    <span>{nextRefresh}s</span>
                                </>
                            ) : (
                                <>
                                    <Pause size={12} />
                                    <span>Paused</span>
                                </>
                            )}
                        </Badge>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/">← User View</Link>
                        </Button>
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
                                <p className="text-slate-500 text-xs font-medium">Total Reviews</p>
                                <p className="text-2xl font-bold text-slate-800 mt-1">{total}</p>
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
                                <p className="text-slate-500 text-xs font-medium">Average Rating</p>
                                <p className="text-2xl font-bold text-slate-800 mt-1">{averageRating}</p>
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
                        <div className="w-1 h-5 bg-emerald-500 rounded-full" />
                        Rating Distribution
                    </h3>
                    <div className="space-y-4">
                        {[5, 4, 3, 2, 1].map((star, idx) => (
                            <div key={star} className="flex items-center gap-4">
                                <span className="text-sm text-slate-600 w-16">{star} stars</span>
                                <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={cn(
                                            "h-full rounded-full transition-all duration-500",
                                            getRatingColor(star)
                                        )}
                                        style={{
                                            width: `${maxCount > 0 ? (ratingCounts[idx] / maxCount) * 100 : 0}%`,
                                        }}
                                    />
                                </div>
                                <span className="text-sm text-slate-500 w-12 text-right">
                                    {ratingCounts[idx]}
                                </span>
                            </div>
                        ))}
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
                                <Search
                                    size={16}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />
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
                                <Calendar
                                    size={16}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                                />
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
                                <ChevronDown
                                    size={16}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                                />
                            </div>

                            {/* Rating Filter */}
                            <div className="relative">
                                <Star
                                    size={16}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                                />
                                <select
                                    value={filterRating}
                                    onChange={(e) => setFilterRating(e.target.value)}
                                    className="appearance-none bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-10 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="all">All Ratings</option>
                                    <option value="5">5 Stars</option>
                                    <option value="4">4 Stars</option>
                                    <option value="3">3 Stars</option>
                                    <option value="2">2 Stars</option>
                                    <option value="1">1 Star</option>
                                </select>
                                <ChevronDown
                                    size={16}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                                />
                            </div>

                            {/* Clear Filters */}
                            {hasActiveFilters && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="h-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                    <X size={14} />
                                    Clear
                                </Button>
                            )}

                            {/* Refresh Button */}
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={fetchReviews}
                                className="h-9 w-9"
                            >
                                <RefreshCw size={14} />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Reviews Table */}
                <Card className="shadow-sm border-border/50 overflow-hidden">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Loading reviews...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-20">
                            <p className="text-destructive mb-4">{error}</p>
                            <Button onClick={fetchReviews}>Retry</Button>
                        </div>
                    ) : filteredReviews.length === 0 ? (
                        <div className="text-center py-20 text-muted-foreground">
                            <MessageSquare size={40} className="mx-auto mb-4 opacity-30" />
                            <p className="font-medium">{hasActiveFilters ? "No reviews match your filters" : "No reviews found"}</p>
                            {hasActiveFilters && (
                                <Button variant="link" onClick={clearFilters} className="mt-2">
                                    Clear all filters
                                </Button>
                            )}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/30 hover:bg-muted/30">
                                    <TableHead className="w-12 text-xs">#</TableHead>
                                    <TableHead className="w-28 text-xs">Rating</TableHead>
                                    <TableHead className="text-xs">Review</TableHead>
                                    <TableHead className="text-xs">
                                        <span className="flex items-center gap-1">✨ AI Summary</span>
                                    </TableHead>
                                    <TableHead className="w-28 text-xs">Date</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredReviews.map((review, index) => (
                                    <TableRow key={review.id} className="group">
                                        <TableCell className="text-muted-foreground text-sm tabular-nums">{index + 1}</TableCell>
                                        <TableCell>{renderStars(review.rating)}</TableCell>
                                        <TableCell>
                                            <p className="text-sm text-foreground line-clamp-2 max-w-xs">
                                                {review.review_text}
                                            </p>
                                        </TableCell>
                                        <TableCell>
                                            <p className="text-sm text-muted-foreground line-clamp-2 max-w-sm">
                                                {review.ai_summary || "Processing..."}
                                            </p>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">{formatDate(review.created_at)}</TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                onClick={() => setSelectedReview(review)}
                                                className="opacity-50 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Eye size={14} />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </Card>
            </div>

            {/* Review Detail Dialog */}
            <Dialog open={!!selectedReview} onOpenChange={(open) => !open && setSelectedReview(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
                    {selectedReview && (
                        <>
                            <DialogHeader className="p-6 border-b">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <DialogTitle className="text-xl">Review Details</DialogTitle>
                                        <DialogDescription className="flex items-center gap-2 mt-1">
                                            <Clock size={12} /> {formatDate(selectedReview.created_at)}
                                        </DialogDescription>
                                    </div>
                                    {renderStars(selectedReview.rating)}
                                </div>
                            </DialogHeader>

                            <ScrollArea className="flex-1">
                                <div className="p-6 space-y-6">
                                    <section>
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Customer Feedback</h4>
                                        <div className="bg-muted/50 p-4 rounded-xl border italic">
                                            "{selectedReview.review_text}"
                                        </div>
                                    </section>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <section>
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3 flex items-center gap-2">
                                                <Bot size={14} /> AI Summary
                                            </h4>
                                            <p className="text-sm leading-relaxed text-foreground/80">
                                                {selectedReview.ai_summary}
                                            </p>
                                        </section>

                                        <section>
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 mb-3 flex items-center gap-2">
                                                <TrendingUp size={14} /> Recommended Actions
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {(selectedReview.ai_actions || []).map((action, idx) => (
                                                    <Badge key={idx} variant="outline" className="bg-amber-500/5 border-amber-500/20 text-amber-500">
                                                        {action}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </section>
                                    </div>

                                    <Separator />

                                    <section>
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-500 mb-3 flex items-center gap-2">
                                            🤖 AI Response Sent
                                        </h4>
                                        <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10 text-sm leading-relaxed">
                                            {selectedReview.ai_response}
                                        </div>
                                    </section>
                                </div>
                            </ScrollArea>

                            <div className="p-4 border-t bg-muted/20 flex justify-end">
                                <Button onClick={() => setSelectedReview(null)}>Close</Button>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Footer */}
            <footer className="max-w-7xl mx-auto py-8 text-center" suppressHydrationWarning>
                <p className="text-xs text-muted-foreground">
                    Last updated: {lastRefresh.toLocaleTimeString()} · Built with Shadcn UI & Lucide Icons
                </p>
            </footer>
        </div>
    );
}

