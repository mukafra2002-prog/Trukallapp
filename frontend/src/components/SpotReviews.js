import { useState, useEffect, useContext } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AuthContext, API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { Star, Shield, Droplets, ThumbsUp, MessageSquare, CheckCircle } from "lucide-react";

export default function SpotReviews({ spotId, spotName }) {
  const { user } = useContext(AuthContext);
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [newReview, setNewReview] = useState({
    rating: 5,
    cleanliness_rating: 5,
    safety_rating: 5,
    amenities_rating: 5,
    comment: ""
  });

  useEffect(() => {
    fetchReviews();
    fetchSummary();
  }, [spotId]);

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${API}/reviews/spot/${spotId}`);
      setReviews(response.data);
    } catch (error) {
      console.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await axios.get(`${API}/reviews/summary/${spotId}`);
      setSummary(response.data);
    } catch (error) {
      console.error("Failed to load summary");
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to leave a review");
      return;
    }

    try {
      await axios.post(`${API}/reviews?driver_email=${user.email}`, {
        ...newReview,
        spot_id: spotId
      });
      
      toast.success("Review submitted! You earned 25 points! 🎉");
      setShowReviewDialog(false);
      setNewReview({
        rating: 5,
        cleanliness_rating: 5,
        safety_rating: 5,
        amenities_rating: 5,
        comment: ""
      });
      fetchReviews();
      fetchSummary();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to submit review");
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'fill-primary text-primary' : 'text-muted-foreground'}`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      {summary && summary.total_reviews > 0 && (
        <Card data-testid="reviews-summary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              {summary.average_rating} / 5.0
              <span className="text-sm font-normal text-muted-foreground">
                ({summary.total_reviews} reviews)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  {renderStars(Math.round(summary.cleanliness_avg))}
                </div>
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <Droplets className="w-3 h-3" />
                  Cleanliness
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  {renderStars(Math.round(summary.safety_avg))}
                </div>
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <Shield className="w-3 h-3" />
                  Safety
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  {renderStars(Math.round(summary.amenities_avg))}
                </div>
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <ThumbsUp className="w-3 h-3" />
                  Amenities
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leave Review Button */}
      {user?.role === 'driver' && (
        <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
          <DialogTrigger asChild>
            <Button className="w-full btn-primary" data-testid="leave-review-btn">
              <MessageSquare className="w-5 h-5 mr-2" />
              Leave a Review (Earn 25 Points!)
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="review-dialog">
            <DialogHeader>
              <DialogTitle>Review {spotName}</DialogTitle>
              <DialogDescription>Share your experience with other drivers</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Overall Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-8 h-8 cursor-pointer transition-colors ${
                        star <= newReview.rating ? 'fill-primary text-primary' : 'text-muted-foreground hover:text-primary'
                      }`}
                      onClick={() => setNewReview({ ...newReview, rating: star })}
                      data-testid={`star-${star}`}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block">Cleanliness</label>
                  <select
                    value={newReview.cleanliness_rating}
                    onChange={(e) => setNewReview({ ...newReview, cleanliness_rating: parseInt(e.target.value) })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                    data-testid="cleanliness-rating"
                  >
                    {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} ⭐</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Safety</label>
                  <select
                    value={newReview.safety_rating}
                    onChange={(e) => setNewReview({ ...newReview, safety_rating: parseInt(e.target.value) })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                    data-testid="safety-rating"
                  >
                    {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} ⭐</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Amenities</label>
                  <select
                    value={newReview.amenities_rating}
                    onChange={(e) => setNewReview({ ...newReview, amenities_rating: parseInt(e.target.value) })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                    data-testid="amenities-rating"
                  >
                    {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} ⭐</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Your Review</label>
                <Textarea
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  placeholder="Share details about your experience..."
                  rows={4}
                  required
                  data-testid="review-comment"
                />
              </div>

              <Button type="submit" className="w-full btn-primary" data-testid="submit-review-btn">
                Submit Review & Earn 25 Points
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Reviews List */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
            </CardContent>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id} data-testid={`review-${review.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold">{review.driver_name}</span>
                      {review.verified_booking && (
                        <Badge className="bg-secondary/20 text-secondary text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified Stay
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {renderStars(review.rating)}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm mt-2">{review.comment}</p>
                <div className="flex gap-3 mt-3 text-xs text-muted-foreground">
                  <span>Clean: {review.cleanliness_rating}⭐</span>
                  <span>Safe: {review.safety_rating}⭐</span>
                  <span>Amenities: {review.amenities_rating}⭐</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
