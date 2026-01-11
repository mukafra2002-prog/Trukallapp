import { useState, useContext, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { AuthContext, API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { Camera, Star, Upload, X, ThumbsUp, Image, MapPin, Shield, Sparkles, Trash2 } from "lucide-react";

export default function PhotoReviews({ spotId, spotName }) {
  const { user } = useContext(AuthContext);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  
  const [formData, setFormData] = useState({
    rating: 5,
    comment: "",
    photos: [],
    cleanliness: 3,
    safety: 3,
    amenities: 3
  });

  useEffect(() => {
    if (spotId) {
      fetchReviews();
    }
  }, [spotId]);

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${API}/reviews/photo/${spotId}`);
      setReviews(response.data);
    } catch (error) {
      console.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newPhotos = [...formData.photos];

    for (const file of files) {
      // Convert to base64 for preview (in production, upload to cloud storage)
      const reader = new FileReader();
      reader.onload = (event) => {
        newPhotos.push(event.target.result);
        setFormData(prev => ({ ...prev, photos: [...newPhotos] }));
      };
      reader.readAsDataURL(file);
    }
    
    setUploading(false);
    toast.success("Photos added!");
  };

  const removePhoto = (index) => {
    const newPhotos = formData.photos.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, photos: newPhotos }));
  };

  const submitReview = async () => {
    if (!formData.comment.trim()) {
      toast.error("Please write a comment");
      return;
    }

    try {
      const response = await axios.post(
        `${API}/reviews/photo?driver_email=${user.email}`,
        {
          spot_id: spotId,
          rating: formData.rating,
          comment: formData.comment,
          photos: formData.photos,
          cleanliness: formData.cleanliness,
          safety: formData.safety,
          amenities: formData.amenities
        }
      );
      
      toast.success(`Review submitted! +${response.data.points_earned || 10} points`);
      setShowForm(false);
      setFormData({
        rating: 5,
        comment: "",
        photos: [],
        cleanliness: 3,
        safety: 3,
        amenities: 3
      });
      fetchReviews();
    } catch (error) {
      toast.error("Failed to submit review");
    }
  };

  const markHelpful = async (reviewId) => {
    try {
      await axios.post(`${API}/reviews/${reviewId}/helpful?driver_email=${user.email}`);
      toast.success("Marked as helpful!");
      fetchReviews();
    } catch (error) {
      toast.error("Failed to mark as helpful");
    }
  };

  const StarRating = ({ value, onChange, size = "md" }) => {
    const sizes = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-8 h-8" };
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange?.(star)}
            className={`${onChange ? 'cursor-pointer hover:scale-110' : ''} transition-transform`}
          >
            <Star
              className={`${sizes[size]} ${
                star <= value 
                  ? 'text-yellow-500 fill-yellow-500' 
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Camera className="w-6 h-6 text-blue-600" />
            Photo Reviews
          </h3>
          <p className="text-slate-600">See real photos from drivers</p>
        </div>
        <Button 
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700"
          data-testid="add-photo-review-btn"
        >
          <Camera className="w-4 h-4 mr-2" />
          Add Review
        </Button>
      </div>

      {/* Review Form */}
      {showForm && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle>Write a Review</CardTitle>
            <CardDescription>Share your experience with photos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Overall Rating */}
            <div>
              <Label className="mb-2 block">Overall Rating</Label>
              <StarRating 
                value={formData.rating} 
                onChange={(v) => setFormData(prev => ({ ...prev, rating: v }))} 
                size="lg"
              />
            </div>

            {/* Category Ratings */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-sm flex items-center gap-1 mb-1">
                  <Sparkles className="w-4 h-4 text-cyan-500" />
                  Cleanliness
                </Label>
                <StarRating 
                  value={formData.cleanliness} 
                  onChange={(v) => setFormData(prev => ({ ...prev, cleanliness: v }))} 
                  size="sm"
                />
              </div>
              <div>
                <Label className="text-sm flex items-center gap-1 mb-1">
                  <Shield className="w-4 h-4 text-green-500" />
                  Safety
                </Label>
                <StarRating 
                  value={formData.safety} 
                  onChange={(v) => setFormData(prev => ({ ...prev, safety: v }))} 
                  size="sm"
                />
              </div>
              <div>
                <Label className="text-sm flex items-center gap-1 mb-1">
                  <MapPin className="w-4 h-4 text-purple-500" />
                  Amenities
                </Label>
                <StarRating 
                  value={formData.amenities} 
                  onChange={(v) => setFormData(prev => ({ ...prev, amenities: v }))} 
                  size="sm"
                />
              </div>
            </div>

            {/* Comment */}
            <div>
              <Label>Your Review</Label>
              <Textarea
                value={formData.comment}
                onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Tell other drivers about your experience..."
                rows={3}
                data-testid="review-comment-input"
              />
            </div>

            {/* Photo Upload */}
            <div>
              <Label className="mb-2 block">Add Photos</Label>
              <div className="flex flex-wrap gap-3">
                {/* Uploaded Photos Preview */}
                {formData.photos.map((photo, idx) => (
                  <div key={idx} className="relative w-24 h-24">
                    <img 
                      src={photo} 
                      alt={`Upload ${idx + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                {/* Upload Button */}
                <label className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                  <Upload className="w-6 h-6 text-slate-400" />
                  <span className="text-xs text-slate-400 mt-1">Add Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                    data-testid="photo-upload-input"
                  />
                </label>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-2">
              <Button 
                onClick={submitReview}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={uploading}
                data-testid="submit-review-btn"
              >
                Submit Review
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : reviews.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Image className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-600">No photo reviews yet</p>
              <p className="text-sm text-slate-400">Be the first to share your experience!</p>
            </CardContent>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id} data-testid={`photo-review-${review.id}`}>
              <CardContent className="pt-4">
                {/* Review Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold">{review.driver_name}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <StarRating value={review.rating} size="sm" />
                </div>

                {/* Photos Grid */}
                {review.photos && review.photos.length > 0 && (
                  <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                    {review.photos.map((photo, idx) => (
                      <img
                        key={idx}
                        src={photo}
                        alt={`Review photo ${idx + 1}`}
                        className="w-32 h-24 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setSelectedImage(photo)}
                      />
                    ))}
                  </div>
                )}

                {/* Comment */}
                <p className="text-slate-700 mb-3">{review.comment}</p>

                {/* Category Ratings */}
                <div className="flex gap-4 text-sm text-slate-500 mb-3">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> {review.cleanliness}/5
                  </span>
                  <span className="flex items-center gap-1">
                    <Shield className="w-3 h-3" /> {review.safety}/5
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {review.amenities}/5
                  </span>
                </div>

                {/* Helpful Button */}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => markHelpful(review.id)}
                  className="text-slate-500 hover:text-blue-600"
                >
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  Helpful ({review.helpful_count || 0})
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Image Lightbox */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <img 
            src={selectedImage} 
            alt="Full size" 
            className="max-w-full max-h-full rounded-lg"
          />
        </div>
      )}
    </div>
  );
}
