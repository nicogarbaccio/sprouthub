
export interface Plant {
 name: string;
 botanicalName: string;
 image: string;
 wateringFrequency: string;
 suggestedWateringDays: number;
 lightRequirement: string;
 careLevel: 'Easy' | 'Medium' | 'Hard';
 category: string;
 description?: string;
 toxicity?: string;
 temperature?: string;
 humidity?: string;
 careInstructions?: string[];
 commonProblems?: string[];
 isOutdoorPlant?: boolean; // Added for weather-based rain delay feature
}
