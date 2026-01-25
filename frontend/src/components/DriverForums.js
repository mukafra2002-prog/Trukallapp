import { useState, useEffect, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { AuthContext, API } from '@/App';
import axios from 'axios';
import { 
  MessageSquare, Plus, ThumbsUp, MessageCircle, Clock,
  Tag, Filter, Search, User, TrendingUp, Pin
} from 'lucide-react';

const FORUM_CATEGORIES = [
  { id: 'general', label: 'General Discussion', color: 'bg-blue-500', icon: '💬' },
  { id: 'routes', label: 'Routes & Tips', color: 'bg-green-500', icon: '🛣️' },
  { id: 'equipment', label: 'Equipment & Gear', color: 'bg-orange-500', icon: '🔧' },
  { id: 'regulations', label: 'Regulations & DOT', color: 'bg-red-500', icon: '📋' },
  { id: 'jobs', label: 'Jobs & Opportunities', color: 'bg-purple-500', icon: '💼' },
  { id: 'lifestyle', label: 'Trucker Lifestyle', color: 'bg-teal-500', icon: '🚛' },
];

export default function DriverForums() {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showNewPost, setShowNewPost] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'general' });
  const [selectedPost, setSelectedPost] = useState(null);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const url = selectedCategory === 'all' 
        ? `${API}/forums/posts`
        : `${API}/forums/posts?category=${selectedCategory}`;
      const response = await axios.get(url);
      setPosts(response.data || []);
    } catch (error) {
      // Use demo data if API not available
      setPosts(getDemoPosts());
    } finally {
      setLoading(false);
    }
  };

  const getDemoPosts = () => [
    {
      id: '1',
      title: 'Best truck stops on I-40?',
      content: 'Heading from Memphis to Albuquerque next week. Any recommendations for good truck stops with clean showers and decent food?',
      category: 'routes',
      author: 'RoadRunner_Mike',
      author_id: 'demo1',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      likes: 24,
      comments: [
        { id: 'c1', author: 'TruckerTom', content: 'Love\'s in Amarillo is solid!', created_at: new Date().toISOString() },
        { id: 'c2', author: 'HighwayQueen', content: 'Flying J at exit 233 has great food', created_at: new Date().toISOString() }
      ],
      pinned: true
    },
    {
      id: '2', 
      title: 'New ELD regulations - what you need to know',
      content: 'FMCSA just updated some ELD requirements. Here\'s a breakdown of what changed and how it affects us...',
      category: 'regulations',
      author: 'ComplianceKing',
      author_id: 'demo2',
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      likes: 89,
      comments: [],
      pinned: true
    },
    {
      id: '3',
      title: 'Recommend a good dash cam?',
      content: 'Looking to upgrade my dash cam. Need something with good night vision and GPS. Budget around $200. What do you all use?',
      category: 'equipment',
      author: 'SafetyFirst_Dan',
      author_id: 'demo3',
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      likes: 45,
      comments: [
        { id: 'c3', author: 'GearHead', content: 'Garmin 66W is amazing for the price', created_at: new Date().toISOString() }
      ],
      pinned: false
    },
    {
      id: '4',
      title: 'How do you stay healthy on the road?',
      content: 'Been trucking for 5 years and my health has taken a hit. What are your tips for eating well and staying active?',
      category: 'lifestyle',
      author: 'HealthyHauler',
      author_id: 'demo4',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      likes: 112,
      comments: [],
      pinned: false
    }
  ];

  const createPost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      toast.error('Please fill in title and content');
      return;
    }

    const post = {
      id: Date.now().toString(),
      ...newPost,
      author: user?.name || 'Anonymous',
      author_id: user?.email || 'anon',
      created_at: new Date().toISOString(),
      likes: 0,
      comments: [],
      pinned: false
    };

    try {
      await axios.post(`${API}/forums/posts`, post);
      toast.success('Post created!');
    } catch {
      // Save locally if API fails
      const saved = JSON.parse(localStorage.getItem('trukall_forum_posts') || '[]');
      localStorage.setItem('trukall_forum_posts', JSON.stringify([post, ...saved]));
      toast.success('Post created (saved locally)');
    }

    setPosts([post, ...posts]);
    setNewPost({ title: '', content: '', category: 'general' });
    setShowNewPost(false);
  };

  const likePost = async (postId) => {
    setPosts(posts.map(p => 
      p.id === postId ? { ...p, likes: p.likes + 1 } : p
    ));
    toast.success('Liked!');
  };

  const addComment = async () => {
    if (!newComment.trim() || !selectedPost) return;

    const comment = {
      id: Date.now().toString(),
      author: user?.name || 'Anonymous',
      content: newComment,
      created_at: new Date().toISOString()
    };

    setPosts(posts.map(p => 
      p.id === selectedPost.id 
        ? { ...p, comments: [...p.comments, comment] }
        : p
    ));
    setSelectedPost({ ...selectedPost, comments: [...selectedPost.comments, comment] });
    setNewComment('');
    toast.success('Comment added!');
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const filteredPosts = posts.filter(post => {
    if (searchQuery) {
      return post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             post.content.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const getCategoryInfo = (catId) => {
    return FORUM_CATEGORIES.find(c => c.id === catId) || FORUM_CATEGORIES[0];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-indigo-600" />
            Driver Forums
          </CardTitle>
          <CardDescription>
            Connect with fellow drivers. Share tips, ask questions, and help each other out.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Search & New Post */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search discussions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Button onClick={() => setShowNewPost(!showNewPost)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          New Post
        </Button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('all')}
          className={selectedCategory === 'all' ? 'bg-gray-800' : ''}
        >
          All Topics
        </Button>
        {FORUM_CATEGORIES.map(cat => (
          <Button
            key={cat.id}
            variant={selectedCategory === cat.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(cat.id)}
            className={selectedCategory === cat.id ? cat.color : ''}
          >
            {cat.icon} {cat.label}
          </Button>
        ))}
      </div>

      {/* New Post Form */}
      {showNewPost && (
        <Card className="border-indigo-300">
          <CardHeader>
            <CardTitle className="text-lg">Create New Post</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Category</label>
              <div className="flex gap-2 flex-wrap">
                {FORUM_CATEGORIES.map(cat => (
                  <Button
                    key={cat.id}
                    variant={newPost.category === cat.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewPost({...newPost, category: cat.id})}
                    className={newPost.category === cat.id ? cat.color : ''}
                  >
                    {cat.icon} {cat.label}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Title</label>
              <Input
                placeholder="What's on your mind?"
                value={newPost.title}
                onChange={(e) => setNewPost({...newPost, title: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Content</label>
              <Textarea
                placeholder="Share your thoughts, questions, or tips..."
                value={newPost.content}
                onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                rows={4}
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={createPost} className="flex-1 bg-indigo-600">
                Post Discussion
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
        <Card className="border-2 border-indigo-300">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {selectedPost.pinned && <Pin className="w-4 h-4 text-indigo-500" />}
                  <Badge className={getCategoryInfo(selectedPost.category).color}>
                    {getCategoryInfo(selectedPost.category).icon} {getCategoryInfo(selectedPost.category).label}
                  </Badge>
                </div>
                <CardTitle>{selectedPost.title}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <User className="w-3 h-3" /> {selectedPost.author}
                  <Clock className="w-3 h-3 ml-2" /> {getTimeAgo(selectedPost.created_at)}
                </CardDescription>
              </div>
              <Button variant="ghost" onClick={() => setSelectedPost(null)}>✕</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 whitespace-pre-wrap">{selectedPost.content}</p>
            
            <div className="flex items-center gap-4 pt-4 border-t">
              <Button variant="ghost" size="sm" onClick={() => likePost(selectedPost.id)}>
                <ThumbsUp className="w-4 h-4 mr-1" /> {selectedPost.likes}
              </Button>
              <span className="text-sm text-gray-500">
                <MessageCircle className="w-4 h-4 inline mr-1" />
                {selectedPost.comments.length} comments
              </span>
            </div>

            {/* Comments */}
            <div className="space-y-3 pt-4">
              <h4 className="font-semibold">Comments</h4>
              {selectedPost.comments.length === 0 ? (
                <p className="text-gray-500 text-sm">No comments yet. Be the first!</p>
              ) : (
                selectedPost.comments.map(comment => (
                  <div key={comment.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{comment.author}</span>
                      <span className="text-xs text-gray-400">{getTimeAgo(comment.created_at)}</span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.content}</p>
                  </div>
                ))
              )}
              
              {/* Add Comment */}
              <div className="flex gap-2 mt-4">
                <Input
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addComment()}
                />
                <Button onClick={addComment} className="bg-indigo-600">Reply</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Posts List */}
      {!selectedPost && (
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading discussions...</div>
          ) : filteredPosts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-gray-500">No discussions found</p>
                <Button variant="outline" className="mt-3" onClick={() => setShowNewPost(true)}>
                  Start a Discussion
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredPosts.map(post => (
              <Card 
                key={post.id}
                className={`cursor-pointer hover:shadow-md transition-shadow ${post.pinned ? 'border-indigo-300 bg-indigo-50/30' : ''}`}
                onClick={() => setSelectedPost(post)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {post.pinned && <Pin className="w-4 h-4 text-indigo-500" />}
                        <Badge className={`${getCategoryInfo(post.category).color} text-xs`}>
                          {getCategoryInfo(post.category).icon}
                        </Badge>
                        <span className="text-xs text-gray-500">{post.author}</span>
                        <span className="text-xs text-gray-400">• {getTimeAgo(post.created_at)}</span>
                      </div>
                      <h3 className="font-semibold mb-1">{post.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{post.content}</p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4" /> {post.likes}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <MessageCircle className="w-4 h-4" /> {post.comments.length}
                      </div>
                    </div>
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
