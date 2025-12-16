
import { Plant } from '../types';
import { PLANT_IMAGES_BASE_URL } from '@/constants/supabase';

export const tropicalPlants: Plant[] = [
 {
 name: 'Monstera Deliciosa',
    botanicalName: 'Monstera deliciosa',
    image: PLANT_IMAGES_BASE_URL + '/Monstera%20Deliciosa.png',
    wateringFrequency: 'Bi-weekly',
 suggestedWateringDays: 14,
 lightRequirement: 'Bright Indirect Light',
 careLevel: 'Medium' as const,
 category: 'Tropical Plants'
 },
 {
 name: 'Bird of Paradise',
    botanicalName: 'Strelitzia nicolai',
    image: PLANT_IMAGES_BASE_URL + '/Bird%20of%20Paradise.jpg',
    wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Bright Indirect Light',
 careLevel: 'Hard' as const,
 category: 'Tropical Plants'
 },
 {
 name: 'African Mask',
    botanicalName: 'Alocasia amazonica',
    image: PLANT_IMAGES_BASE_URL + '/African%20Mask.jpg',
    wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Bright Indirect Light',
 careLevel: 'Hard' as const,
 category: 'Tropical Plants'
 },
 {
 name: 'Monstera Adansonii',
    botanicalName: 'Monstera adansonii',
    image: PLANT_IMAGES_BASE_URL + '/Monstera%20Adansonii.jpg',
    wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Bright Indirect Light',
 careLevel: 'Medium' as const,
 category: 'Tropical Plants'
 },
 {
 name: 'Dumb Cane',
    botanicalName: 'Dieffenbachia seguine',
    image: PLANT_IMAGES_BASE_URL + '/Dumb%20Cane.jpg',
    wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Medium Light',
 careLevel: 'Easy' as const,
 category: 'Tropical Plants'
 },
 {
 name: 'Philodendron Brasil',
    botanicalName: 'Philodendron hederaceum',
    image: PLANT_IMAGES_BASE_URL + '/Philodendron%20Brasil.jpg',
    wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Medium Light',
 careLevel: 'Easy' as const,
 category: 'Tropical Plants',
 description: 'A stunning variegated philodendron with heart-shaped leaves featuring bright yellow and green patterns. Fast-growing and easy to care for.',
 toxicity: 'Toxic to pets if ingested',
 temperature: '65-78°F (18-26°C)',
 humidity: '40-60%',
 careInstructions: [
  'Water when top inch of soil feels dry',
  'Provide medium to bright indirect light',
  'Wipe leaves clean regularly',
  'Provide climbing support for best growth',
  'Propagate easily in water'
 ],
 commonProblems: [
  'Loss of variegation: Needs more bright light',
  'Yellowing leaves: Usually overwatering',
  'Leggy growth: Needs more light or pruning',
  'Brown leaf tips: Low humidity or fluoride sensitivity'
 ]
 },
 {
 name: 'Kentia Palm',
    botanicalName: 'Howea forsteriana',
    image: PLANT_IMAGES_BASE_URL + '/Kentia%20Palm.jpg',
    wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Medium Light',
 careLevel: 'Easy' as const,
 category: 'Tropical Plants',
 description: 'An elegant palm with arching fronds that adds a tropical feel to any space. Very tolerant of indoor conditions and low light.',
 toxicity: 'Non-toxic to pets',
 temperature: '65-80°F (18-27°C)',
 humidity: '40-50%',
 careInstructions: [
  'Water when top inch of soil is dry',
  'Provide medium to bright indirect light',
  'Clean fronds with damp cloth monthly',
  'Rotate occasionally for even growth',
  'Fertilize monthly during growing season'
 ],
 commonProblems: [
  'Brown frond tips: Low humidity or over-fertilizing',
  'Yellow fronds: Natural aging or overwatering',
  'Scale insects: Common pest, treat promptly',
  'Slow growth: Normal for this species'
 ]
 },
 {
 name: 'Banana Plant',
    botanicalName: 'Musa acuminata',
    image: PLANT_IMAGES_BASE_URL + '/Banana%20Plant.jpg',
    wateringFrequency: 'Weekly',
 suggestedWateringDays: 5,
 lightRequirement: 'Bright Direct Light',
 careLevel: 'Hard' as const,
 category: 'Tropical Plants',
 description: 'A dramatic tropical plant with large paddle-shaped leaves. Can produce small bananas indoors with proper care and sufficient light.',
 toxicity: 'Non-toxic to pets',
 temperature: '75-85°F (24-29°C)',
 humidity: '60-70%',
 careInstructions: [
  'Keep soil consistently moist but not waterlogged',
  'Provide maximum bright light (6+ hours)',
  'Maintain high humidity with humidifier',
  'Fertilize regularly during growing season',
  'Remove damaged leaves promptly'
 ],
 commonProblems: [
  'Brown leaf edges: Low humidity or fluoride sensitivity',
  'Yellowing leaves: Natural aging or inconsistent watering',
  'Pest issues: Spider mites in low humidity',
  'Slow growth: Needs more light, heat, or nutrients'
 ]
 },
 {
 name: 'Croton',
    botanicalName: 'Codiaeum variegatum',
    image: PLANT_IMAGES_BASE_URL + '/Croton.jpg',
    wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Bright Direct Light',
 careLevel: 'Medium' as const,
 category: 'Tropical Plants',
 description: 'A colorful tropical plant with vibrant, multicolored leaves. Crotons need bright light to maintain their stunning foliage colors.',
 toxicity: 'Toxic to pets and children if ingested',
 temperature: '70-80°F (21-27°C)',
 humidity: '50-60%',
 careInstructions: [
  'Keep soil consistently moist but well-draining',
  'Provide bright, direct light for best colors',
  'Maintain high humidity around the plant',
  'Avoid cold drafts and temperature fluctuations',
  'Fertilize monthly during growing season'
 ],
 commonProblems: [
  'Leaf drop: Usually from stress or sudden environmental changes',
  'Fading colors: Needs more bright, direct light',
  'Spider mites: Common in low humidity conditions',
  'Brown leaf tips: Low humidity or fluoride sensitivity'
 ]
 },
 {
 name: 'Philodendron Pink Princess',
    botanicalName: 'Philodendron erubescens',
    image: PLANT_IMAGES_BASE_URL + '/Philodendron%20Pink%20Princess.jpg',
    wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Bright Indirect Light',
 careLevel: 'Medium' as const,
 category: 'Tropical Plants',
 description: 'A rare and coveted philodendron with dark green leaves splashed with pink variegation. The pink coloring is unpredictable and highly prized.',
 toxicity: 'Toxic to pets if ingested',
 temperature: '65-80°F (18-27°C)',
 humidity: '50-60%',
 careInstructions: [
  'Water when top inch of soil feels dry',
  'Provide bright, indirect light for pink coloration',
  'Support climbing growth with moss pole',
  'Prune all-green growth to maintain variegation',
  'Maintain consistent humidity'
 ],
 commonProblems: [
  'Loss of pink: May revert, prune green sections',
  'Yellowing leaves: Usually overwatering',
  'Brown leaf tips: Low humidity or fluoride sensitivity',
  'Slow growth: Normal for variegated plants'
 ]
 },
 {
 name: 'Elephant Ear',
    botanicalName: 'Alocasia macrorrhiza',
    image: PLANT_IMAGES_BASE_URL + '/Elephant%20Ear.jpg',
    wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Bright Indirect Light',
 careLevel: 'Hard' as const,
 category: 'Tropical Plants',
 description: 'A dramatic plant with enormous arrow-shaped leaves that can grow several feet long. Creates a bold tropical statement indoors.',
 toxicity: 'Toxic to pets and children if ingested',
 temperature: '65-80°F (18-27°C)',
 humidity: '60-70%',
 careInstructions: [
  'Keep soil consistently moist but well-draining',
  'Provide bright, indirect light',
  'Maintain high humidity with humidifier',
  'Clean large leaves regularly',
  'Allow dormancy period in winter'
 ],
 commonProblems: [
  'Brown leaf edges: Low humidity or fluoride sensitivity',
  'Yellowing leaves: Natural aging or dormancy',
  'Drooping leaves: Usually underwatering or low humidity',
  'Pest issues: Watch for spider mites and aphids'
 ]
 }
];
