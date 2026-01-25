import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShowerHead } from "lucide-react";

const getChainDisplayName = (chainId) => {
  const names = {
    'pilot_flying_j': 'Pilot Flying J',
    'loves': "Love's Travel Stops",
    'ta_petro': 'TA/Petro',
    'speedway': 'Speedway',
    'walmart': 'Walmart',
    'lowes': "Lowe's",
    'home_depot': 'Home Depot',
    'cracker_barrel': 'Cracker Barrel',
    'cabelas': "Cabela's",
    'bass_pro': 'Bass Pro Shops',
    'rest_area': 'Rest Area',
    'truck_stop': 'Independent Truck Stop'
  };
  return names[chainId] || chainId;
};

const getChainColor = (chainId) => {
  const colors = {
    'pilot_flying_j': 'bg-red-500',
    'loves': 'bg-yellow-500',
    'ta_petro': 'bg-blue-600',
    'speedway': 'bg-orange-500',
    'walmart': 'bg-blue-500',
    'lowes': 'bg-blue-700',
    'cracker_barrel': 'bg-amber-600',
    'cabelas': 'bg-green-700',
    'rest_area': 'bg-green-500'
  };
  return colors[chainId] || 'bg-gray-500';
};

export default function ShowerCreditsTab({ showerCredits = [], showerTotals = { total_available_showers: 0, total_points: 0, chains_tracked: 0 } }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShowerHead className="w-6 h-6 text-blue-500" />
            {t('showers.title', 'Your Shower Credits')}
          </CardTitle>
          <CardDescription>{t('showers.description', 'Track your rewards across all truck stop chains')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-blue-500">{showerTotals.total_available_showers}</p>
              <p className="text-sm text-muted-foreground">{t('showers.availableShowers', 'Available Showers')}</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-cyan-500">{showerTotals.total_points.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">{t('showers.totalPoints', 'Total Points')}</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-purple-500">{showerTotals.chains_tracked}</p>
              <p className="text-sm text-muted-foreground">{t('showers.chainsTracked', 'Chains Tracked')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Chain Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {showerCredits.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-8 text-center">
              <ShowerHead className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">{t('showers.noCredits', 'No shower credits tracked yet')}</p>
              <p className="text-sm text-muted-foreground mt-2">{t('showers.addRewards', 'Add your rewards numbers to track your credits')}</p>
            </CardContent>
          </Card>
        ) : (
          showerCredits.map((credit) => (
            <Card key={credit.id} className="overflow-hidden" data-testid={`shower-credit-${credit.chain}`}>
              <div className={`h-2 ${getChainColor(credit.chain)}`}></div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{getChainDisplayName(credit.chain)}</CardTitle>
                {credit.rewards_number && (
                  <CardDescription className="font-mono text-xs">{credit.rewards_number}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('showers.availableShowers', 'Available Showers')}</p>
                    <p className="text-2xl font-bold">{credit.available_showers}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{t('showers.points', 'Points')}</p>
                    <p className="text-xl font-bold text-blue-500">{credit.points_balance.toLocaleString()}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  {t('showers.lastUpdated', 'Last updated')}: {new Date(credit.last_updated).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
