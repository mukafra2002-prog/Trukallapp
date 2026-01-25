import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Clock, Play, Pause, RotateCcw, Bell, Coffee,
  AlertTriangle, CheckCircle, Timer, Volume2, VolumeX
} from 'lucide-react';

const BREAK_TYPES = [
  { 
    id: '30min', 
    label: '30-Min Break', 
    duration: 30 * 60, 
    description: 'Required after 8 hours of driving',
    color: 'bg-blue-500'
  },
  { 
    id: '10hr', 
    label: '10-Hour Rest', 
    duration: 10 * 60 * 60, 
    description: 'Required off-duty period',
    color: 'bg-purple-500'
  },
  { 
    id: '34hr', 
    label: '34-Hour Restart', 
    duration: 34 * 60 * 60, 
    description: 'Weekly restart period',
    color: 'bg-green-500'
  },
  { 
    id: 'custom', 
    label: 'Custom Timer', 
    duration: 15 * 60, 
    description: 'Set your own timer',
    color: 'bg-orange-500'
  },
];

export default function BreakTimer() {
  const [selectedBreak, setSelectedBreak] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(15);
  const [breakHistory, setBreakHistory] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    // Load break history
    const saved = localStorage.getItem('trukall_break_history');
    if (saved) {
      setBreakHistory(JSON.parse(saved));
    }

    // Create audio element for alarm
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQQFQq/p7qVwBgU9qt/tnG8KCj2l2++WagwNOaHY8JJnDhE1nNTwkGUQFDGX0fCOYxIYLZPN8I1hFBwpj8vvjGAWHyWLyO+LXxgiIYfF7olgGSUdg8LuiF8bKRl/v+2HXh0sE3m67YVcIDAPdbftglojMwtyr+1/WCU3B26r7XxWKDsDaafselQsQABlou14UjBEAGCd7HZQMkgAXJnsdE41TABYle1yTDhPAFSR7HBKPFMAUD7scEhAVwBMO+xwRUNaAEg47G9DRl4ARTXsb0FJYQBBMextP0xkAD4v7Gs9T2gAOizsa');

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const handleTimerComplete = () => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
    toast.success('Break time complete! Time to get back on the road.', {
      duration: 10000,
    });

    // Save to history
    if (selectedBreak) {
      const breakRecord = {
        id: Date.now(),
        type: selectedBreak.label,
        duration: selectedBreak.duration,
        completedAt: new Date().toISOString()
      };
      const updated = [breakRecord, ...breakHistory].slice(0, 20);
      setBreakHistory(updated);
      localStorage.setItem('trukall_break_history', JSON.stringify(updated));
    }
  };

  const startTimer = (breakType) => {
    const duration = breakType.id === 'custom' 
      ? customMinutes * 60 
      : breakType.duration;
    
    setSelectedBreak(breakType);
    setTimeRemaining(duration);
    setIsRunning(true);
    toast.info(`${breakType.label} started!`);
  };

  const pauseTimer = () => {
    setIsRunning(false);
    toast.info('Timer paused');
  };

  const resumeTimer = () => {
    setIsRunning(true);
    toast.info('Timer resumed');
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeRemaining(0);
    setSelectedBreak(null);
    toast.info('Timer reset');
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    if (!selectedBreak || timeRemaining === 0) return 0;
    const totalDuration = selectedBreak.id === 'custom' 
      ? customMinutes * 60 
      : selectedBreak.duration;
    return ((totalDuration - timeRemaining) / totalDuration) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border-purple-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="w-6 h-6 text-purple-600" />
            HOS Break Timer
          </CardTitle>
          <CardDescription>
            Stay compliant with Hours of Service regulations. Set timers for required breaks.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Active Timer Display */}
      {selectedBreak && (
        <Card className={`${selectedBreak.color.replace('bg-', 'bg-')}/10 border-2 ${selectedBreak.color.replace('bg-', 'border-')}`}>
          <CardContent className="p-8">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">{selectedBreak.label}</p>
              <div className="text-6xl font-mono font-bold mb-4">
                {formatTime(timeRemaining)}
              </div>
              
              {/* Progress Bar */}
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-6 max-w-md mx-auto">
                <div 
                  className={`h-full ${selectedBreak.color} transition-all duration-1000`}
                  style={{ width: `${getProgress()}%` }}
                />
              </div>

              {/* Control Buttons */}
              <div className="flex justify-center gap-4">
                {isRunning ? (
                  <Button onClick={pauseTimer} variant="outline" size="lg">
                    <Pause className="w-5 h-5 mr-2" />
                    Pause
                  </Button>
                ) : timeRemaining > 0 ? (
                  <Button onClick={resumeTimer} className={selectedBreak.color} size="lg">
                    <Play className="w-5 h-5 mr-2" />
                    Resume
                  </Button>
                ) : null}
                <Button onClick={resetTimer} variant="outline" size="lg">
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Reset
                </Button>
                <Button 
                  onClick={() => setSoundEnabled(!soundEnabled)} 
                  variant="ghost" 
                  size="lg"
                >
                  {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Break Type Selection */}
      {!selectedBreak && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {BREAK_TYPES.map(breakType => (
            <Card 
              key={breakType.id}
              className={`cursor-pointer hover:shadow-lg transition-all border-2 hover:${breakType.color.replace('bg-', 'border-')}`}
              onClick={() => breakType.id !== 'custom' && startTimer(breakType)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`p-2 rounded-lg ${breakType.color}`}>
                        {breakType.id === '30min' ? <Coffee className="w-5 h-5 text-white" /> :
                         breakType.id === '10hr' ? <Clock className="w-5 h-5 text-white" /> :
                         breakType.id === '34hr' ? <CheckCircle className="w-5 h-5 text-white" /> :
                         <Timer className="w-5 h-5 text-white" />}
                      </div>
                      <h3 className="font-semibold text-lg">{breakType.label}</h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">{breakType.description}</p>
                    
                    {breakType.id === 'custom' ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="60"
                          value={customMinutes}
                          onChange={(e) => setCustomMinutes(parseInt(e.target.value) || 15)}
                          className="w-20 px-2 py-1 border rounded"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="text-sm text-gray-500">minutes</span>
                        <Button 
                          size="sm" 
                          className={breakType.color}
                          onClick={(e) => {
                            e.stopPropagation();
                            startTimer({...breakType, duration: customMinutes * 60});
                          }}
                        >
                          Start
                        </Button>
                      </div>
                    ) : (
                      <Badge className={breakType.color}>
                        {formatTime(breakType.duration)}
                      </Badge>
                    )}
                  </div>
                  {breakType.id !== 'custom' && (
                    <Button className={breakType.color}>
                      <Play className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* HOS Rules Quick Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            HOS Rules Quick Reference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-700 mb-2">30-Minute Break</h4>
              <p className="text-sm text-blue-600">
                Required after 8 consecutive hours of driving. Must be off-duty or sleeper berth.
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-700 mb-2">11-Hour Driving Limit</h4>
              <p className="text-sm text-purple-600">
                May drive max 11 hours after 10 consecutive hours off duty.
              </p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <h4 className="font-semibold text-orange-700 mb-2">14-Hour Window</h4>
              <p className="text-sm text-orange-600">
                Cannot drive after 14 hours on-duty following 10 hours off duty.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-700 mb-2">70-Hour/8-Day Limit</h4>
              <p className="text-sm text-green-600">
                Cannot drive after 70 hours on-duty in 8 consecutive days. 34-hour restart resets this.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Break History */}
      {breakHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Breaks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {breakHistory.slice(0, 5).map(breakRecord => (
                <div 
                  key={breakRecord.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium">{breakRecord.type}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(breakRecord.completedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700">
                    {formatTime(breakRecord.duration)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
