import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Truck, Calculator, MapPin, Calendar, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function LoadBoardTab({ 
  loads = [], 
  onCalculateProfit,
  onSwitchToCalculator
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-6 h-6 text-green-600" />
                {t('tabs.loads', 'Load Board')}
              </CardTitle>
              <CardDescription>{t('loads.description', 'Find and accept loads to maximize your earnings')}</CardDescription>
            </div>
            <Badge className="bg-green-500 text-white">{loads.length} {t('loads.availableLoads', 'Available Loads')}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-2xl font-bold text-green-600">{loads.length}</p>
              <p className="text-xs text-slate-600">{t('loads.availableLoads', 'Available Loads')}</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-2xl font-bold text-blue-600">
                ${loads.length > 0 ? Math.round(loads.reduce((a, b) => a + b.rate, 0) / loads.length).toLocaleString() : 0}
              </p>
              <p className="text-xs text-slate-600">{t('loads.avgRate', 'Avg Rate')}</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-2xl font-bold text-purple-600">
                {loads.length > 0 ? Math.round(loads.reduce((a, b) => a + b.distance, 0) / loads.length) : 0}
              </p>
              <p className="text-xs text-slate-600">{t('loads.avgMiles', 'Avg Miles')}</p>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-2xl font-bold text-amber-600">
                ${loads.length > 0 ? (loads.reduce((a, b) => a + (b.rate / b.distance), 0) / loads.length).toFixed(2) : '0.00'}
              </p>
              <p className="text-xs text-slate-600">{t('loads.avgPerMile', 'Avg $/Mile')}</p>
            </div>
          </div>

          {/* Load List */}
          <div className="space-y-4">
            {loads.length === 0 ? (
              <div className="text-center py-8">
                <Truck className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">{t('loads.noLoads', 'No loads available right now. Check back soon!')}</p>
              </div>
            ) : (
              loads.map((load) => (
                <Card key={load.id} className="hover:shadow-md transition-shadow border-l-4 border-l-green-500" data-testid={`load-${load.id}`}>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">{load.equipment_type}</Badge>
                          <Badge className={load.status === 'available' ? 'bg-green-500' : 'bg-slate-500'}>
                            {load.status}
                          </Badge>
                        </div>
                        <h4 className="font-bold text-lg">
                          {load.origin_city}, {load.origin_state} 
                          <ArrowRight className="w-4 h-4 inline mx-2" />
                          {load.destination_city}, {load.destination_state}
                        </h4>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-600">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {load.distance} {t('loads.miles', 'miles')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {t('loads.pickup', 'Pickup')}: {new Date(load.pickup_date).toLocaleDateString()}
                          </span>
                          <span>{t('loads.weight', 'Weight')}: {load.weight?.toLocaleString() || 'N/A'} lbs</span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                          {t('loads.contact', 'Contact')}: {load.contact_name} • {load.contact_phone}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-black text-green-600">${load.rate.toLocaleString()}</p>
                        <p className="text-sm text-slate-600">${(load.rate / load.distance).toFixed(2)}/{t('loads.mile', 'mile')}</p>
                        <div className="flex gap-2 mt-3">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              if (onSwitchToCalculator) onSwitchToCalculator();
                              if (onCalculateProfit) onCalculateProfit(load.id);
                            }}
                          >
                            <Calculator className="w-4 h-4 mr-1" />
                            {t('loads.calculate', 'Calculate')}
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              toast.success(`${t('loads.accepted', 'Load accepted!')} ${t('loads.contact', 'Contact')} ${load.contact_name} at ${load.contact_phone}`);
                            }}
                            data-testid={`accept-load-${load.id}`}
                          >
                            {t('loads.acceptLoad', 'Accept Load')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
