import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { 
  ClipboardCheck, Camera, CheckCircle, AlertTriangle, 
  Truck, Circle, Square, Gauge, Eye, FileText,
  Calendar, Clock, Save, RotateCcw, Download
} from 'lucide-react';

const INSPECTION_ITEMS = {
  exterior: [
    { id: 'lights_front', label: 'Headlights & Turn Signals (Front)', critical: true },
    { id: 'lights_rear', label: 'Tail Lights & Brake Lights', critical: true },
    { id: 'mirrors', label: 'Mirrors (Both Sides)', critical: true },
    { id: 'windshield', label: 'Windshield & Wipers', critical: true },
    { id: 'tires_front', label: 'Front Tires (Tread & Pressure)', critical: true },
    { id: 'tires_rear', label: 'Rear Tires (Tread & Pressure)', critical: true },
    { id: 'wheels_lugs', label: 'Wheels & Lug Nuts', critical: true },
    { id: 'fuel_tank', label: 'Fuel Tank & Cap', critical: false },
    { id: 'exhaust', label: 'Exhaust System', critical: false },
    { id: 'mud_flaps', label: 'Mud Flaps & Splash Guards', critical: false },
  ],
  interior: [
    { id: 'horn', label: 'Horn', critical: true },
    { id: 'brakes', label: 'Service Brakes', critical: true },
    { id: 'parking_brake', label: 'Parking Brake', critical: true },
    { id: 'steering', label: 'Steering', critical: true },
    { id: 'gauges', label: 'All Gauges Working', critical: true },
    { id: 'seatbelt', label: 'Seat Belt', critical: true },
    { id: 'emergency_kit', label: 'Emergency Kit & Triangles', critical: true },
    { id: 'fire_extinguisher', label: 'Fire Extinguisher', critical: true },
    { id: 'registration', label: 'Registration & Insurance Docs', critical: true },
    { id: 'logbook', label: 'ELD/Logbook', critical: true },
  ],
  trailer: [
    { id: 'coupling', label: 'Fifth Wheel / Coupling', critical: true },
    { id: 'landing_gear', label: 'Landing Gear', critical: true },
    { id: 'trailer_lights', label: 'Trailer Lights & Reflectors', critical: true },
    { id: 'trailer_tires', label: 'Trailer Tires', critical: true },
    { id: 'doors', label: 'Doors & Seals', critical: false },
    { id: 'load_secure', label: 'Load Secured', critical: true },
  ],
  fluids: [
    { id: 'oil', label: 'Engine Oil Level', critical: true },
    { id: 'coolant', label: 'Coolant Level', critical: true },
    { id: 'def', label: 'DEF Level', critical: false },
    { id: 'washer', label: 'Windshield Washer Fluid', critical: false },
    { id: 'power_steering', label: 'Power Steering Fluid', critical: false },
  ]
};

