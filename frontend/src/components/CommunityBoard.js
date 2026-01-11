import { useState, useContext, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AuthContext, API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { Users, MessageSquare, Heart, MessageCircle, Plus, Search, TrendingUp, Clock, Pin, Star, ChevronRight } from "lucide-react";

export default function CommunityBoard() {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewPost, setShowNewPost] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [newComment, setNewComment] = useState("");
  
  const [newPost, setNewPost] = useState({
    category: "general",
    title: "",
    content: "",
    tags: []
  });

  useEffect(() => {
    fetchCategories();
    fetchPosts();
  }, [activeCategory]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/community/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error("Failed to load categories");
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      let url = `${API}/community/posts`;
      const params = new URLSearchParams();
      if (activeCategory) params.append('category', activeCategory);
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await axios.get(`${url}?${params.toString()}`);
      setPosts(response.data);
    } catch (error) {
      console.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  const createPost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      toast.error("Please fill in title and content");
      return;
    }

    try {
      const response = await axios.post(
        `${API}/community/posts?user_email=${user.email}`,
        newPost
      );
      toast.success(`${response.data.message} +${response.data.points_earned} points!`);
      setShowNewPost(false);
      setNewPost({ category: "general", title: "", content: "", tags: [] });
      fetchPosts();
    } catch (error) {
      toast.error("Failed to create post");
    }
  };

  const likePost = async (postId) => {
    try {
      const response = await axios.post(
        `${API}/community/posts/${postId}/like?user_email=${user.email}`
      );
      toast.success(response.data.message);
      fetchPosts();
      if (selectedPost?.id === postId) {
        viewPost(postId);
      }
    } catch (error) {
      toast.error("Failed to like post");
    }
  };

  const viewPost = async (postId) => {
    try {
      const response = await axios.get(`${API}/community/posts/${postId}`);
      setSelectedPost(response.data);
    } catch (error) {
      toast.error("Failed to load post");
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await axios.post(
        `${API}/community/posts/${selectedPost.id}/comments?user_email=${user.email}`,
        { content: newComment }
      );
      toast.success(`${response.data.message} +${response.data.points_earned} points!`);
      setNewComment("");
      viewPost(selectedPost.id);
    } catch (error) {
      toast.error("Failed to add comment");
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const getCategoryIcon = (categoryId) => {
    const icons = {
      general: "💬", tips: "💡", routes: "🛣️", 
      parking: "🅿️", deals: "💰", questions: "❓", announcements: "📢"
    };
    return icons[categoryId] || "💬";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Community Board
          </h3>
          <p className="text-slate-600">Connect with fellow truckers</p>
        </div>
        <Button 
          onClick={() => setShowNewPost(true)}
          className="bg-blue-600 hover:bg-blue-700"
          data-testid="new-post-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Post
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && fetchPosts()}
            placeholder="Search posts..."
            className="pl-9"
          />
        </div>
        <Button onClick={fetchPosts} variant="outline">Search</Button>
      </div>

      {/* Categories */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={!activeCategory ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveCategory(null)}
          className={!activeCategory ? "bg-blue-600" : ""}
        >
          All
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={activeCategory === cat.id ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory(cat.id)}
            className={activeCategory === cat.id ? "bg-blue-600" : ""}
          >
            {cat.icon} {cat.name}
            {cat.count > 0 && (
              <Badge variant="secondary" className="ml-2">{cat.count}</Badge>
            )}
          </Button>
        ))}
      </div>

      {/* New Post Form */}
      {showNewPost && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle>Create New Post</CardTitle>
            <CardDescription>Share with the community (+20 points)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={newPost.category === cat.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNewPost(prev => ({ ...prev, category: cat.id }))}
                  >
                    {cat.icon} {cat.name}
                  </Button>
                ))}
              </div>
            </div>
            <Input
              value={newPost.title}
              onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Post title..."
              data-testid="post-title-input"
            />
            <Textarea
              value={newPost.content}
              onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
              placeholder="What's on your mind?"
              rows={4}
              data-testid="post-content-input"
            />
            <div className="flex gap-2">
              <Button onClick={createPost} className="bg-blue-600 hover:bg-blue-700">
                Post
              </Button>
              <Button variant="outline" onClick={() => setShowNewPost(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Post Detail View */}
      {selectedPost && (
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{getCategoryIcon(selectedPost.category)} {selectedPost.category}</Badge>
                  {selectedPost.is_pinned && <Badge className="bg-amber-500"><Pin className="w-3 h-3 mr-1" />Pinned</Badge>}
                </div>
                <CardTitle>{selectedPost.title}</CardTitle>
                <CardDescription>
                  by {selectedPost.author_name} • {formatTime(selectedPost.created_at)}
                </CardDescription>
              </div>
              <Button variant="ghost" onClick={() => setSelectedPost(null)}>✕</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-700 whitespace-pre-wrap">{selectedPost.content}</p>
            
            <div className="flex items-center gap-4 pt-4 border-t">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => likePost(selectedPost.id)}
                className={selectedPost.liked_by?.includes(user.email) ? "text-red-500" : ""}
              >
                <Heart className={`w-4 h-4 mr-1 ${selectedPost.liked_by?.includes(user.email) ? "fill-red-500" : ""}`} />
                {selectedPost.likes || 0}
              </Button>
              <span className="text-sm text-slate-500">
                <MessageCircle className="w-4 h-4 inline mr-1" />
                {selectedPost.comments?.length || 0} comments
              </span>
            </div>

            {/* Comments */}
            <div className="space-y-3 pt-4 border-t">
              <h4 className="font-medium">Comments</h4>
              {selectedPost.comments?.length === 0 ? (
                <p className="text-slate-400 text-sm">No comments yet. Be the first!</p>
              ) : (
                selectedPost.comments?.map((comment) => (
                  <div key={comment.id} className="bg-slate-50 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-sm">{comment.author_name}</span>
                      <span className="text-xs text-slate-400">{formatTime(comment.created_at)}</span>
                    </div>
                    <p className="text-sm text-slate-700">{comment.content}</p>
                  </div>
                ))
              )}
              
              {/* Add Comment */}
              <div className="flex gap-2 mt-4">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  onKeyPress={(e) => e.key === 'Enter' && addComment()}
                />
                <Button onClick={addComment} className="bg-blue-600">Post</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Posts List */}
      {!selectedPost && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-600">No posts yet</p>
                <p className="text-sm text-slate-400">Be the first to start a conversation!</p>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Card 
                key={post.id} 
                className="cursor-pointer hover:border-blue-300 transition-colors"
                onClick={() => viewPost(post.id)}
                data-testid={`community-post-${post.id}`}
              >
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {getCategoryIcon(post.category)} {post.category}
                        </Badge>
                        {post.is_pinned && <Pin className="w-3 h-3 text-amber-500" />}
                        {post.is_featured && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                      </div>
                      <h4 className="font-semibold text-slate-800 mb-1">{post.title}</h4>
                      <p className="text-sm text-slate-600 line-clamp-2">{post.content}</p>
                      <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                        <span>{post.author_name}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(post.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {post.likes || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          {post.comments_count || 0}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
