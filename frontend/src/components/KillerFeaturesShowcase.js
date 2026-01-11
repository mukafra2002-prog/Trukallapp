import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Scale, QrCode, Radio, ChevronLeft, ChevronRight } from 'lucide-react';

const features = [
  {
    id: 'hos',
    icon: Clock,
    color: 'from-red-500 to-orange-500',
    bgColor: 'bg-red-50',
    iconColor: 'text-red-500'
  },
  {
    id: 'weight',
    icon: Scale,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-500'
  },
  {
    id: 'qr',
    icon: QrCode,
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50',
    iconColor: 'text-purple-500'
  },
  {
    id: 'realtime',
    icon: Radio,
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50',
    iconColor: 'text-green-500'
  }
];

export default function KillerFeaturesShowcase() {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % features.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goTo = (index) => {
    setActiveIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goNext = () => goTo((activeIndex + 1) % features.length);
  const goPrev = () => goTo((activeIndex - 1 + features.length) % features.length);

  const activeFeature = features[activeIndex];
  const Icon = activeFeature.icon;

  return (
    <div className="py-20 bg-gradient-to-b from-slate-900 to-slate-800 text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            {t('killerFeatures.title')}{' '}
            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              {t('killerFeatures.titleHighlight')}
            </span>
          </h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            {t('killerFeatures.subtitle')}
          </p>
        </div>

        {/* Main Showcase */}
        <div className="relative">
          {/* Feature Card */}
          <div 
            className="relative bg-white/10 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-white/20 transition-all duration-500"
            key={activeIndex}
          >
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Left - Icon & Stats */}
              <div className="text-center md:text-left">
                <div 
                  className={`inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br ${activeFeature.color} mb-6 shadow-2xl transform hover:scale-110 transition-transform`}
                >
                  <Icon className="w-12 h-12 text-white" />
                </div>
                
                <div className="mb-4">
                  <span className={`text-6xl md:text-7xl font-black bg-gradient-to-r ${activeFeature.color} bg-clip-text text-transparent`}>
                    {t(`killerFeatures.${activeFeature.id}.stat`)}
                  </span>
                  <p className="text-slate-400 text-lg mt-2">
                    {t(`killerFeatures.${activeFeature.id}.statLabel`)}
                  </p>
                </div>
              </div>

              {/* Right - Content */}
              <div>
                <h3 className="text-3xl md:text-4xl font-bold mb-4">
                  {t(`killerFeatures.${activeFeature.id}.title`)}
                </h3>
                <p className="text-xl text-slate-300 leading-relaxed">
                  {t(`killerFeatures.${activeFeature.id}.desc`)}
                </p>
                
                {/* Feature Pills */}
                <div className="mt-6 flex flex-wrap gap-2">
                  {activeFeature.id === 'hos' && (
                    <>
                      <span className="px-3 py-1 bg-white/10 rounded-full text-sm">11h Drive Limit</span>
                      <span className="px-3 py-1 bg-white/10 rounded-full text-sm">14h Duty Window</span>
                      <span className="px-3 py-1 bg-white/10 rounded-full text-sm">70h Weekly</span>
                    </>
                  )}
                  {activeFeature.id === 'weight' && (
                    <>
                      <span className="px-3 py-1 bg-white/10 rounded-full text-sm">Axle Weights</span>
                      <span className="px-3 py-1 bg-white/10 rounded-full text-sm">Multi-Truck</span>
                      <span className="px-3 py-1 bg-white/10 rounded-full text-sm">Legal Check</span>
                    </>
                  )}
                  {activeFeature.id === 'qr' && (
                    <>
                      <span className="px-3 py-1 bg-white/10 rounded-full text-sm">Instant Check-in</span>
                      <span className="px-3 py-1 bg-white/10 rounded-full text-sm">Referral Bonus</span>
                      <span className="px-3 py-1 bg-white/10 rounded-full text-sm">Share & Earn</span>
                    </>
                  )}
                  {activeFeature.id === 'realtime' && (
                    <>
                      <span className="px-3 py-1 bg-white/10 rounded-full text-sm">Live Updates</span>
                      <span className="px-3 py-1 bg-white/10 rounded-full text-sm">Driver-Powered</span>
                      <span className="px-3 py-1 bg-white/10 rounded-full text-sm">30s Refresh</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={goPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              aria-label="Previous feature"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={goNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              aria-label="Next feature"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Dots Navigation */}
          <div className="flex justify-center gap-3 mt-8">
            {features.map((feature, index) => {
              const FeatureIcon = feature.icon;
              return (
                <button
                  key={feature.id}
                  onClick={() => goTo(index)}
                  className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    index === activeIndex
                      ? `bg-gradient-to-br ${feature.color} scale-110 shadow-lg`
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                  aria-label={`Go to ${feature.id}`}
                >
                  <FeatureIcon className="w-6 h-6" />
                </button>
              );
            })}
          </div>

          {/* Progress Bar */}
          <div className="mt-6 max-w-md mx-auto">
            <div className="h-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${activeFeature.color} transition-all duration-300`}
                style={{ 
                  width: isAutoPlaying ? '100%' : '0%',
                  animation: isAutoPlaying ? 'progress 4s linear' : 'none'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}