export default function PreTripChecklist() {
  const [checkedItems, setCheckedItems] = useState({});
  const [notes, setNotes] = useState('');
  const [odometer, setOdometer] = useState('');
  const [inspectionHistory, setInspectionHistory] = useState([]);
  const [activeSection, setActiveSection] = useState('exterior');

  useEffect(() => {
    // Load saved inspections from localStorage
    const saved = localStorage.getItem('trukall_inspections');
    if (saved) {
      setInspectionHistory(JSON.parse(saved));
    }
  }, []);

  const toggleItem = (itemId) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const getTotalItems = () => {
    return Object.values(INSPECTION_ITEMS).flat().length;
  };

  const getCheckedCount = () => {
    return Object.values(checkedItems).filter(Boolean).length;
  };

  const getCriticalUnchecked = () => {
    const allItems = Object.values(INSPECTION_ITEMS).flat();
    return allItems.filter(item => item.critical && !checkedItems[item.id]);
  };

  const getCompletionPercentage = () => {
    return Math.round((getCheckedCount() / getTotalItems()) * 100);
  };

  const saveInspection = () => {
    const criticalUnchecked = getCriticalUnchecked();
    
    if (criticalUnchecked.length > 0) {
      toast.error(`${criticalUnchecked.length} critical items not checked!`);
      return;
    }

    const inspection = {
      id: Date.now(),
      date: new Date().toISOString(),
      odometer: odometer,
      checkedItems: { ...checkedItems },
      notes: notes,
      totalItems: getTotalItems(),
      checkedCount: getCheckedCount(),
      status: getCheckedCount() === getTotalItems() ? 'PASS' : 'PASS_WITH_NOTES'
    };

    const updatedHistory = [inspection, ...inspectionHistory].slice(0, 30); // Keep last 30
    setInspectionHistory(updatedHistory);
    localStorage.setItem('trukall_inspections', JSON.stringify(updatedHistory));
    
    toast.success('Pre-Trip Inspection Saved!');
    
    // Reset form
    setCheckedItems({});
    setNotes('');
    setOdometer('');
  };

  const resetForm = () => {
    setCheckedItems({});
    setNotes('');
    setOdometer('');
    toast.info('Form reset');
  };

  const checkAllInSection = (section) => {
    const sectionItems = INSPECTION_ITEMS[section];
    const newChecked = { ...checkedItems };
    sectionItems.forEach(item => {
      newChecked[item.id] = true;
    });
    setCheckedItems(newChecked);
  };

  const sections = [
    { key: 'exterior', label: 'Exterior', icon: Truck },
    { key: 'interior', label: 'Interior', icon: Gauge },
    { key: 'trailer', label: 'Trailer', icon: Square },
    { key: 'fluids', label: 'Fluids', icon: Circle },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-green-600" />
            Pre-Trip Inspection Checklist
          </CardTitle>
          <CardDescription>
            DOT-compliant vehicle inspection. Complete all critical items before driving.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Progress Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-gray-500">Inspection Progress</p>
              <p className="text-2xl font-bold">{getCheckedCount()} / {getTotalItems()}</p>
            </div>
            <div className="text-right">
              <p className={`text-3xl font-bold ${getCompletionPercentage() === 100 ? 'text-green-600' : 'text-blue-600'}`}>
                {getCompletionPercentage()}%
              </p>
              {getCriticalUnchecked().length > 0 && (
                <p className="text-xs text-red-500">{getCriticalUnchecked().length} critical items remaining</p>
              )}
            </div>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all ${getCompletionPercentage() === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
              style={{ width: `${getCompletionPercentage()}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Odometer Input */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm text-gray-600 mb-1 block">Odometer Reading</label>
              <Input
                type="number"
                placeholder="Enter current mileage"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">{new Date().toLocaleDateString()}</span>
              <Clock className="w-4 h-4 text-gray-400 ml-2" />
              <span className="text-sm text-gray-500">{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Tabs */}
      <div className="flex gap-2 flex-wrap">
        {sections.map(section => {
          const Icon = section.icon;
          const sectionItems = INSPECTION_ITEMS[section.key];
          const checkedInSection = sectionItems.filter(item => checkedItems[item.id]).length;
          const allChecked = checkedInSection === sectionItems.length;
          
          return (
            <Button
              key={section.key}
              variant={activeSection === section.key ? "default" : "outline"}
              onClick={() => setActiveSection(section.key)}
              className={`${activeSection === section.key ? 'bg-green-600' : ''} ${allChecked ? 'border-green-500' : ''}`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {section.label}
              <Badge className={`ml-2 ${allChecked ? 'bg-green-500' : 'bg-gray-400'}`}>
                {checkedInSection}/{sectionItems.length}
              </Badge>
            </Button>
          );
        })}
      </div>

      {/* Checklist Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg capitalize">{activeSection} Inspection</CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => checkAllInSection(activeSection)}
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Check All
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {INSPECTION_ITEMS[activeSection].map(item => (
              <div 
                key={item.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  checkedItems[item.id] ? 'bg-green-50 border-green-200' : 
                  item.critical ? 'bg-red-50/30 border-red-200' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={checkedItems[item.id] || false}
                    onCheckedChange={() => toggleItem(item.id)}
                    className="h-5 w-5"
                  />
                  <span className={checkedItems[item.id] ? 'line-through text-gray-500' : ''}>
                    {item.label}
                  </span>
                  {item.critical && !checkedItems[item.id] && (
                    <Badge className="bg-red-500 text-xs">Critical</Badge>
                  )}
                </div>
                {checkedItems[item.id] && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notes & Defects</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Note any defects, issues, or observations..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button 
          onClick={saveInspection}
          className="flex-1 bg-green-600 hover:bg-green-700 h-12"
          disabled={getCriticalUnchecked().length > 0}
        >
          <Save className="w-5 h-5 mr-2" />
          Complete Inspection
        </Button>
        <Button variant="outline" onClick={resetForm} className="h-12">
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      {/* Warning if critical items unchecked */}
      {getCriticalUnchecked().length > 0 && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-700">Critical Items Not Checked</p>
                <ul className="text-sm text-red-600 mt-1 space-y-1">
                  {getCriticalUnchecked().slice(0, 5).map(item => (
                    <li key={item.id}>• {item.label}</li>
                  ))}
                  {getCriticalUnchecked().length > 5 && (
                    <li>...and {getCriticalUnchecked().length - 5} more</li>
                  )}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Inspections */}
      {inspectionHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Recent Inspections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {inspectionHistory.slice(0, 5).map(inspection => (
                <div key={inspection.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{new Date(inspection.date).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(inspection.date).toLocaleTimeString()} | {inspection.odometer} mi
                    </p>
                  </div>
                  <Badge className={inspection.status === 'PASS' ? 'bg-green-500' : 'bg-yellow-500'}>
                    {inspection.status === 'PASS' ? 'PASS' : 'PASS*'}
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
