import { useState, useContext, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { AuthContext, API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { Scale, Truck, Plus, Calculator, AlertTriangle, Check, Trash2, Star, Fuel, Package, Info } from "lucide-react";

export default function TruckWeight() {
  const { user } = useContext(AuthContext);
  const [profiles, setProfiles] = useState([]);
  const [limits, setLimits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [calcResult, setCalcResult] = useState(null);

  const [newProfile, setNewProfile] = useState({
    truck_name: "",
    truck_type: "semi",
    empty_weight: 35000,
    gvwr: 80000,
    gcwr: 80000,
    steer_axle_weight: 10000,
    drive_axle_weight: 12000,
    trailer_axle_weight: 13000,
    drive_axle_type: "tandem",
    trailer_axle_type: "tandem",
    fuel_capacity_gallons: 300,
    def_capacity_gallons: 20
  });

  const [calcInput, setCalcInput] = useState({
    cargo_weight: 40000,
    fuel_gallons: 150,
    def_gallons: 10,
    additional_weight: 500
  });

  const truckTypes = [
    { id: "semi", name: "Semi (Tractor-Trailer)" },
    { id: "straight", name: "Straight Truck" },
    { id: "tandem", name: "Tandem Axle" },
    { id: "tri-axle", name: "Tri-Axle" }
  ];

  const axleTypes = [
    { id: "single", name: "Single", limit: "20,000 lbs" },
    { id: "tandem", name: "Tandem", limit: "34,000 lbs" },
    { id: "tridem", name: "Tridem", limit: "42,000 lbs" },
    { id: "spread", name: "Spread Tandem", limit: "34,000 lbs" }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profilesRes, limitsRes] = await Promise.all([
        axios.get(`${API}/truck-weight/profiles/${user.email}`),
        axios.get(`${API}/truck-weight/limits`)
      ]);
      setProfiles(profilesRes.data);
      setLimits(limitsRes.data);
      
      // Set default profile as selected
      const defaultProfile = profilesRes.data.find(p => p.is_default);
      if (defaultProfile) {
        setSelectedProfile(defaultProfile);
      }
    } catch (error) {
      console.error("Failed to load weight data");
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async () => {
    if (!newProfile.truck_name.trim()) {
      toast.error("Please enter a truck name");
      return;
    }

    try {
      const response = await axios.post(
        `${API}/truck-weight/profiles?user_email=${user.email}`,
        newProfile
      );
      toast.success(`${response.data.message} Max cargo: ${response.data.max_cargo_weight.toLocaleString()} lbs`);
      setShowAddProfile(false);
      setNewProfile({
        truck_name: "",
        truck_type: "semi",
        empty_weight: 35000,
        gvwr: 80000,
        gcwr: 80000,
        steer_axle_weight: 10000,
        drive_axle_weight: 12000,
        trailer_axle_weight: 13000,
        drive_axle_type: "tandem",
        trailer_axle_type: "tandem",
        fuel_capacity_gallons: 300,
        def_capacity_gallons: 20
      });
      fetchData();
    } catch (error) {
      toast.error("Failed to save profile");
    }
  };

  const setDefaultProfile = async (profileId) => {
    try {
      await axios.put(`${API}/truck-weight/profiles/${profileId}/default?user_email=${user.email}`);
      toast.success("Default profile updated!");
      fetchData();
    } catch (error) {
      toast.error("Failed to update");
    }
  };

  const deleteProfile = async (profileId) => {
    try {
      await axios.delete(`${API}/truck-weight/profiles/${profileId}?user_email=${user.email}`);
      toast.success("Profile deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  const calculateWeight = async () => {
    if (!selectedProfile) {
      toast.error("Please select a truck profile first");
      return;
    }

    try {
      const response = await axios.post(
        `${API}/truck-weight/calculate?profile_id=${selectedProfile.id}&user_email=${user.email}`,
        calcInput
      );
      setCalcResult(response.data);
    } catch (error) {
      toast.error("Calculation failed");
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
            <Scale className="w-6 h-6 text-blue-600" />
            Truck Weight Manager
          </h3>
          <p className="text-slate-600">Track weights & stay legal at the scales</p>
        </div>
        <Button 
          onClick={() => setShowAddProfile(true)}
          className="bg-blue-600 hover:bg-blue-700"
          data-testid="add-truck-profile-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Truck
        </Button>
      </div>

      {/* Federal Limits Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-bold text-blue-800">Federal Weight Limits</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
                <div>
                  <p className="text-blue-600">Gross Weight</p>
                  <p className="font-bold text-blue-800">80,000 lbs</p>
                </div>
                <div>
                  <p className="text-blue-600">Single Axle</p>
                  <p className="font-bold text-blue-800">20,000 lbs</p>
                </div>
                <div>
                  <p className="text-blue-600">Tandem Axle</p>
                  <p className="font-bold text-blue-800">34,000 lbs</p>
                </div>
                <div>
                  <p className="text-blue-600">Steer Axle</p>
                  <p className="font-bold text-blue-800">12,000 lbs</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Profile Form */}
      {showAddProfile && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle>Add Truck Profile</CardTitle>
            <CardDescription>Save your truck specs for quick weight calculations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Truck Name</Label>
                <Input
                  value={newProfile.truck_name}
                  onChange={(e) => setNewProfile(prev => ({ ...prev, truck_name: e.target.value }))}
                  placeholder="e.g., My Freightliner, Unit 501"
                />
              </div>
              <div>
                <Label>Truck Type</Label>
                <select
                  value={newProfile.truck_type}
                  onChange={(e) => setNewProfile(prev => ({ ...prev, truck_type: e.target.value }))}
                  className="w-full h-10 px-3 rounded-md border"
                >
                  {truckTypes.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Empty Weight (lbs)</Label>
                <Input
                  type="number"
                  value={newProfile.empty_weight}
                  onChange={(e) => setNewProfile(prev => ({ ...prev, empty_weight: parseInt(e.target.value) || 0 }))}
                />
                <p className="text-xs text-slate-500 mt-1">Truck + trailer empty</p>
              </div>
              <div>
                <Label>GVWR (lbs)</Label>
                <Input
                  type="number"
                  value={newProfile.gvwr}
                  onChange={(e) => setNewProfile(prev => ({ ...prev, gvwr: parseInt(e.target.value) || 0 }))}
                />
                <p className="text-xs text-slate-500 mt-1">Gross Vehicle Weight Rating</p>
              </div>
              <div>
                <Label>GCWR (lbs)</Label>
                <Input
                  type="number"
                  value={newProfile.gcwr}
                  onChange={(e) => setNewProfile(prev => ({ ...prev, gcwr: parseInt(e.target.value) || 0 }))}
                />
                <p className="text-xs text-slate-500 mt-1">Gross Combined Weight Rating</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Drive Axle Type</Label>
                <select
                  value={newProfile.drive_axle_type}
                  onChange={(e) => setNewProfile(prev => ({ ...prev, drive_axle_type: e.target.value }))}
                  className="w-full h-10 px-3 rounded-md border"
                >
                  {axleTypes.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.limit})</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Trailer Axle Type</Label>
                <select
                  value={newProfile.trailer_axle_type}
                  onChange={(e) => setNewProfile(prev => ({ ...prev, trailer_axle_type: e.target.value }))}
                  className="w-full h-10 px-3 rounded-md border"
                >
                  {axleTypes.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.limit})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Fuel Capacity (gallons)</Label>
                <Input
                  type="number"
                  value={newProfile.fuel_capacity_gallons}
                  onChange={(e) => setNewProfile(prev => ({ ...prev, fuel_capacity_gallons: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label>DEF Capacity (gallons)</Label>
                <Input
                  type="number"
                  value={newProfile.def_capacity_gallons}
                  onChange={(e) => setNewProfile(prev => ({ ...prev, def_capacity_gallons: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={createProfile} className="bg-blue-600 hover:bg-blue-700">
                Save Profile (+25 pts)
              </Button>
              <Button variant="outline" onClick={() => setShowAddProfile(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saved Profiles */}
      {profiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Trucks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profiles.map((profile) => (
                <div 
                  key={profile.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedProfile?.id === profile.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-slate-200 hover:border-blue-300'
                  }`}
                  onClick={() => setSelectedProfile(profile)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Truck className="w-8 h-8 text-blue-600" />
                      <div>
                        <h4 className="font-bold flex items-center gap-2">
                          {profile.truck_name}
                          {profile.is_default && (
                            <Badge className="bg-amber-500 text-xs">Default</Badge>
                          )}
                        </h4>
                        <p className="text-sm text-slate-500">{profile.truck_type}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {!profile.is_default && (
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={(e) => { e.stopPropagation(); setDefaultProfile(profile.id); }}
                          title="Set as default"
                        >
                          <Star className="w-4 h-4" />
                        </Button>
                      )}
                      <Button 
                        size="icon" 
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); deleteProfile(profile.id); }}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
                    <div>
                      <p className="text-slate-500">Empty</p>
                      <p className="font-bold">{profile.empty_weight.toLocaleString()} lbs</p>
                    </div>
                    <div>
                      <p className="text-slate-500">GCWR</p>
                      <p className="font-bold">{profile.gcwr.toLocaleString()} lbs</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Max Cargo</p>
                      <p className="font-bold text-green-600">{profile.max_cargo_weight.toLocaleString()} lbs</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weight Calculator */}
      <Card className="border-2 border-blue-200">
        <CardHeader className="bg-blue-50">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            Weight Calculator
          </CardTitle>
          <CardDescription>
            {selectedProfile 
              ? `Using: ${selectedProfile.truck_name}` 
              : "Select a truck profile above or add one"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="flex items-center gap-1">
                <Package className="w-4 h-4" /> Cargo (lbs)
              </Label>
              <Input
                type="number"
                value={calcInput.cargo_weight}
                onChange={(e) => setCalcInput(prev => ({ ...prev, cargo_weight: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label className="flex items-center gap-1">
                <Fuel className="w-4 h-4" /> Fuel (gal)
              </Label>
              <Input
                type="number"
                value={calcInput.fuel_gallons}
                onChange={(e) => setCalcInput(prev => ({ ...prev, fuel_gallons: parseInt(e.target.value) || 0 }))}
              />
              <p className="text-xs text-slate-500">~7 lbs/gal</p>
            </div>
            <div>
              <Label>DEF (gal)</Label>
              <Input
                type="number"
                value={calcInput.def_gallons}
                onChange={(e) => setCalcInput(prev => ({ ...prev, def_gallons: parseInt(e.target.value) || 0 }))}
              />
              <p className="text-xs text-slate-500">~9 lbs/gal</p>
            </div>
            <div>
              <Label>Other (lbs)</Label>
              <Input
                type="number"
                value={calcInput.additional_weight}
                onChange={(e) => setCalcInput(prev => ({ ...prev, additional_weight: parseInt(e.target.value) || 0 }))}
              />
              <p className="text-xs text-slate-500">Tools, chains, etc.</p>
            </div>
          </div>

          <Button 
            onClick={calculateWeight}
            className="w-full bg-blue-600 hover:bg-blue-700 h-12"
            disabled={!selectedProfile}
            data-testid="calculate-weight-btn"
          >
            <Calculator className="w-5 h-5 mr-2" />
            Calculate Total Weight
          </Button>

          {/* Results */}
          {calcResult && (
            <div className={`p-4 rounded-lg ${calcResult.is_legal ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border-2`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {calcResult.is_legal ? (
                    <Check className="w-8 h-8 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                  )}
                  <div>
                    <p className={`text-2xl font-bold ${calcResult.is_legal ? 'text-green-700' : 'text-red-700'}`}>
                      {calcResult.total_weight.toLocaleString()} lbs
                    </p>
                    <p className={calcResult.is_legal ? 'text-green-600' : 'text-red-600'}>
                      {calcResult.is_legal ? '✅ Legal Weight' : '⚠️ OVERWEIGHT'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Remaining Capacity</p>
                  <p className={`text-xl font-bold ${calcResult.remaining_capacity > 5000 ? 'text-green-600' : 'text-amber-600'}`}>
                    {calcResult.remaining_capacity.toLocaleString()} lbs
                  </p>
                </div>
              </div>

              {/* Weight Breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm mb-4">
                <div className="p-2 bg-white rounded">
                  <p className="text-slate-500">Empty</p>
                  <p className="font-bold">{calcResult.breakdown.empty_weight.toLocaleString()}</p>
                </div>
                <div className="p-2 bg-white rounded">
                  <p className="text-slate-500">Cargo</p>
                  <p className="font-bold">{calcResult.breakdown.cargo_weight.toLocaleString()}</p>
                </div>
                <div className="p-2 bg-white rounded">
                  <p className="text-slate-500">Fuel</p>
                  <p className="font-bold">{calcResult.breakdown.fuel_weight.toLocaleString()}</p>
                </div>
                <div className="p-2 bg-white rounded">
                  <p className="text-slate-500">DEF</p>
                  <p className="font-bold">{calcResult.breakdown.def_weight.toLocaleString()}</p>
                </div>
                <div className="p-2 bg-white rounded">
                  <p className="text-slate-500">Other</p>
                  <p className="font-bold">{calcResult.breakdown.additional_weight.toLocaleString()}</p>
                </div>
              </div>

              {/* Axle Weights */}
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">Estimated Axle Weights:</p>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className={`p-2 rounded ${calcResult.estimated_axle_weights.steer > calcResult.limits.steer ? 'bg-red-100' : 'bg-white'}`}>
                    <p className="text-slate-500">Steer</p>
                    <p className="font-bold">~{calcResult.estimated_axle_weights.steer.toLocaleString()} / {calcResult.limits.steer.toLocaleString()}</p>
                  </div>
                  <div className={`p-2 rounded ${calcResult.estimated_axle_weights.drives > calcResult.limits.drives ? 'bg-red-100' : 'bg-white'}`}>
                    <p className="text-slate-500">Drives</p>
                    <p className="font-bold">~{calcResult.estimated_axle_weights.drives.toLocaleString()} / {calcResult.limits.drives.toLocaleString()}</p>
                  </div>
                  <div className={`p-2 rounded ${calcResult.estimated_axle_weights.trailer > calcResult.limits.trailer ? 'bg-red-100' : 'bg-white'}`}>
                    <p className="text-slate-500">Trailer</p>
                    <p className="font-bold">~{calcResult.estimated_axle_weights.trailer.toLocaleString()} / {calcResult.limits.trailer.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Warnings */}
              {calcResult.warnings.length > 0 && (
                <div className="space-y-1">
                  {calcResult.warnings.map((warning, idx) => (
                    <p key={idx} className="text-sm text-red-700">{warning}</p>
                  ))}
                </div>
              )}

              {/* Tips */}
              {calcResult.tips.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm font-medium mb-1">Tips:</p>
                  {calcResult.tips.map((tip, idx) => (
                    <p key={idx} className="text-sm text-slate-600">💡 {tip}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weight Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Weight Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {limits?.tips?.map((tip, idx) => (
              <div key={idx} className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg">
                <span className="text-lg">💡</span>
                <p className="text-sm text-slate-700">{tip}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
