import { useState, useContext } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { AuthContext, API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { MessageSquare, Star, Bug, Lightbulb, Heart, AlertCircle, Send, ExternalLink } from "lucide-react";

export default function FeedbackForm() {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    feedback_type: "general",
    subject: "",
    message: "",
    rating: 0
  });

  const feedbackTypes = [
    { id: "general", label: "General", icon: MessageSquare, color: "bg-blue-500" },
    { id: "bug", label: "Bug Report", icon: Bug, color: "bg-red-500" },
    { id: "feature", label: "Feature Request", icon: Lightbulb, color: "bg-amber-500" },
    { id: "praise", label: "Praise", icon: Heart, color: "bg-pink-500" },
    { id: "complaint", label: "Complaint", icon: AlertCircle, color: "bg-orange-500" }
  ];

  const submitFeedback = async () => {
    if (!formData.subject.trim() || !formData.message.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API}/feedback?user_email=${user.email}`,
        formData
      );
      toast.success(`${response.data.message} +${response.data.points_earned} points!`);
      setSubmitted(true);
      setFormData({ feedback_type: "general", subject: "", message: "", rating: 0 });
    } catch (error) {
      toast.error("Failed to submit feedback");
    } finally {
      setLoading(false);
    }
  };

  const StarRating = ({ value, onChange }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="hover:scale-110 transition-transform"
        >
          <Star
            className={`w-8 h-8 ${
              star <= value 
                ? 'text-yellow-500 fill-yellow-500' 
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );

  if (submitted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="py-12 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">Thank You!</h3>
          <p className="text-slate-600 mb-6">Your feedback helps us improve TrukAll for all drivers.</p>
          <Button onClick={() => setSubmitted(false)} className="bg-blue-600 hover:bg-blue-700">
            Submit More Feedback
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            Send Feedback
          </h3>
          <p className="text-slate-600">Help us improve TrukAll</p>
        </div>
        <Badge className="bg-green-100 text-green-700">+25-50 points</Badge>
      </div>

      {/* Google Form Link (Optional) */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ExternalLink className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-800">Prefer Google Forms?</p>
                <p className="text-sm text-blue-600">Use our detailed feedback form</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="border-blue-300 text-blue-700"
              onClick={() => window.open('https://forms.gle/trukall-feedback', '_blank')}
            >
              Open Form
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Form */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Feedback</CardTitle>
          <CardDescription>Share your thoughts directly in the app</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Feedback Type */}
          <div>
            <Label className="mb-3 block">What type of feedback?</Label>
            <div className="flex flex-wrap gap-2">
              {feedbackTypes.map((type) => (
                <Button
                  key={type.id}
                  variant={formData.feedback_type === type.id ? "default" : "outline"}
                  onClick={() => setFormData(prev => ({ ...prev, feedback_type: type.id }))}
                  className={formData.feedback_type === type.id ? type.color : ""}
                  data-testid={`feedback-type-${type.id}`}
                >
                  <type.icon className="w-4 h-4 mr-2" />
                  {type.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <Label className="mb-3 block">How would you rate TrukAll?</Label>
            <StarRating 
              value={formData.rating} 
              onChange={(v) => setFormData(prev => ({ ...prev, rating: v }))} 
            />
          </div>

          {/* Subject */}
          <div>
            <Label>Subject *</Label>
            <Input
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Brief summary of your feedback"
              data-testid="feedback-subject"
            />
          </div>

          {/* Message */}
          <div>
            <Label>Your Feedback *</Label>
            <Textarea
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Tell us more details..."
              rows={5}
              data-testid="feedback-message"
            />
          </div>

          {/* Submit */}
          <Button 
            onClick={submitFeedback}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 h-12"
            data-testid="submit-feedback-btn"
          >
            {loading ? (
              "Submitting..."
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Feedback
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
