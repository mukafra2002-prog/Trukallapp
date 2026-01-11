import { useState, useContext, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { AuthContext, API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { Wrench, Plus, Check, AlertTriangle, Clock, Calendar, Truck, Trash2 } from "lucide-react";

export default function MaintenanceTracker() {
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [defaults, setDefaults] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [completeItem, setCompleteItem] = useState(null);

  const [newItem, setNewItem] = useState({
    item_type: "",
    last_service_date: new Date().toISOString().split('T')[0],
    last_service_miles: 0,
    notes: ""
  });

  const [completeForm, setCompleteForm] = useState({
    service_date: new Date().toISOString().split('T')[0],
    service_miles: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [itemsRes, defaultsRes] = await Promise.all([
        axios.get(`${API}/maintenance/${user.email}`),
        axios.get(`${API}/maintenance/defaults`)
      ]);
      setItems(itemsRes.data);
      setDefaults(defaultsRes.data);
    } catch (error) {
      console.error("Failed to load maintenance data");
    } finally {
      setLoading(false);
    }
  };

  const addItem = async () => {
    if (!newItem.item_type) {
      toast.error("Please select a maintenance type");
      return;
    }

    try {
      const params = new URLSearchParams({
        item_type: newItem.item_type,
        last_service_date: newItem.last_service_date,
        last_service_miles: newItem.last_service_miles,
        notes: newItem.notes,
        user_email: user.email
      });

      const response = await axios.post(`${API}/maintenance?${params.toString()}`);
      toast.success(response.data.message);
      setShowAdd(false);
      setNewItem({
        item_type: "",
        last_service_date: new Date().toISOString().split('T')[0],
        last_service_miles: 0,
        notes: ""
      });
      fetchData();
    } catch (error) {
      toast.error("Failed to add item");
    }
  };

  const markComplete = async () => {
    try {
      const params = new URLSearchParams({
        service_date: completeForm.service_date,
        service_miles: completeForm.service_miles,
        user_email: user.email
      });

      const response = await axios.put(`${API}/maintenance/${completeItem.id}/complete?${params.toString()}`);
      toast.success(`${response.data.message} +${response.data.points_earned} points!`);
      setCompleteItem(null);
      fetchData();
    } catch (error) {
      toast.error("Failed to update");
    }
  };

  const deleteItem = async (itemId) => {
    try {
      await axios.delete(`${API}/maintenance/${itemId}?user_email=${user.email}`);
      toast.success("Item deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "overdue": return "bg-red-500";
      case "due_soon": return "bg-amber-500";
      default: return "bg-green-500";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "overdue": return <AlertTriangle className="w-4 h-4" />;
      case "due_soon": return <Clock className="w-4 h-4" />;
      default: return <Check className="w-4 h-4" />;
    }
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
            <Wrench className="w-6 h-6 text-blue-600" />
            Maintenance Tracker
          </h3>
          <p className="text-slate-600">Keep your truck in top shape</p>
        </div>
        <Button 
          onClick={() => setShowAdd(true)}
          className="bg-blue-600 hover:bg-blue-700"
          data-testid="add-maintenance-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-red-600">
              {items.filter(i => i.status === "overdue").length}
            </p>
            <p className="text-sm text-red-700">Overdue</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-amber-600">
              {items.filter(i => i.status === "due_soon").length}
            </p>
            <p className="text-sm text-amber-700">Due Soon</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-green-600">
              {items.filter(i => i.status === "ok").length}
            </p>
            <p className="text-sm text-green-700">On Track</p>
          </CardContent>
        </Card>
      </div>

      {/* Add Item Form */}
      {showAdd && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle>Add Maintenance Item</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Maintenance Type</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {Object.entries(defaults).map(([key, val]) => (
                  <Button
                    key={key}
                    variant={newItem.item_type === key ? "default" : "outline"}
                    onClick={() => setNewItem(prev => ({ ...prev, item_type: key }))}
                    className={`h-auto py-3 ${newItem.item_type === key ? "bg-blue-600" : ""}`}
                  >
                    <div className="text-center">
                      <span className="text-xl">{val.icon}</span>
                      <p className="text-xs mt-1">{val.name}</p>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Last Service Date</Label>
                <Input
                  type="date"
                  value={newItem.last_service_date}
                  onChange={(e) => setNewItem(prev => ({ ...prev, last_service_date: e.target.value }))}
                />
              </div>
              <div>
                <Label>Odometer (miles)</Label>
                <Input
                  type="number"
                  value={newItem.last_service_miles}
                  onChange={(e) => setNewItem(prev => ({ ...prev, last_service_miles: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            
            <div>
              <Label>Notes (optional)</Label>
              <Input
                value={newItem.notes}
                onChange={(e) => setNewItem(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Shop name, parts used, etc."
              />
            </div>
            
            <div className="flex gap-2">
              <Button onClick={addItem} className="bg-blue-600">Add Item</Button>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Complete Item Form */}
      {completeItem && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle>Log Service: {completeItem.description}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Service Date</Label>
                <Input
                  type="date"
                  value={completeForm.service_date}
                  onChange={(e) => setCompleteForm(prev => ({ ...prev, service_date: e.target.value }))}
                />
              </div>
              <div>
                <Label>Current Odometer</Label>
                <Input
                  type="number"
                  value={completeForm.service_miles}
                  onChange={(e) => setCompleteForm(prev => ({ ...prev, service_miles: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={markComplete} className="bg-green-600 hover:bg-green-700">
                <Check className="w-4 h-4 mr-2" />
                Mark Complete (+15 pts)
              </Button>
              <Button variant="outline" onClick={() => setCompleteItem(null)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Maintenance Items List */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Maintenance</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Truck className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No maintenance items tracked</p>
              <p className="text-sm">Add your first item above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div 
                  key={item.id}
                  className={`p-4 rounded-lg border ${
                    item.status === "overdue" ? "bg-red-50 border-red-200" :
                    item.status === "due_soon" ? "bg-amber-50 border-amber-200" :
                    "bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{defaults[item.item_type]?.icon || "🔧"}</span>
                      <div>
                        <h4 className="font-bold">{item.description}</h4>
                        <p className="text-sm text-slate-600">
                          Last: {new Date(item.last_service_date).toLocaleDateString()} at {item.last_service_miles.toLocaleString()} mi
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(item.status)}>
                      {getStatusIcon(item.status)}
                      <span className="ml-1">
                        {item.status === "overdue" ? "Overdue" :
                         item.status === "due_soon" ? `${item.days_until_due}d` :
                         "OK"}
                      </span>
                    </Badge>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4 text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Due: {new Date(item.next_due_date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Truck className="w-4 h-4" />
                        or {item.next_due_miles.toLocaleString()} mi
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => {
                          setCompleteItem(item);
                          setCompleteForm({
                            service_date: new Date().toISOString().split('T')[0],
                            service_miles: item.next_due_miles
                          });
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Complete
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => deleteItem(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
