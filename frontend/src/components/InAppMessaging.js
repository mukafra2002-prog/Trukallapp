import { useState, useContext, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AuthContext, API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { MessageCircle, Send, User, Search, ArrowLeft, Check, CheckCheck, Circle } from "lucide-react";

export default function InAppMessaging() {
  const { user } = useContext(AuthContext);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [newRecipientEmail, setNewRecipientEmail] = useState("");

  useEffect(() => {
    fetchConversations();
    // Poll for new messages every 10 seconds
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.email);
    }
  }, [activeConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    try {
      const response = await axios.get(`${API}/messages/conversations/${user.email}`);
      setConversations(response.data);
    } catch (error) {
      console.error("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (partnerEmail) => {
    try {
      const response = await axios.get(`${API}/messages/${user.email}/${partnerEmail}`);
      setMessages(response.data);
    } catch (error) {
      console.error("Failed to load messages");
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return;

    try {
      await axios.post(
        `${API}/messages/send?driver_email=${user.email}`,
        {
          recipient_email: activeConversation.email,
          message: newMessage.trim(),
          message_type: "text"
        }
      );
      
      setNewMessage("");
      fetchMessages(activeConversation.email);
      fetchConversations();
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  const startNewConversation = () => {
    if (!newRecipientEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }
    
    setActiveConversation({
      email: newRecipientEmail.trim(),
      name: newRecipientEmail.trim().split('@')[0],
      unread_count: 0
    });
    setMessages([]);
    setShowNewChat(false);
    setNewRecipientEmail("");
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString();
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-blue-600" />
            Messages
          </h3>
          <p className="text-slate-600">Chat with other drivers</p>
        </div>
        <Button 
          onClick={() => setShowNewChat(true)}
          className="bg-blue-600 hover:bg-blue-700"
          data-testid="new-message-btn"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          New Message
        </Button>
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle>Start New Conversation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={newRecipientEmail}
                onChange={(e) => setNewRecipientEmail(e.target.value)}
                placeholder="Enter driver's email..."
                data-testid="new-chat-email-input"
              />
              <Button onClick={startNewConversation} className="bg-blue-600">
                Start
              </Button>
              <Button variant="outline" onClick={() => setShowNewChat(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
        {/* Conversations List */}
        <Card className={`overflow-hidden ${activeConversation ? 'hidden lg:block' : ''}`}>
          <CardHeader className="pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto" style={{ maxHeight: '500px' }}>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">No conversations yet</p>
                <p className="text-sm text-slate-400">Start a new message to connect with other drivers</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredConversations.map((conv) => (
                  <div
                    key={conv.email}
                    onClick={() => setActiveConversation(conv)}
                    className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${
                      activeConversation?.email === conv.email ? 'bg-blue-50' : ''
                    }`}
                    data-testid={`conversation-${conv.email}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">{conv.name || conv.email}</p>
                          {conv.last_message_time && (
                            <span className="text-xs text-slate-400">
                              {formatTime(conv.last_message_time)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 truncate">
                          {conv.last_message || 'No messages yet'}
                        </p>
                      </div>
                      {conv.unread_count > 0 && (
                        <Badge className="bg-blue-600 text-white">
                          {conv.unread_count}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat Window */}
        <Card className={`lg:col-span-2 flex flex-col ${!activeConversation && 'hidden lg:flex'}`}>
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <CardHeader className="border-b flex-shrink-0">
                <div className="flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="lg:hidden"
                    onClick={() => setActiveConversation(null)}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {activeConversation.name || activeConversation.email}
                    </CardTitle>
                    <CardDescription>{activeConversation.email}</CardDescription>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: '400px' }}>
                {messages.length === 0 ? (
                  <div className="text-center text-slate-400 py-8">
                    <p>No messages yet</p>
                    <p className="text-sm">Say hello!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_email === user.email;
                    return (
                      <div 
                        key={msg.id}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] ${
                          isMe 
                            ? 'bg-blue-600 text-white rounded-l-lg rounded-tr-lg' 
                            : 'bg-slate-100 text-slate-800 rounded-r-lg rounded-tl-lg'
                        } px-4 py-2`}>
                          <p>{msg.message}</p>
                          <div className={`flex items-center justify-end gap-1 mt-1 ${
                            isMe ? 'text-blue-200' : 'text-slate-400'
                          } text-xs`}>
                            <span>{formatTime(msg.created_at)}</span>
                            {isMe && (
                              msg.is_read 
                                ? <CheckCheck className="w-3 h-3" />
                                : <Check className="w-3 h-3" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="border-t p-4 flex-shrink-0">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="flex-1"
                    data-testid="message-input"
                  />
                  <Button 
                    onClick={sendMessage}
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={!newMessage.trim()}
                    data-testid="send-message-btn"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
