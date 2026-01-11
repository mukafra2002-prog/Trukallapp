import { useState, useContext, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AuthContext } from "@/App";
import { X, ChevronRight, ChevronLeft, Clock, Scale, MapPin, Users, Gift, Check } from "lucide-react";

const ONBOARDING_STEPS = [
  {
    id: "welcome",
    title: "Welcome to TrukAll! 🚛",
    description: "Your complete trucking companion. Let's take a quick tour of the key features.",
    icon: "🎉",
    color: "from-blue-500 to-indigo-600"
  },
  {
    id: "hos",
    title: "Hours of Service Tracker",
    description: "Track your driving hours, duty window, and weekly limits. Stay DOT compliant and avoid $16,000+ fines.",
    icon: Clock,
    color: "from-red-500 to-orange-500",
    features: ["11-hour driving limit", "14-hour duty window", "70-hour weekly tracking", "Break reminders"]
  },
  {
    id: "weight",
    title: "Truck Weight Calculator",
    description: "Calculate your total weight before hitting the scales. Know your axle weights and stay legal.",
    icon: Scale,
    color: "from-orange-500 to-amber-500",
    features: ["Save multiple truck profiles", "Axle weight estimates", "Legal weight check", "Fuel & cargo calculator"]
  },
  {
    id: "parking",
    title: "Find Parking Anywhere",
    description: "Search 50+ truck stops nationwide. Real-time availability from fellow drivers.",
    icon: MapPin,
    color: "from-green-500 to-emerald-500",
    features: ["Pilot, Flying J, Love's, TA", "Real-time availability", "Amenity filters", "Reviews & ratings"]
  },
  {
    id: "community",
    title: "Join the Community",
    description: "Connect with 1000+ truckers. Share tips, find convoy partners, and help each other out.",
    icon: Users,
    color: "from-purple-500 to-pink-500",
    features: ["Community board", "Convoy finder", "Mentor program", "Direct messaging"]
  },
  {
    id: "rewards",
    title: "Earn Rewards! 🎁",
    description: "Every action earns points. Redeem for premium features, badges, and more!",
    icon: Gift,
    color: "from-amber-500 to-yellow-500",
    features: ["+10 pts daily check-in", "+25 pts per review", "+500 pts per referral", "Redeem in Rewards Store"]
  }
];

export default function OnboardingTutorial({ onComplete }) {
  const { user } = useContext(AuthContext);
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const step = ONBOARDING_STEPS[currentStep];
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    // Save to localStorage so we don't show again
    localStorage.setItem('trukall_onboarding_complete', 'true');
    setIsVisible(false);
    if (onComplete) onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem('trukall_onboarding_complete', 'true');
    setIsVisible(false);
    if (onComplete) onComplete();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg overflow-hidden">
        {/* Progress Bar */}
        <div className="h-1 bg-slate-200">
          <div 
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header with gradient */}
        <div className={`bg-gradient-to-r ${step.color} p-6 text-white relative`}>
          <button 
            onClick={handleSkip}
            className="absolute top-3 right-3 p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              {typeof step.icon === 'string' ? (
                <span className="text-3xl">{step.icon}</span>
              ) : (
                <step.icon className="w-8 h-8" />
              )}
            </div>
            <div>
              <p className="text-white/80 text-sm">Step {currentStep + 1} of {ONBOARDING_STEPS.length}</p>
              <h2 className="text-xl font-bold">{step.title}</h2>
            </div>
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-6">
          <p className="text-slate-600 mb-4">{step.description}</p>
          
          {step.features && (
            <div className="space-y-2 mb-6">
              {step.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-slate-700">{feature}</span>
                </div>
              ))}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="ghost"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="text-slate-500"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>

            <div className="flex gap-1">
              {ONBOARDING_STEPS.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    idx === currentStep ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>

            <Button
              onClick={handleNext}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {currentStep === ONBOARDING_STEPS.length - 1 ? (
                <>
                  Get Started
                  <Check className="w-4 h-4 ml-1" />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>

          {/* Skip link */}
          <p className="text-center mt-4">
            <button 
              onClick={handleSkip}
              className="text-sm text-slate-400 hover:text-slate-600"
            >
              Skip tutorial
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
