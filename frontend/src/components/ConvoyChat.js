import { useState, useEffect, useContext, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthContext, API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { MessageCircle, Send, MapPin, Image, AlertTriangle, Users, ArrowLeft } from "lucide-react";

export default function ConvoyChat({ convoyId, convoyInfo, onBack }) {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (convoyId) {
      fetchMessages();
      // Poll for new messages every 3 seconds
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [convoyId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API}/convoy/${convoyId}/messages`);
      setMessages(response.data);
    } catch (error) {
      console.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await axios.post(
        `${API}/convoy/${convoyId}/messages?driver_email=${user.email}`,
        { message: newMessage, message_type: "text" }
      );
      setNewMessage("");
      fetchMessages();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const shareLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const locationMessage = `📍 Shared location: https://www.google.com/maps?q=${position.coords.latitude},${position.coords.longitude}`;
        try {
          await axios.post(
            `${API}/convoy/${convoyId}/messages?driver_email=${user.email}`,
            { message: locationMessage, message_type: "location" }
          );
          fetchMessages();
          toast.success("Location shared!");
        } catch (error) {
          toast.error("Failed to share location");
        }
      },
      () => toast.error("Unable to get location")
    );
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isOwnMessage = (msg) => msg.sender_email === user?.email;

  return (
    <Card className="flex flex-col h-[600px] bg-white">
      {/* Chat Header */}
      <CardHeader className="border-b bg-blue-50 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {convoyInfo?.origin_city} → {convoyInfo?.destination_city}
              </CardTitle>
              <p className="text-sm text-slate-600">
                {convoyInfo?.current_drivers || 1} drivers in convoy
              </p>
            </div>
          </div>
          <Badge className="bg-green-500">Active</Badge>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {loading ? (
          <div className="text-center py-8 text-slate-500">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${isOwnMessage(msg) ? 'justify-end' : 'justify-start'}`}
              data-testid={`message-${msg.id}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  isOwnMessage(msg)
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : 'bg-white border border-slate-200 rounded-bl-md'
                }`}
              >
                {!isOwnMessage(msg) && (
                  <p className="text-xs font-semibold text-blue-600 mb-1">{msg.sender_name}</p>
                )}
                <p className={`text-sm ${msg.message_type === 'location' ? 'text-blue-400 underline cursor-pointer' : ''}`}>
                  {msg.message_type === 'location' ? (
                    <a 
                      href={msg.message.split(': ')[1]} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={isOwnMessage(msg) ? 'text-blue-200 hover:text-white' : 'text-blue-600 hover:text-blue-800'}
                    >
                      📍 View shared location
                    </a>
                  ) : (
                    msg.message
                  )}
                </p>
                <p className={`text-xs mt-1 ${isOwnMessage(msg) ? 'text-blue-200' : 'text-slate-400'}`}>
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </CardContent>

      {/* Message Input */}
      <div className="border-t p-4 bg-white">
        <form onSubmit={sendMessage} className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={shareLocation}
            title="Share Location"
            data-testid="share-location-chat-btn"
          >
            <MapPin className="w-5 h-5 text-blue-600" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            disabled={sending}
            data-testid="convoy-chat-input"
          />
          <Button 
            type="submit" 
            disabled={!newMessage.trim() || sending}
            className="bg-blue-600 hover:bg-blue-700"
            data-testid="send-message-btn"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
}
