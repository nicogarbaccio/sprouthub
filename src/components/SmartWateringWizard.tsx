import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Brain,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Lightbulb,
  Thermometer,
  Heart,
} from "lucide-react";
import {
  WateringFactors,
  SmartScheduleResult,
  calculateSmartWateringSchedule,
  getCurrentSeason,
  getFactorLabels,
} from "@/utils/smartWateringSchedule";
import { cn } from "@/lib/utils";
import { useSmartWateringPreferences } from "@/hooks/useSmartWateringPreferences";
import { useLocation } from "@/hooks/useLocation";
import { useWeatherData } from "@/hooks/useWeatherData";
import { mapWeatherToFactors } from "@/utils/weatherMapping";
import { calculateWeatherScheduleAdjustments, applyWeatherAdjustments } from "@/utils/weatherScheduleAdjustments";
import { LocationPermissionDialog } from "@/components/LocationPermissionDialog";
import type { LocationData } from "@/services/weatherTypes";
import { StepPlantSize } from "@/components/wizard/StepPlantSize";
import { StepEnvironment } from "@/components/wizard/StepEnvironment";
import { StepPreferences } from "@/components/wizard/StepPreferences";
import { StepResults } from "@/components/wizard/StepResults";

interface SmartWateringWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySchedule: (days: number) => void;
  baseDays: number;
  plantName: string;
}

interface StepData {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

const STEPS: StepData[] = [
  {
    id: 1,
    title: "Plant Size",
    subtitle: "How big is your plant?",
    icon: <Lightbulb className="w-5 h-5" />,
  },
  {
    id: 2,
    title: "Environment",
    subtitle: "Light, temperature & humidity",
    icon: <Thermometer className="w-5 h-5" />,
  },
  {
    id: 3,
    title: "Preferences",
    subtitle: "Your care style & soil type",
    icon: <Heart className="w-5 h-5" />,
  },
  {
    id: 4,
    title: "Results",
    subtitle: "Your personalized schedule",
    icon: <CheckCircle className="w-5 h-5" />,
  },
];

export const SmartWateringWizard = ({
  isOpen,
  onClose,
  onApplySchedule,
  baseDays,
  plantName,
}: SmartWateringWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [factors, setFactors] = useState<Partial<WateringFactors>>(() => ({
    plantSize: undefined,
    lightLevel: undefined,
    temperature: undefined,
    humidity: undefined,
    season: getCurrentSeason(),
    careStyle: undefined,
    soilType: undefined,
  }));
  const [result, setResult] = useState<SmartScheduleResult | null>(null);
  const [enableWeatherData, setEnableWeatherData] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [weatherMappingReasons, setWeatherMappingReasons] = useState<string[]>([]);

  const { preferences, getDefaultFactors } = useSmartWateringPreferences();
  const location = useLocation();
  const weather = useWeatherData({
    location: location.location,
    autoFetch: enableWeatherData && !!location.location,
  });

  const labels = getFactorLabels();

  // Initialize factors from user preferences if available
  const initializeFromPreferences = useCallback(() => {
    const defaultFactors = getDefaultFactors();
    setFactors((prev) => ({
      ...prev,
      lightLevel: defaultFactors.lightLevel || undefined,
      temperature: defaultFactors.temperature || undefined,
      humidity: defaultFactors.humidity || undefined,
      careStyle: defaultFactors.careStyle || undefined,
      soilType: defaultFactors.soilType || undefined,
    }));
  }, [getDefaultFactors]);

  // Apply weather data to factors when available
  const applyWeatherDataToFactors = useCallback(() => {
    if (!weather.weatherData || !enableWeatherData) return;

    const mappingResult = mapWeatherToFactors(weather.weatherData);
    setFactors((prev) => ({
      ...prev,
      temperature: mappingResult.factors.temperature,
      humidity: mappingResult.factors.humidity,
      season: mappingResult.factors.season,
    }));
    setWeatherMappingReasons(mappingResult.mappingReasons);
  }, [weather.weatherData, enableWeatherData]);

  useEffect(() => {
    if (preferences) {
      initializeFromPreferences();
    }
  }, [preferences, initializeFromPreferences]);

  useEffect(() => {
    if (enableWeatherData && weather.weatherData) {
      applyWeatherDataToFactors();
    }
  }, [enableWeatherData, weather.weatherData, applyWeatherDataToFactors]);

  useEffect(() => {
    if (enableWeatherData && !location.location && !location.isLoading) {
      setShowLocationDialog(true);
    }
  }, [enableWeatherData, location.location, location.isLoading]);

  const updateFactor = <K extends keyof WateringFactors>(
    key: K,
    value: WateringFactors[K]
  ) => {
    setFactors((prev) => ({ ...prev, [key]: value }));
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return !!factors.plantSize;
      case 2:
        return !!(factors.lightLevel && factors.temperature && factors.humidity);
      case 3:
        return !!(factors.careStyle && factors.soilType);
      default:
        return true;
    }
  };

  const goToNextStep = () => {
    if (currentStep === 3) {
      if (
        factors.plantSize &&
        factors.lightLevel &&
        factors.temperature &&
        factors.humidity &&
        factors.season &&
        factors.careStyle &&
        factors.soilType
      ) {
        const baseResult = calculateSmartWateringSchedule(
          baseDays,
          factors as WateringFactors
        );

        let finalResult = baseResult;
        if (enableWeatherData && weather.weatherData) {
          const weatherAdjustments = calculateWeatherScheduleAdjustments(
            weather.weatherData,
            baseResult.recommendedDays
          );

          if (weatherAdjustments.adjustmentDays !== 0) {
            const adjustedDays = applyWeatherAdjustments(
              baseResult.recommendedDays,
              weather.weatherData
            );

            finalResult = {
              ...baseResult,
              recommendedDays: adjustedDays,
              totalAdjustment: baseResult.totalAdjustment + weatherAdjustments.adjustmentDays,
              adjustmentReasons: [
                ...baseResult.adjustmentReasons,
                ...weatherAdjustments.reasons,
              ],
            };
          }
        }

        setResult(finalResult);
      }
    }
    setCurrentStep((prev) => Math.min(4, prev + 1));
  };

