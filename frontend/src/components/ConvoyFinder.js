import { useState, useEffect, useContext } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AuthContext, API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { Users, MapPin, Calendar, ArrowRight, Plus, MessageCircle } from "lucide-react";

export default function ConvoyFinder() {
  const { user } = useContext(AuthContext);
  const [convoys, setConvoys] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("General");
  const [newMessage, setNewMessage] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [newConvoy, setNewConvoy] = useState({
    origin_city: "",
    origin_state: "",
    destination_city: "",
    destination_state: "",
    departure_date: "",
    message: "",
    max_drivers: 5
  });

  useEffect(() => {
    fetchConvoys();
    fetchChatMessages();
    
    // Poll for new messages every 5 seconds
    const interval = setInterval(fetchChatMessages, 5000);
    return () => clearInterval(interval);
  }, [selectedLocation]);

  const fetchConvoys = async () => {
    try {
      const response = await axios.get(`${API}/convoy/posts`);
      setConvoys(response.data);
    } catch (error) {
      toast.error("Failed to load convoy posts");
    } finally {
      setLoading(false);
    }
  };

  const fetchChatMessages = async () => {
    try {
      const response = await axios.get(`${API}/chat/${selectedLocation}`);
      setChatMessages(response.data);
    } catch (error) {
      console.error("Failed to load chat");
    }
  };

  const handleCreateConvoy = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to create convoy");
      return;
    }

    try {
      await axios.post(`${API}/convoy/posts?driver_email=${user.email}`, {
        ...newConvoy,
        departure_date: new Date(newConvoy.departure_date).toISOString()
      });
      
      toast.success("Convoy post created! Other drivers can now join.");
      setShowCreateDialog(false);
      setNewConvoy({
        origin_city: "",
        origin_state: "",
        destination_city: "",
        destination_state: "",
        departure_date: "",
        message: "",
        max_drivers: 5
      });
      fetchConvoys();
    } catch (error) {
      toast.error("Failed to create convoy post");
    }
  };

  const handleJoinConvoy = async (postId) => {
    if (!user) {
      toast.error("Please login to join convoy");
      return;
    }

    try {
      await axios.post(`${API}/convoy/posts/${postId}/join?driver_email=${user.email}`);
      toast.success("Joined convoy! Safe travels together.");
      fetchConvoys();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to join convoy");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!user || !newMessage.trim()) return;

    try {
      await axios.post(`${API}/chat?driver_email=${user.email}`, {
        location_name: selectedLocation,
        message: newMessage,
        message_type: "chat"
      });
      
      setNewMessage("");
      fetchChatMessages();
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Convoy Posts */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Find Convoy
                </CardTitle>
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="btn-primary" data-testid="create-convoy-btn">
                      <Plus className="w-4 h-4 mr-2" />
                      Create
                    </Button>
                  </DialogTrigger>
                  <DialogContent data-testid="create-convoy-dialog">
                    <DialogHeader>
                      <DialogTitle>Create Convoy Post</DialogTitle>
                      <DialogDescription>Find other drivers on your route for safety</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateConvoy} className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Origin City</Label>
                          <Input
                            value={newConvoy.origin_city}
                            onChange={(e) => setNewConvoy({ ...newConvoy, origin_city: e.target.value })}
                            placeholder="Dallas"
                            required
                            data-testid="origin-city"
                          />
                        </div>
                        <div>
                          <Label>State</Label>
                          <Input
                            value={newConvoy.origin_state}
                            onChange={(e) => setNewConvoy({ ...newConvoy, origin_state: e.target.value })}
                            placeholder="TX"
                            maxLength="2"
                            required
                            data-testid="origin-state"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Destination City</Label>
                          <Input
                            value={newConvoy.destination_city}
                            onChange={(e) => setNewConvoy({ ...newConvoy, destination_city: e.target.value })}
                            placeholder="Atlanta"
                            required
                            data-testid="dest-city"
                          />
                        </div>
                        <div>
                          <Label>State</Label>
                          <Input
                            value={newConvoy.destination_state}
                            onChange={(e) => setNewConvoy({ ...newConvoy, destination_state: e.target.value })}
                            placeholder="GA"
                            maxLength="2"
                            required
                            data-testid="dest-state"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Departure Date & Time</Label>
                        <input
                          type="datetime-local"
                          value={newConvoy.departure_date}
                          onChange={(e) => setNewConvoy({ ...newConvoy, departure_date: e.target.value })}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          required
                          data-testid="departure-date"
                        />
                      </div>

                      <div>
                        <Label>Max Drivers (including you)</Label>
                        <Input
                          type="number"
                          min="2"
                          max="10"
                          value={newConvoy.max_drivers}
                          onChange={(e) => setNewConvoy({ ...newConvoy, max_drivers: parseInt(e.target.value) })}
                          required
                          data-testid="max-drivers"
                        />
                      </div>

                      <div>
                        <Label>Message</Label>
                        <Textarea
                          value={newConvoy.message}
                          onChange={(e) => setNewConvoy({ ...newConvoy, message: e.target.value })}
                          placeholder="Looking for drivers heading to Atlanta. I drive safe and steady."
                          rows={3}
                          required
                          data-testid="convoy-message"
                        />
                      </div>

                      <Button type="submit" className="w-full btn-primary" data-testid="submit-convoy-btn">
                        Create Convoy Post
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <CardDescription>Team up with other drivers for safer travels</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center text-muted-foreground py-4">Loading convoys...</p>
              ) : convoys.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No active convoy posts. Be the first!</p>
              ) : (
                <div className="space-y-3">
                  {convoys.map((convoy) => (
                    <Card key={convoy.id} className="bg-accent/30" data-testid={`convoy-${convoy.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-bold">{convoy.driver_name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <MapPin className="w-3 h-3" />
                              <span>{convoy.origin_city}, {convoy.origin_state}</span>
                              <ArrowRight className="w-3 h-3" />
                              <span>{convoy.destination_city}, {convoy.destination_state}</span>
                            </div>
                          </div>
                          <Badge className={convoy.status === 'open' ? 'bg-secondary/20 text-secondary' : 'bg-muted'}>
                            {convoy.current_drivers}/{convoy.max_drivers}
                          </Badge>
                        </div>
                        
                        <p className="text-sm mb-3">{convoy.message}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {new Date(convoy.departure_date).toLocaleString()}
                          </div>
                          {convoy.status === 'open' && user?.email !== convoy.driver_email && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleJoinConvoy(convoy.id)}
                              data-testid={`join-convoy-${convoy.id}`}
                            >
                              <Users className="w-3 h-3 mr-1" />
                              Join
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Live Chat */}
        <div className="space-y-4">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                Driver Chat
              </CardTitle>
              <CardDescription>Talk to drivers in real-time</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {/* Location Selector */}
              <div className="mb-4">
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  data-testid="chat-location-select"
                >
                  <option value="General">General Chat</option>
                  <option value="Dallas">Dallas, TX</option>
                  <option value="Atlanta">Atlanta, GA</option>
                  <option value="Chicago">Chicago, IL</option>
                  <option value="Phoenix">Phoenix, AZ</option>
                </select>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-2 mb-4 bg-accent/20 rounded-lg p-3" data-testid="chat-messages">
                {chatMessages.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">No messages yet. Start the conversation!</p>
                ) : (
                  chatMessages.map((msg) => (
                    <div key={msg.id} className="text-sm" data-testid={`chat-msg-${msg.id}`}>
                      <span className="font-bold text-primary">{msg.driver_name}:</span>{" "}
                      <span>{msg.message}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Send Message */}
              {user && (
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    data-testid="chat-input"
                  />
                  <Button type="submit" data-testid="send-message-btn">Send</Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
