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
import { GraduationCap, Star, Users, MessageCircle, Check, X, Clock, ChevronRight } from "lucide-react";

export default function MentorSystem() {
  const { user } = useContext(AuthContext);
  const [mentors, setMentors] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [isMentor, setIsMentor] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [requestMessage, setRequestMessage] = useState("");

  const [registerForm, setRegisterForm] = useState({
    years_experience: 5,
    specialties: [],
    bio: ""
  });

  const specialtyOptions = [
    { id: "long_haul", name: "Long Haul" },
    { id: "regional", name: "Regional" },
    { id: "local", name: "Local" },
    { id: "flatbed", name: "Flatbed" },
    { id: "hazmat", name: "Hazmat" },
    { id: "refrigerated", name: "Refrigerated" },
    { id: "tanker", name: "Tanker" },
    { id: "owner_operator", name: "Owner Operator" }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [mentorsRes, myReqRes, incomingRes] = await Promise.all([
        axios.get(`${API}/mentors`),
        axios.get(`${API}/mentors/requests/${user.email}?role=mentee`),
        axios.get(`${API}/mentors/requests/${user.email}?role=mentor`)
      ]);
      
      setMentors(mentorsRes.data);
      setMyRequests(myReqRes.data);
      setIncomingRequests(incomingRes.data);
      
      // Check if user is already a mentor
      const isMentorCheck = mentorsRes.data.some(m => m.mentor_email === user.email);
      setIsMentor(isMentorCheck);
    } catch (error) {
      console.error("Failed to load mentor data");
    } finally {
      setLoading(false);
    }
  };

  const registerAsMentor = async () => {
    if (!registerForm.bio.trim() || registerForm.specialties.length === 0) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const params = new URLSearchParams({
        years_experience: registerForm.years_experience,
        bio: registerForm.bio,
        user_email: user.email
      });
      registerForm.specialties.forEach(s => params.append('specialties', s));
      
      const response = await axios.post(`${API}/mentors/register?${params.toString()}`);
      toast.success(`${response.data.message} +${response.data.points_earned} points!`);
      setShowRegister(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Registration failed");
    }
  };

  const requestMentor = async () => {
    if (!requestMessage.trim()) {
      toast.error("Please write a message");
      return;
    }

    try {
      const response = await axios.post(
        `${API}/mentors/request?mentor_email=${selectedMentor.mentor_email}&message=${encodeURIComponent(requestMessage)}&user_email=${user.email}`
      );
      toast.success(response.data.message);
      setSelectedMentor(null);
      setRequestMessage("");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Request failed");
    }
  };

  const respondToRequest = async (requestId, status) => {
    try {
      const response = await axios.put(
        `${API}/mentors/requests/${requestId}/respond?status=${status}&user_email=${user.email}`
      );
      toast.success(response.data.message);
      fetchData();
    } catch (error) {
      toast.error("Response failed");
    }
  };

  const toggleSpecialty = (id) => {
    setRegisterForm(prev => ({
      ...prev,
      specialties: prev.specialties.includes(id)
        ? prev.specialties.filter(s => s !== id)
        : [...prev.specialties, id]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-blue-600" />
            Mentor Program
          </h3>
          <p className="text-slate-600">Connect with experienced drivers</p>
        </div>
        {!isMentor && (
          <Button 
            onClick={() => setShowRegister(true)}
            className="bg-blue-600 hover:bg-blue-700"
            data-testid="become-mentor-btn"
          >
            <GraduationCap className="w-4 h-4 mr-2" />
            Become a Mentor
          </Button>
        )}
      </div>

      {/* Mentor Registration Form */}
      {showRegister && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle>Register as Mentor</CardTitle>
            <CardDescription>Share your experience and earn points (+100 for registering)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Years of Experience</Label>
              <Input
                type="number"
                min="1"
                value={registerForm.years_experience}
                onChange={(e) => setRegisterForm(prev => ({ ...prev, years_experience: parseInt(e.target.value) }))}
              />
            </div>
            
            <div>
              <Label className="mb-2 block">Specialties (select all that apply)</Label>
              <div className="flex flex-wrap gap-2">
                {specialtyOptions.map((spec) => (
                  <Button
                    key={spec.id}
                    variant={registerForm.specialties.includes(spec.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleSpecialty(spec.id)}
                    className={registerForm.specialties.includes(spec.id) ? "bg-blue-600" : ""}
                  >
                    {spec.name}
                  </Button>
                ))}
              </div>
            </div>
            
            <div>
              <Label>Bio / About You</Label>
              <Textarea
                value={registerForm.bio}
                onChange={(e) => setRegisterForm(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell new drivers about your experience..."
                rows={3}
              />
            </div>
            
            <div className="flex gap-2">
              <Button onClick={registerAsMentor} className="bg-blue-600">Register</Button>
              <Button variant="outline" onClick={() => setShowRegister(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Incoming Requests (for mentors) */}
      {incomingRequests.filter(r => r.status === "pending").length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-800">Pending Mentee Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {incomingRequests.filter(r => r.status === "pending").map((req) => (
                <div key={req.id} className="bg-white p-4 rounded-lg border">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{req.mentee_name}</p>
                      <p className="text-sm text-slate-600">{req.message}</p>
                    </div>
                    <Badge variant="outline" className="text-amber-600">Pending</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => respondToRequest(req.id, "accepted")}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4 mr-1" /> Accept
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => respondToRequest(req.id, "declined")}
                      className="text-red-600 border-red-300"
                    >
                      <X className="w-4 h-4 mr-1" /> Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* My Requests */}
      {myRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>My Mentor Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {myRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium">To: {req.mentor_email}</p>
                    <p className="text-sm text-slate-500">{req.message}</p>
                  </div>
                  <Badge className={
                    req.status === "accepted" ? "bg-green-500" :
                    req.status === "declined" ? "bg-red-500" : "bg-amber-500"
                  }>
                    {req.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Request Mentor Modal */}
      {selectedMentor && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle>Request {selectedMentor.mentor_name} as Mentor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              placeholder="Introduce yourself and explain what you'd like help with..."
              rows={3}
            />
            <div className="flex gap-2">
              <Button onClick={requestMentor} className="bg-blue-600">Send Request</Button>
              <Button variant="outline" onClick={() => setSelectedMentor(null)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Mentors */}
      <Card>
        <CardHeader>
          <CardTitle>Available Mentors</CardTitle>
          <CardDescription>Experienced drivers ready to help</CardDescription>
        </CardHeader>
        <CardContent>
          {mentors.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <GraduationCap className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No mentors available yet</p>
              <p className="text-sm">Be the first to register!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mentors.map((mentor) => (
                <Card key={mentor.id} className="hover:border-blue-300 transition-colors">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-lg">{mentor.mentor_name}</h4>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <span>{mentor.years_experience} years exp</span>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                            {mentor.rating}
                          </div>
                        </div>
                      </div>
                      <Badge className={
                        mentor.availability === "available" ? "bg-green-500" : "bg-slate-400"
                      }>
                        {mentor.availability}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-slate-600 mb-3">{mentor.bio}</p>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      {mentor.specialties?.map((spec) => (
                        <Badge key={spec} variant="outline" className="text-xs">{spec}</Badge>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">
                        <Users className="w-4 h-4 inline mr-1" />
                        {mentor.total_mentees} mentees
                      </span>
                      {mentor.mentor_email !== user.email && (
                        <Button 
                          size="sm"
                          onClick={() => setSelectedMentor(mentor)}
                          className="bg-blue-600"
                        >
                          <MessageCircle className="w-4 h-4 mr-1" />
                          Request
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
  );
}
