import { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Brain, X } from "lucide-react";
import {
  WateringFactors,
  SmartScheduleResult,
  calculateSmartWateringSchedule,
  getCurrentSeason,
  getFactorLabels,
} from "@/utils/watering/smartSchedule";
import { cn } from "@/lib/utils";
import { useSmartWateringPreferences } from "@/hooks/useSmartWateringPreferences";
import { useLocation } from "@/hooks/useLocation";
import { useWeatherData } from "@/hooks/useWeatherData";
import { mapWeatherToFactors } from "@/utils/weather/mapping";
import { calculateWeatherScheduleAdjustments, applyWeatherAdjustments } from "@/utils/watering/weatherAdjustments";
import { LocationPermissionDialog } from "@/components/LocationPermissionDialog";
import type { LocationData } from "@/services/weatherTypes";
import { StepPlantSize } from "@/components/wizard/StepPlantSize";
import { StepEnvironment } from "@/components/wizard/StepEnvironment";
import { StepPreferences } from "@/components/wizard/StepPreferences";
import { StepResults } from "@/components/wizard/StepResults";
import { StepNav } from "@/components/onboarding/OnboardingUI";
import {
  SheetGrabber,
  dialogSheetClasses,
  sheetHeaderClasses,
  sheetIconButtonClasses,
  sheetTitleClasses,
} from "@/components/ui/bento-sheet";

interface SmartWateringWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySchedule: (days: number) => void;
  baseDays: number;
  plantName: string;
}

const STEPS = [
  { id: 1, title: "Plant size" },
  { id: 2, title: "Environment" },
  { id: 3, title: "Preferences" },
  { id: 4, title: "Results" },
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
  const hasInitializedFromPreferences = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Each step starts at the top of the sheet
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
  }, [currentStep]);

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
    if (preferences && !hasInitializedFromPreferences.current) {
      hasInitializedFromPreferences.current = true;
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
    hasInitializedFromPreferences.current = false;
  };

  const handleLocationSelected = (_selectedLocation: LocationData) => {
    setShowLocationDialog(false);
  };

  const handleUseCurrentLocation = async () => {
    // Keep the dialog open on failure so the user can search for a city instead
    const result = await location.requestLocation();
    if (result) setShowLocationDialog(false);
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
        <DialogContent ref={contentRef} className={cn(dialogSheetClasses, "sm:max-w-xl")}>
          <SheetGrabber />
          <DialogHeader className={sheetHeaderClasses}>
            <div className="w-[52px] h-[52px] shrink-0 rounded-[18px] bg-sprout-primary text-sprout-cream flex items-center justify-center">
              <Brain className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className={sheetTitleClasses} data-testid="wizard-title">
                Smart schedule
              </DialogTitle>
              <DialogDescription className="text-sm font-medium truncate">For {plantName}</DialogDescription>
            </div>
            <button type="button" onClick={onClose} className={cn(sheetIconButtonClasses, "self-start")} aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </DialogHeader>

          {/* Progress: one segment per step */}
          <div className="mt-4 px-1.5">
            <div className="flex items-baseline justify-between text-xs font-bold tracking-[0.8px] uppercase text-muted-foreground">
              <span>
                Step {currentStep} of {STEPS.length}
              </span>
              <span>{STEPS[currentStep - 1].title}</span>
            </div>
            <div
              className="flex gap-1.5 mt-2"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={STEPS.length}
              aria-valuenow={currentStep}
              aria-label="Wizard progress"
              data-testid="progress-bar"
            >
              {STEPS.map((step) => (
                <div
                  key={step.id}
                  data-testid={`step-indicator-${step.id}`}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-colors",
                    step.id <= currentStep ? "bg-sprout-success" : "bg-card"
                  )}
                />
              ))}
            </div>
          </div>

          <div className="mt-5">{renderStepContent()}</div>

          {currentStep < 4 && (
            <div className="mt-5">
              <StepNav
                onBack={currentStep > 1 ? goToPreviousStep : undefined}
                onNext={goToNextStep}
                disabled={!canProceedToNextStep()}
                label={currentStep === 3 ? "Calculate schedule" : "Continue"}
              />
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
