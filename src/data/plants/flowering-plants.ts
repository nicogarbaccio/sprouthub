
import { Plant } from '../types';
import { PLANT_IMAGES_BASE_URL } from '@/constants/supabase';

export const floweringPlants: Plant[] = [
 {
 name: 'Peace Lily',
 botanicalName: 'Spathiphyllum wallisii',
 image: PLANT_IMAGES_BASE_URL + '/Peace%20Lily.jpg',
 wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Low to Medium Light',
 careLevel: 'Easy' as const,
 category: 'Flowering Plants'
 },
 {
 name: 'Flamingo Flower',
    botanicalName: 'Anthurium andraeanum',
    image: PLANT_IMAGES_BASE_URL + '/Flamingo%20Flower.jpg',
    wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Bright Indirect Light',
 careLevel: 'Medium' as const,
 category: 'Flowering Plants'
 },
 {
 name: 'African Violet',
    botanicalName: 'Saintpaulia ionantha',
    image: PLANT_IMAGES_BASE_URL + '/African%20Violet.jpg',
    wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Bright Indirect Light',
 careLevel: 'Hard' as const,
 category: 'Flowering Plants'
 },
 {
 name: 'Christmas Cactus',
    botanicalName: 'Schlumbergera truncata',
    image: PLANT_IMAGES_BASE_URL + '/Christmas%20Cactus.jpg',
    wateringFrequency: 'Weekly',
 suggestedWateringDays: 10,
 lightRequirement: 'Bright Indirect Light',
 careLevel: 'Easy' as const,
 category: 'Flowering Plants'
 },
 {
 name: 'Begonia Rex',
    botanicalName: 'Begonia rex',
    image: PLANT_IMAGES_BASE_URL + '/Begonia%20Rex.jpg',
    wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Bright Indirect Light',
 careLevel: 'Medium' as const,
 category: 'Flowering Plants',
 description: 'Begonias are prized for their stunning colorful foliage and occasional small flowers. Their leaves display incredible patterns and colors.',
 toxicity: 'Mildly toxic to pets if ingested',
 temperature: '65-75°F (18-24°C)',
 humidity: '50-60%',
 careInstructions: [
  'Keep soil consistently moist but well-draining',
  'Provide bright, indirect light',
  'Maintain high humidity around the plant',
  'Avoid getting water on leaves',
  'Fertilize monthly during growing season'
 ],
 commonProblems: [
  'Powdery mildew: Improve air circulation and avoid wet leaves',
  'Brown leaf edges: Low humidity or fluoride sensitivity',
  'Leaf drop: Usually from temperature fluctuations',
  'Fading colors: Needs brighter indirect light'
 ]
 },
 {
 name: 'Sowbread',
    botanicalName: 'Cyclamen persicum',
    image: PLANT_IMAGES_BASE_URL + '/Sowbread.jpg',
    wateringFrequency: 'Twice weekly',
 suggestedWateringDays: 3,
 lightRequirement: 'Bright Indirect Light',
 careLevel: 'Hard' as const,
 category: 'Flowering Plants',
 description: 'Beautiful flowering plant with upswept petals and heart-shaped leaves. Cyclamen bloom in cooler months with proper care.',
 toxicity: 'Toxic to pets and children if ingested',
 temperature: '50-65°F (10-18°C)',
 humidity: '50-60%',
 careInstructions: [
  'Water from bottom to avoid wetting the crown',
  'Keep in cool, bright location',
  'Remove spent flowers and yellowing leaves',
  'Allow dormancy period in summer',
  'Resume watering when new growth appears'
 ],
 commonProblems: [
  'Crown rot: Avoid watering the center of the plant',
  'Yellowing leaves: Natural dormancy or overwatering',
  'Short bloom period: Needs cool temperatures',
  'Wilting flowers: Too warm or needs water'
 ]
 },
 {
 name: 'Geranium',
    botanicalName: 'Pelargonium x hortorum',
    image: PLANT_IMAGES_BASE_URL + '/Geranium.jpg',
    wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Bright Direct Light',
 careLevel: 'Easy' as const,
 category: 'Flowering Plants',
 description: 'Classic flowering houseplant with vibrant blooms and distinctive scented foliage. Geraniums are reliable bloomers with proper care.',
 toxicity: 'Mildly toxic to pets',
 temperature: '65-70°F (18-21°C)',
 humidity: '30-40%',
 careInstructions: [
  'Water thoroughly when soil surface is dry',
  'Provide at least 4-6 hours of direct sunlight',
  'Deadhead spent flowers regularly',
  'Pinch growing tips to encourage bushiness',
  'Fertilize every 2-3 weeks during blooming season'
 ],
 commonProblems: [
  'Lack of flowers: Usually insufficient light',
  'Yellowing leaves: Overwatering or natural aging',
  'Leggy growth: Needs more light and pinching',
  'Leaf spots: Avoid overhead watering'
 ]
 },
 {
 name: 'Flaming Katy',
    botanicalName: 'Kalanchoe blossfeldiana',
    image: PLANT_IMAGES_BASE_URL + '/Flaming%20Katy.jpg',
    wateringFrequency: 'Weekly',
 suggestedWateringDays: 10,
 lightRequirement: 'Bright Direct Light',
 careLevel: 'Easy' as const,
 category: 'Flowering Plants',
 description: 'A succulent flowering plant that produces clusters of small, colorful flowers. Long-lasting blooms and easy care make it very popular.',
 toxicity: 'Toxic to pets if ingested',
 temperature: '65-75°F (18-24°C)',
 humidity: '30-40%',
 careInstructions: [
  'Allow soil to dry between waterings',
  'Provide bright, direct sunlight for blooming',
  'Remove spent flower clusters',
  'Rest plant in cool, dark place for 6 weeks to rebloom',
  'Use well-draining potting mix'
 ],
 commonProblems: [
  'No flowers: Needs more direct light or rest period',
  'Overwatering: Can cause root rot quickly',
  'Leggy growth: Pinch back after flowering',
  'Short bloom period: Natural, but can be extended with care'
 ]
 },
 {
 name: 'Touch-Me-Not',
    botanicalName: 'Impatiens walleriana',
    image: PLANT_IMAGES_BASE_URL + '/Touch%20Me%20Not.jpg',
    wateringFrequency: 'Twice weekly',
 suggestedWateringDays: 3,
 lightRequirement: 'Bright Indirect Light',
 careLevel: 'Medium' as const,
 category: 'Flowering Plants',
 description: 'Colorful annual flowers that bloom continuously with proper care. Perfect for brightening indoor spaces with vibrant colors.',
 toxicity: 'Non-toxic to pets',
 temperature: '65-75°F (18-24°C)',
 humidity: '50-60%',
 careInstructions: [
  'Keep soil consistently moist but not soggy',
  'Provide bright, filtered light',
  'Deadhead spent flowers regularly',
  'Fertilize every 2-3 weeks during blooming',
  'Pinch growing tips to encourage bushiness'
 ],
 commonProblems: [
  'Wilting: Usually needs more water or humidity',
  'Fungal diseases: Improve air circulation',
  'Leggy growth: Pinch regularly and provide adequate light',
  'Dropping buds: Usually from stress or sudden changes'
 ]
 },
 {
 name: 'Orchid',
    botanicalName: 'Phalaenopsis species',
    image: PLANT_IMAGES_BASE_URL + '/Orchid.jpg',
    wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Bright Indirect Light',
 careLevel: 'Hard' as const,
 category: 'Flowering Plants',
 description: 'Elegant flowering plants with long-lasting blooms. Phalaenopsis orchids are among the easiest orchids to grow indoors.',
 toxicity: 'Non-toxic to pets',
 temperature: '65-80°F (18-27°C)',
 humidity: '50-70%',
 careInstructions: [
  'Water weekly with ice cubes or room temperature water',
  'Use orchid bark mix for potting',
  'Provide bright, indirect light',
  'Maintain high humidity around plant',
  'Fertilize monthly with orchid fertilizer'
 ],
 commonProblems: [
  'Crown rot: Avoid getting water in the center',
  'Root rot: Ensure excellent drainage',
  'Lack of blooms: May need temperature variation',
  'Yellowing leaves: Natural aging or overwatering'
 ]
 },
 {
 name: 'Flowering Maple',
    botanicalName: 'Abutilon pictum',
    image: PLANT_IMAGES_BASE_URL + '/Flowering%20Maple.jpg',
    wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Bright Direct Light',
 careLevel: 'Medium' as const,
 category: 'Flowering Plants',
 description: 'A fast-growing plant with maple-like leaves and bell-shaped flowers in various colors. Blooms almost year-round with proper care.',
 toxicity: 'Non-toxic to pets',
 temperature: '65-75°F (18-24°C)',
 humidity: '40-50%',
 careInstructions: [
  'Keep soil consistently moist during growing season',
  'Provide bright light for best flowering',
  'Pinch growing tips to encourage bushiness',
  'Fertilize every 2-3 weeks during blooming',
  'Prune to maintain desired size'
 ],
 commonProblems: [
  'Lack of flowers: Usually insufficient light',
  'Leggy growth: Pinch regularly and provide more light',
  'Yellowing leaves: Natural aging or overwatering',
  'Pest issues: Watch for whiteflies and aphids'
 ]
 },
 {
 name: 'Hibiscus',
    botanicalName: 'Hibiscus rosa-sinensis',
    image: PLANT_IMAGES_BASE_URL + '/Hibiscus.jpg',
    wateringFrequency: 'Weekly',
 suggestedWateringDays: 5,
 lightRequirement: 'Bright Direct Light',
 careLevel: 'Medium' as const,
 category: 'Flowering Plants',
 description: 'Tropical flowering shrub with large, showy blooms. Individual flowers last only a day but new ones appear regularly.',
 toxicity: 'Non-toxic to pets',
 temperature: '65-80°F (18-27°C)',
 humidity: '50-60%',
 careInstructions: [
  'Keep soil consistently moist but well-draining',
  'Provide at least 6 hours of direct sunlight',
  'Fertilize regularly during growing season',
  'Prune to maintain shape and encourage blooming',
  'Maintain high humidity around the plant'
 ],
 commonProblems: [
  'Lack of flowers: Usually insufficient light',
  'Bud drop: From stress or environmental changes',
  'Yellow leaves: Normal aging or inconsistent watering',
  'Pest issues: Watch for aphids and spider mites'
 ]
 },
 {
 name: 'Paper Flower',
    botanicalName: 'Bougainvillea spectabilis',
    image: PLANT_IMAGES_BASE_URL + '/Paper%20Flower.jpg',
    wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Bright Direct Light',
 careLevel: 'Medium' as const,
 category: 'Flowering Plants',
 description: 'Vibrant climbing plant with colorful bracts that surround small white flowers. Thorny but spectacular when in bloom.',
 toxicity: 'Mildly toxic to pets',
 temperature: '65-75°F (18-24°C)',
 humidity: '40-50%',
 careInstructions: [
  'Allow soil to dry slightly between waterings',
  'Provide maximum direct sunlight',
  'Prune after flowering to maintain shape',
  'Support climbing growth with trellis',
  'Fertilize monthly during growing season'
 ],
 commonProblems: [
  'Lack of color: Needs more direct sunlight',
  'Thorns: Handle with gloves when pruning',
  'Leggy growth: Prune regularly to maintain shape',
  'Leaf drop: Usually from environmental stress'
 ]
 },
 {
 name: 'Crown of Thorns',
    botanicalName: 'Euphorbia milii',
    image: PLANT_IMAGES_BASE_URL + '/Crown%20of%20Thorns.jpg',
    wateringFrequency: 'Weekly',
 suggestedWateringDays: 10,
 lightRequirement: 'Bright Direct Light',
 careLevel: 'Medium' as const,
 category: 'Flowering Plants',
 description: 'A thorny succulent that produces small, colorful bracts year-round. Very drought tolerant and blooms continuously with proper care.',
 toxicity: 'Toxic to pets and humans - sap causes skin irritation',
 temperature: '65-75°F (18-24°C)',
 humidity: '30-40%',
 careInstructions: [
  'Water when top inch of soil is dry',
  'Provide at least 4 hours of direct sunlight',
  'Handle with gloves due to thorns and toxic sap',
  'Deadhead spent bracts to encourage more blooms',
  'Use well-draining succulent potting mix'
 ],
 commonProblems: [
  'Lack of flowers: Usually insufficient light',
  'Leaf drop: Natural response to stress',
  'Skin irritation: Always wear gloves when handling',
  'Root rot: From overwatering in cool conditions'
 ]
 },
 {
 name: 'Pentas',
    botanicalName: 'Pentas lanceolata',
    image: 'https://res.cloudinary.com/dojdglovh/image/upload/v1750963241/Pentas-lanceolata_ceozih.jpg',
    wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Bright Direct Light',
 careLevel: 'Easy' as const,
 category: 'Flowering Plants',
 description: 'Star-shaped flowers in clusters that bloom continuously. Easy to care for and attracts butterflies when placed outdoors.',
 toxicity: 'Non-toxic to pets',
 temperature: '65-75°F (18-24°C)',
 humidity: '40-50%',
 careInstructions: [
  'Keep soil consistently moist but well-draining',
  'Provide bright, direct sunlight',
  'Deadhead spent flowers regularly',
  'Pinch growing tips to encourage bushiness',
  'Fertilize every 2-3 weeks during blooming season'
 ],
 commonProblems: [
  'Lack of flowers: Usually insufficient light',
  'Leggy growth: Pinch regularly and provide more light',
  'Wilting: Usually needs more water',
  'Pest issues: Watch for aphids and whiteflies'
 ]
 }
];