  const goToPreviousStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleApplySchedule = () => {
    if (result) {
      onApplySchedule(result.recommendedDays);
      onClose();
    }
  };

  const handleStartOver = () => {
    setCurrentStep(1);
    setFactors({
      plantSize: undefined,
      lightLevel: undefined,
      temperature: undefined,
      humidity: undefined,
      season: getCurrentSeason(),
      careStyle: undefined,
      soilType: undefined,
    });
    setResult(null);
    setWeatherMappingReasons([]);
  };

  const handleLocationSelected = (_selectedLocation: LocationData) => {
    setShowLocationDialog(false);
  };

  const handleUseCurrentLocation = async () => {
    await location.requestLocation();
    setShowLocationDialog(false);
  };

  const handleSearchCity = async (cityName: string) => {
    return await location.getLocationFromCity(cityName);
  };

  const handleToggleWeatherData = (enabled: boolean) => {
    setEnableWeatherData(enabled);
    if (enabled && !location.location) {
      setShowLocationDialog(true);
    } else if (!enabled) {
      initializeFromPreferences();
      setWeatherMappingReasons([]);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepPlantSize
            factors={factors}
            updateFactor={updateFactor}
            labels={labels}
            plantName={plantName}
          />
        );
      case 2:
        return (
          <StepEnvironment
            factors={factors}
            updateFactor={updateFactor}
            labels={labels}
            enableWeatherData={enableWeatherData}
            onToggleWeatherData={handleToggleWeatherData}
            weatherData={weather.weatherData}
            weatherIsLoading={weather.isLoading}
            weatherIsFallback={weather.isFallback}
            weatherError={weather.error?.message}
            onRefreshWeather={weather.refreshWeather}
            locationExists={!!location.location}
            locationIsLoading={location.isLoading}
            weatherMappingReasons={weatherMappingReasons}
            temperatureUnit={preferences?.temperature_unit || 'F'}
          />
        );
      case 3:
        return (
          <StepPreferences
            factors={factors}
            updateFactor={updateFactor}
            labels={labels}
          />
        );
      case 4:
        return result ? (
          <StepResults
            result={result}
            onStartOver={handleStartOver}
            onApplySchedule={handleApplySchedule}
          />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-sprout-dark text-sprout-white">
          <DialogHeader>
            <DialogTitle
              className="flex items-center gap-2 text-sprout-white"
              data-testid="wizard-title"
            >
              <Brain className="w-5 h-5 text-sprout-light" />
              Smart Watering Schedule
            </DialogTitle>
            <DialogDescription className="text-sprout-light">
              Let's create a personalized watering schedule based on your
              plant's needs and environment.
            </DialogDescription>
          </DialogHeader>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-sprout-light">
              <span>
                Step {currentStep} of {STEPS.length}
              </span>
              <span>
                {Math.round(((currentStep - 1) / STEPS.length) * 100)}% complete
              </span>
            </div>
            <Progress
              value={((currentStep - 1) / STEPS.length) * 100}
              className="h-2"
              data-testid="progress-bar"
            />
          </div>

          {/* Step Indicators */}
          <div
            className="flex justify-between items-center py-4"
            data-testid="step-indicators"
          >
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={cn(
                  "flex flex-col items-center text-center flex-1",
                  step.id <= currentStep
                    ? "text-sprout-success"
                    : "text-sprout-medium"
                )}
                data-testid={`step-indicator-${step.id}`}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center mb-1 border-2",
                    step.id < currentStep
                      ? "bg-sprout-success border-sprout-success text-sprout-white"
                      : step.id === currentStep
                      ? "border-sprout-success bg-sprout-success/20"
                      : "border-sprout-medium"
                  )}
                >
                  {step.id < currentStep ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    step.icon
                  )}
                </div>
                <span className="text-xs font-medium text-sprout-white">
                  {step.title}
                </span>
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="py-4">{renderStepContent()}</div>

          {/* Navigation */}
          {currentStep < 4 && (
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={goToPreviousStep}
                disabled={currentStep === 1}
                className="flex items-center gap-2 border-sprout-light text-sprout-light hover:bg-sprout-light hover:text-sprout-dark"
                data-testid="back-button"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button
                onClick={goToNextStep}
                disabled={!canProceedToNextStep()}
                className="flex items-center gap-2 bg-sprout-success hover:bg-sprout-success/90 text-sprout-white"
                data-testid="next-button"
              >
                {currentStep === 3 ? "Calculate Schedule" : "Continue"}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Location Permission Dialog */}
      <LocationPermissionDialog
        isOpen={showLocationDialog}
        onClose={() => {
          setShowLocationDialog(false);
          setEnableWeatherData(false);
          initializeFromPreferences();
          setWeatherMappingReasons([]);
        }}
        onLocationSelected={handleLocationSelected}
        onUseCurrentLocation={handleUseCurrentLocation}
        onSearchCity={handleSearchCity}
        error={location.error}
        isLoading={location.isLoading}
        currentLocation={location.location}
      />
    </>
  );
};
