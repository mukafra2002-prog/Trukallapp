import { useState, useContext, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AuthContext, API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { Clock, Truck, Home, Moon, ClipboardList, AlertTriangle, Check, RefreshCw, Calendar, Timer, ChevronRight } from "lucide-react";

export default function HOSTracker() {
  const { user } = useContext(AuthContext);
  const [summary, setSummary] = useState(null);
  const [logs, setLogs] = useState([]);
  const [rules, setRules] = useState(null);
  const [restart, setRestart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const timerRef = useRef(null);

  useEffect(() => {
    fetchData();
    // Update every minute
    timerRef.current = setInterval(fetchSummary, 60000);
    return () => clearInterval(timerRef.current);
  }, []);

  const fetchData = async () => {
    try {
      const [summaryRes, logsRes, rulesRes, restartRes] = await Promise.all([
        axios.get(`${API}/hos/summary/${user.email}`),
        axios.get(`${API}/hos/logs/${user.email}?days=1`),
        axios.get(`${API}/hos/rules`),
        axios.get(`${API}/hos/restart-calculator/${user.email}`)
      ]);
      setSummary(summaryRes.data);
      setLogs(logsRes.data);
      setRules(rulesRes.data);
      setRestart(restartRes.data);
    } catch (error) {
      console.error("Failed to load HOS data");
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await axios.get(`${API}/hos/summary/${user.email}`);
      setSummary(response.data);
    } catch (error) {
      console.error("Failed to refresh HOS");
    }
  };

  const changeStatus = async (status) => {
    try {
      const response = await axios.post(
        `${API}/hos/log?user_email=${user.email}`,
        { status, location, notes }
      );
      toast.success(response.data.message);
      setSummary(response.data.summary);
      setLocation("");
      setNotes("");
      fetchData();
    } catch (error) {
      toast.error("Failed to log status");
    }
  };

  const statusConfig = {
    off_duty: { name: "Off Duty", icon: Home, color: "bg-slate-500", desc: "Not working" },
    sleeper: { name: "Sleeper", icon: Moon, color: "bg-blue-500", desc: "Resting in sleeper berth" },
    driving: { name: "Driving", icon: Truck, color: "bg-green-500", desc: "Operating the vehicle" },
    on_duty: { name: "On Duty", icon: ClipboardList, color: "bg-amber-500", desc: "Working, not driving" }
  };

  const formatTime = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  const getProgressColor = (remaining, total) => {
    const percent = (remaining / total) * 100;
    if (percent > 50) return "bg-green-500";
    if (percent > 25) return "bg-amber-500";
    return "bg-red-500";
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
            <Clock className="w-6 h-6 text-blue-600" />
            Hours of Service
          </h3>
          <p className="text-slate-600">Track your driving & duty hours</p>
        </div>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Violations Alert */}
      {summary?.violations?.length > 0 && (
        <Card className="bg-red-50 border-red-300 border-2">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-red-800">HOS Violations</h4>
                {summary.violations.map((v, idx) => (
                  <p key={idx} className="text-red-700">{v}</p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Status */}
      <Card className={`border-2 ${summary?.is_compliant ? 'border-green-300' : 'border-red-300'}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full ${statusConfig[summary?.current_status]?.color} flex items-center justify-center text-white`}>
                {summary?.current_status && (() => {
                  const Icon = statusConfig[summary.current_status].icon;
                  return <Icon className="w-6 h-6" />;
                })()}
              </div>
              <div>
                <p className="text-sm text-slate-500">Current Status</p>
                <p className="text-xl font-bold">{statusConfig[summary?.current_status]?.name || "Unknown"}</p>
              </div>
            </div>
            <Badge className={summary?.is_compliant ? "bg-green-500" : "bg-red-500"}>
              {summary?.is_compliant ? (
                <><Check className="w-4 h-4 mr-1" /> Compliant</>
              ) : (
                <><AlertTriangle className="w-4 h-4 mr-1" /> Violation</>
              )}
            </Badge>
          </div>

          {/* Status Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(statusConfig).map(([status, config]) => (
              <Button
                key={status}
                onClick={() => changeStatus(status)}
                disabled={summary?.current_status === status}
                className={`h-auto py-3 ${
                  summary?.current_status === status 
                    ? config.color + ' text-white' 
                    : 'bg-white border-2 text-slate-700 hover:bg-slate-50'
                }`}
                variant={summary?.current_status === status ? "default" : "outline"}
                data-testid={`hos-status-${status}`}
              >
                <div className="flex flex-col items-center">
                  <config.icon className="w-5 h-5 mb-1" />
                  <span className="text-sm font-medium">{config.name}</span>
                </div>
              </Button>
            ))}
          </div>

          {/* Quick Location/Notes */}
          <div className="flex gap-2 mt-4">
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location (optional)"
              className="flex-1"
            />
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes (optional)"
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Time Remaining Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Driving Remaining */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">Driving Left</span>
              <Truck className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">
              {summary?.today?.driving_remaining_display || "11h 0m"}
            </p>
            <Progress 
              value={(summary?.today?.driving_remaining || 660) / 660 * 100} 
              className="h-2 mt-2"
            />
            <p className="text-xs text-slate-500 mt-1">
              Used: {summary?.today?.driving_display || "0h 0m"} / 11h
            </p>
          </CardContent>
        </Card>

        {/* Duty Window */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">Duty Window</span>
              <Timer className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-amber-600">
              {summary?.today?.duty_window_remaining_display || "14h 0m"}
            </p>
            <Progress 
              value={(summary?.today?.duty_window_remaining || 840) / 840 * 100} 
              className="h-2 mt-2"
            />
            <p className="text-xs text-slate-500 mt-1">
              14-hour window remaining
            </p>
          </CardContent>
        </Card>

        {/* Weekly */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">Weekly (8-day)</span>
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {summary?.weekly?.remaining_display || "70h 0m"}
            </p>
            <Progress 
              value={(summary?.weekly?.remaining_minutes || 4200) / 4200 * 100} 
              className="h-2 mt-2"
            />
            <p className="text-xs text-slate-500 mt-1">
              Used: {summary?.weekly?.total_display || "0h 0m"} / 70h
            </p>
          </CardContent>
        </Card>

        {/* Break Timer */}
        <Card className={summary?.break?.needed ? "border-red-300 bg-red-50" : ""}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">Break Required</span>
              <Clock className={`w-4 h-4 ${summary?.break?.needed ? "text-red-600" : "text-slate-400"}`} />
            </div>
            {summary?.break?.needed ? (
              <>
                <p className="text-2xl font-bold text-red-600">BREAK NOW</p>
                <p className="text-xs text-red-600 mt-1">30-min break required</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-slate-600">
                  {formatTime(summary?.break?.time_until_required || 480)}
                </p>
                <p className="text-xs text-slate-500 mt-1">Until break required</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 34-Hour Restart */}
      {restart && (
        <Card className={restart.can_restart ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RefreshCw className={`w-6 h-6 ${restart.can_restart ? "text-green-600" : "text-amber-600"}`} />
                <div>
                  <h4 className="font-bold">34-Hour Restart</h4>
                  <p className={`text-sm ${restart.can_restart ? "text-green-600" : "text-amber-600"}`}>
                    {restart.message}
                  </p>
                </div>
              </div>
              {!restart.can_restart && (
                <Badge className="bg-amber-500">
                  {restart.hours_remaining?.toFixed(1)}h left
                </Badge>
              )}
              {restart.can_restart && (
                <Badge className="bg-green-500">
                  <Check className="w-4 h-4 mr-1" /> Reset Complete
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Log */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Log</CardTitle>
          <CardDescription>Your duty status changes today</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-center text-slate-500 py-4">No logs today. Start by selecting a status above.</p>
          ) : (
            <div className="space-y-2">
              {logs.map((log, idx) => {
                const config = statusConfig[log.status];
                return (
                  <div key={log.id || idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full ${config?.color || 'bg-slate-400'} flex items-center justify-center text-white`}>
                        {config && <config.icon className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-medium">{config?.name || log.status}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(log.start_time).toLocaleTimeString()} 
                          {log.end_time && ` - ${new Date(log.end_time).toLocaleTimeString()}`}
                          {log.location && ` • ${log.location}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatTime(log.duration_minutes || 0)}</p>
                      {!log.end_time && (
                        <Badge className="bg-green-500 text-xs">Active</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* HOS Rules Reference */}
      <Card>
        <CardHeader>
          <CardTitle>HOS Rules Quick Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rules?.tips?.map((tip, idx) => (
              <div key={idx} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                <ChevronRight className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-800">{tip}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
