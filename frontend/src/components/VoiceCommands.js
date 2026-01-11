import { useState, useContext, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AuthContext, API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { Mic, MicOff, Search, MapPin, Fuel, Coffee, Navigation, Volume2, Loader2 } from "lucide-react";

export default function VoiceCommands() {
  const { user } = useContext(AuthContext);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check for Web Speech API support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setIsSupported(false);
      return;
    }

    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);

      if (finalTranscript) {
        processVoiceCommand(finalTranscript);
      }
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        toast.error("Microphone access denied. Please allow microphone access.");
      } else {
        toast.error(`Voice recognition error: ${event.error}`);
      }
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setTranscript("");
      setResults(null);
      recognitionRef.current?.start();
      setIsListening(true);
      toast.info("Listening... Say a command");
    }
  };

  const processVoiceCommand = async (command) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${API}/voice/search?query=${encodeURIComponent(command)}&driver_email=${user.email}`
      );
      setResults(response.data);
      
      // Text-to-speech response
      if (response.data.spoken_response && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(response.data.spoken_response);
        utterance.rate = 0.9;
        speechSynthesis.speak(utterance);
      }
      
      toast.success("Command processed!");
    } catch (error) {
      toast.error("Failed to process voice command");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const exampleCommands = [
    { icon: MapPin, text: "Find parking near Atlanta", color: "text-blue-600" },
    { icon: Fuel, text: "Cheapest fuel in Texas", color: "text-amber-600" },
    { icon: Coffee, text: "Rest stops on I-40", color: "text-green-600" },
    { icon: Navigation, text: "Route to Chicago", color: "text-purple-600" },
  ];

  if (!isSupported) {
    return (
      <div className="space-y-6">
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-6 text-center">
            <MicOff className="w-12 h-12 mx-auto mb-4 text-amber-500" />
            <h3 className="text-lg font-bold text-amber-700 mb-2">Voice Commands Not Supported</h3>
            <p className="text-amber-600">
              Your browser doesn't support voice recognition. Please use Chrome, Edge, or Safari for this feature.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Mic className="w-6 h-6 text-blue-600" />
            Voice Commands
          </h3>
          <p className="text-slate-600">Hands-free search and navigation</p>
        </div>
      </div>

      {/* Main Voice Interface */}
      <Card className="overflow-hidden">
        <CardContent className="p-8">
          <div className="flex flex-col items-center space-y-6">
            {/* Microphone Button */}
            <Button
              onClick={toggleListening}
              disabled={loading}
              className={`w-32 h-32 rounded-full transition-all duration-300 ${
                isListening 
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse shadow-lg shadow-red-500/50' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
              data-testid="voice-mic-btn"
            >
              {loading ? (
                <Loader2 className="w-12 h-12 animate-spin" />
              ) : isListening ? (
                <MicOff className="w-12 h-12" />
              ) : (
                <Mic className="w-12 h-12" />
              )}
            </Button>

            {/* Status Text */}
            <div className="text-center">
              {isListening ? (
                <Badge className="bg-red-500 animate-pulse">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
                    Listening...
                  </div>
                </Badge>
              ) : (
                <Badge variant="outline" className="text-slate-600">
                  Tap to speak
                </Badge>
              )}
            </div>

            {/* Transcript Display */}
            {transcript && (
              <div className="w-full max-w-md">
                <Card className="bg-slate-50">
                  <CardContent className="p-4">
                    <p className="text-sm text-slate-500 mb-1">You said:</p>
                    <p className="text-lg font-medium text-slate-800" data-testid="voice-transcript">
                      "{transcript}"
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Display */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-green-600" />
              Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {results.intent && (
              <Badge className="mb-4 bg-blue-100 text-blue-700">
                Intent: {results.intent}
              </Badge>
            )}
            
            {results.spoken_response && (
              <p className="text-slate-700 mb-4" data-testid="voice-response">
                {results.spoken_response}
              </p>
            )}

            {results.results && results.results.length > 0 && (
              <div className="space-y-2">
                {results.results.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                    <p className="font-medium">{item.name || item.title}</p>
                    {item.address && <p className="text-sm text-slate-500">{item.address}</p>}
                    {item.city && <p className="text-sm text-slate-500">{item.city}, {item.state}</p>}
                  </div>
                ))}
              </div>
            )}

            {results.action && (
              <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                <Navigation className="w-4 h-4 mr-2" />
                {results.action}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Example Commands */}
      <Card>
        <CardHeader>
          <CardTitle>Try these commands</CardTitle>
          <CardDescription>Say any of these to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {exampleCommands.map((cmd, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => {
                  setTranscript(cmd.text);
                  processVoiceCommand(cmd.text);
                }}
              >
                <cmd.icon className={`w-5 h-5 ${cmd.color}`} />
                <span className="text-slate-700">"{cmd.text}"</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h4 className="font-bold text-blue-700 mb-2">Voice Command Tips</h4>
          <ul className="text-sm text-blue-600 space-y-1">
            <li>• Speak clearly and at a moderate pace</li>
            <li>• Include location names for better results</li>
            <li>• Say "find parking", "cheapest fuel", or "rest stops" to search</li>
            <li>• Results will be read aloud automatically</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
