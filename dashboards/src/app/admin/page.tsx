"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { MessageSquare, Star, RefreshCw, Filter, Eye, Calendar, Search, X, Pause, Loader2, BarChart3 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ThemeSwitcher } from "@/components/theme-switcher";

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
                        className={star <= rating ? getStarColor(rating) : "text-muted-foreground/20"}
                    />
                ))}
            </div>
        );
    };

    const getRatingBarColor = (star: number) => {
        switch (star) {
            case 5: return "bg-green-500";
            case 4: return "bg-lime-500";
            case 3: return "bg-yellow-500";
            case 2: return "bg-orange-500";
            case 1: return "bg-red-500";
            default: return "bg-primary";
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 transition-colors duration-300">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
                <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
                            <BarChart3 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-foreground">Feedback Dashboard</h1>
                            <p className="text-xs text-muted-foreground">AI-powered insights</p>
                        </div>
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
                        <ThemeSwitcher />
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-6 space-y-5">
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Total Reviews */}
                    <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
                        <CardContent className="py-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Total Reviews</p>
                                    <p className="text-3xl font-bold text-foreground mt-1 tabular-nums">{total}</p>
                                </div>
                                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                    <MessageSquare className="text-primary" size={18} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Average Rating */}
                    <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
                        <CardContent className="py-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Average Rating</p>
                                    <div className="flex items-baseline gap-1 mt-1">
                                        <p className="text-3xl font-bold text-foreground tabular-nums">{averageRating}</p>
                                        <span className="text-sm text-muted-foreground">/ 5</span>
                                    </div>
                                </div>
                                <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                                    <Star className="text-amber-500 fill-amber-500" size={18} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Rating Distribution */}
                    <Card className="lg:col-span-3 shadow-sm border-border/50">
                        <CardContent className="py-5">
                            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Rating Distribution</h3>
                            <div className="space-y-2">
                                {[5, 4, 3, 2, 1].map((star, idx) => (
                                    <div key={star} className="flex items-center gap-3">
                                        <span className="text-xs text-muted-foreground w-4 text-right font-medium">{star}</span>
                                        <Star size={12} className={getRatingBarColor(star).replace("bg-", "text-")} />
                                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${getRatingBarColor(star)}`}
                                                style={{ width: `${maxCount > 0 ? (ratingCounts[idx] / maxCount) * 100 : 0}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-muted-foreground w-8 text-right tabular-nums font-medium">
                                            {ratingCounts[idx]}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card className="shadow-sm border-border/50">
                    <CardContent className="py-4">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <Filter size={16} className="text-muted-foreground" />
                                <span className="font-medium text-foreground text-sm">Filters</span>
                                {hasActiveFilters && (
                                    <Badge variant="default" className="text-xs">
                                        {filteredReviews.length} results
                                    </Badge>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                {/* Search Input */}
                                <div className="relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder="Search reviews..."
                                        value={searchText}
                                        onChange={(e) => setSearchText(e.target.value)}
                                        className="pl-9 w-44 h-9 text-sm"
                                    />
                                </div>

                                {/* Date Range Filter */}
                                <div className="relative">
                                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
                                    <Select value={filterDateRange} onValueChange={setFilterDateRange}>
                                        <SelectTrigger className="pl-9 w-32 h-9 text-sm">
                                            <SelectValue placeholder="All Time" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Time</SelectItem>
                                            <SelectItem value="today">Today</SelectItem>
                                            <SelectItem value="week">Last 7 Days</SelectItem>
                                            <SelectItem value="month">Last 30 Days</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Rating Filter */}
                                <div className="relative">
                                    <Star size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
                                    <Select value={filterRating} onValueChange={setFilterRating}>
                                        <SelectTrigger className="pl-9 w-28 h-9 text-sm">
                                            <SelectValue placeholder="Rating" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All</SelectItem>
                                            <SelectItem value="5">5 Stars</SelectItem>
                                            <SelectItem value="4">4 Stars</SelectItem>
                                            <SelectItem value="3">3 Stars</SelectItem>
                                            <SelectItem value="2">2 Stars</SelectItem>
                                            <SelectItem value="1">1 Star</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {hasActiveFilters && (
                                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 text-destructive hover:text-destructive hover:bg-destructive/10">
                                        <X size={14} />
                                        Clear
                                    </Button>
                                )}

                                <Button variant="outline" size="icon" onClick={fetchReviews} className="h-9 w-9">
                                    <RefreshCw size={14} />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

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
            </main>

            {/* Review Detail Dialog */}
            <Dialog open={!!selectedReview} onOpenChange={(open) => !open && setSelectedReview(null)}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                            Review Details
                            {selectedReview && (
                                <Badge variant="secondary" className="font-normal">
                                    {formatDate(selectedReview.created_at)}
                                </Badge>
                            )}
                        </DialogTitle>
                    </DialogHeader>
                    {selectedReview && (
                        <div className="space-y-5 pt-2">
                            <div className="flex items-center gap-3">
                                {renderStars(selectedReview.rating)}
                                <span className="text-sm text-muted-foreground">
                                    {selectedReview.rating === 5 ? "Excellent" :
                                        selectedReview.rating === 4 ? "Great" :
                                            selectedReview.rating === 3 ? "Good" :
                                                selectedReview.rating === 2 ? "Fair" : "Poor"}
                                </span>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-foreground">Customer Review</h4>
                                <p className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg leading-relaxed">{selectedReview.review_text}</p>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-primary flex items-center gap-2">
                                    ✨ AI Summary
                                </h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">{selectedReview.ai_summary}</p>
                            </div>

                            {selectedReview.ai_actions && selectedReview.ai_actions.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-amber-600 dark:text-amber-400 flex items-center gap-2">
                                        💡 Recommended Actions
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedReview.ai_actions.map((action, idx) => (
                                            <Badge key={idx} variant="secondary" className="font-normal">
                                                {action}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-2">
                                    🤖 AI Response to Customer
                                </h4>
                                <p className="text-sm text-muted-foreground bg-blue-500/5 border border-blue-500/20 p-4 rounded-lg leading-relaxed">
                                    {selectedReview.ai_response}
                                </p>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Footer */}
            <footer className="border-t bg-muted/20">
                <div className="max-w-7xl mx-auto py-4 px-6 flex items-center justify-between text-muted-foreground text-xs" suppressHydrationWarning>
                    <p>Fynd AI Feedback System</p>
                    <p>Last updated: {lastRefresh.toLocaleTimeString()}</p>
                </div>
            </footer>
        </div>
    );
}
