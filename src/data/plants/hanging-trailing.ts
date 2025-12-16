
import { Plant } from '../types';
import { PLANT_IMAGES_BASE_URL } from '@/constants/supabase';

export const hangingTrailingPlants: Plant[] = [
 {
 name: 'Pothos',
    botanicalName: 'Epipremnum aureum',
    image: PLANT_IMAGES_BASE_URL + '/Pothos.png',
    wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Medium Light',
 careLevel: 'Easy' as const,
 category: 'Hanging & Trailing Plants'
 },
 {
 name: 'Spider Plant',
    botanicalName: 'Chlorophytum comosum',
    image: PLANT_IMAGES_BASE_URL + '/Spider%20Plant.jpg',
    wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Bright Indirect Light',
 careLevel: 'Easy' as const,
 category: 'Hanging & Trailing Plants'
 },
 {
 name: 'English Ivy',
    botanicalName: 'Hedera helix',
    image: PLANT_IMAGES_BASE_URL + '/English%20Ivy.jpg',
    wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Bright Indirect Light',
 careLevel: 'Easy' as const,
 category: 'Hanging & Trailing Plants',
 description: 'A classic trailing plant with distinctive lobed leaves. English Ivy is perfect for hanging baskets and adds a touch of elegance to any space.',
 toxicity: 'Toxic to pets and children if ingested',
 temperature: '60-70°F (15-21°C)',
 humidity: '40-50%',
 careInstructions: [
  'Water when top inch of soil feels dry',
  'Provide bright, indirect light',
  'Pinch growing tips to encourage bushier growth',
  'Clean leaves regularly to remove dust',
  'Fertilize monthly during growing season'
 ],
 commonProblems: [
  'Spider mites: Increase humidity and check regularly',
  'Yellowing leaves: Usually from overwatering',
  'Leggy growth: Needs more light or pinching',
  'Brown leaf tips: Low humidity or fluoride in water'
 ]
 },
 {
 name: 'String of Hearts',
    botanicalName: 'Ceropegia woodii',
    image: PLANT_IMAGES_BASE_URL + '/String%20of%20Hearts.jpg',
    wateringFrequency: 'Bi-weekly',
 suggestedWateringDays: 14,
 lightRequirement: 'Bright Indirect Light',
 careLevel: 'Easy' as const,
 category: 'Hanging & Trailing Plants',
 description: 'A charming succulent vine with heart-shaped leaves and distinctive silver markings. Perfect for hanging baskets with its delicate trailing habit.',
 toxicity: 'Non-toxic to pets',
 temperature: '65-75°F (18-24°C)',
 humidity: '30-40%',
 careInstructions: [
  'Allow soil to dry between waterings',
  'Provide bright, indirect light for best coloration',
  'Propagate easily from stem cuttings',
  'Trim to maintain desired length',
  'Fertilize sparingly during growing season'
 ],
 commonProblems: [
  'Root rot: Ensure good drainage and don\'t overwater',
  'Pale leaves: Needs more light',
  'Sparse growth: May need more light or nutrients',
  'Shriveled leaves: Underwatering or low humidity'
 ]
 },
 {
 name: 'Heartleaf Philodendron',
    botanicalName: 'Philodendron hederaceum',
    image: PLANT_IMAGES_BASE_URL + '/Heartleaf%20Philodendron.jpg',
    wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Medium Light',
 careLevel: 'Easy' as const,
 category: 'Hanging & Trailing Plants',
 description: 'One of the easiest houseplants to grow, with glossy heart-shaped leaves that trail beautifully from hanging baskets or climb up supports.',
 toxicity: 'Toxic to pets if ingested',
 temperature: '65-78°F (18-26°C)',
 humidity: '40-60%',
 careInstructions: [
  'Water when top inch of soil feels dry',
  'Tolerates low to medium light conditions',
  'Wipe leaves clean regularly for best appearance',
  'Propagate easily in water or soil',
  'Pinch growing tips to encourage bushiness'
 ],
 commonProblems: [
  'Yellowing leaves: Usually overwatering',
  'Brown leaf tips: Low humidity or fluoride sensitivity',
  'Leggy growth: Needs more light or regular pruning',
  'Pest issues: Watch for aphids and spider mites'
 ]
 },
 {
 name: 'String of Bananas',
    botanicalName: 'Senecio radicans',
    image: PLANT_IMAGES_BASE_URL + '/String%20of%20Bananas.jpg',
    wateringFrequency: 'Bi-weekly',
 suggestedWateringDays: 14,
 lightRequirement: 'Bright Indirect Light',
 careLevel: 'Easy' as const,
 category: 'Hanging & Trailing Plants',
 description: 'A delightful succulent with banana-shaped leaves that cascade from hanging planters. Related to String of Pearls but with a unique leaf shape.',
 toxicity: 'Mildly toxic to pets',
 temperature: '65-75°F (18-24°C)',
 humidity: '30-40%',
 careInstructions: [
  'Water thoroughly when soil is completely dry',
  'Provide bright, indirect sunlight',
  'Handle gently as leaves can drop easily',
  'Use well-draining succulent soil mix',
  'Propagate from stem cuttings'
 ],
 commonProblems: [
  'Overwatering: Most common cause of plant death',
  'Stretching: Needs more bright light',
  'Leaf drop: Natural when touched or stressed',
  'Root rot: Ensure excellent drainage'
 ]
 },
 {
 name: 'Burro\'s Tail',
    botanicalName: 'Sedum morganianum',
    image: PLANT_IMAGES_BASE_URL + '/Burros%20Tail.jpg',
    wateringFrequency: 'Bi-weekly',
 suggestedWateringDays: 14,
 lightRequirement: 'Bright Direct Light',
 careLevel: 'Easy' as const,
 category: 'Hanging & Trailing Plants',
 description: 'A unique trailing succulent with thick, blue-green leaves that cascade like a donkey\'s tail. Very drought tolerant and striking in hanging baskets.',
 toxicity: 'Non-toxic to pets',
 temperature: '65-75°F (18-24°C)',
 humidity: '20-40%',
 careInstructions: [
  'Water when soil is completely dry',
  'Handle very carefully as leaves drop easily',
  'Provide bright, direct sunlight',
  'Use well-draining succulent soil',
  'Propagate from fallen leaves or cuttings'
 ],
 commonProblems: [
  'Leaf drop: Natural when touched or from overwatering',
  'Stretching: Needs more direct sunlight',
  'Wrinkled leaves: Usually needs water',
  'Root rot: Ensure proper drainage'
 ]
 },
];
