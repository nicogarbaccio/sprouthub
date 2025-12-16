
import { Plant } from '../types';
import { PLANT_IMAGES_BASE_URL } from '@/constants/supabase';

export const otherPlants: Plant[] = [
 {
  name: 'ZZ Plant',
  botanicalName: 'Zamioculcas zamiifolia',
  otherNames: ['Zanzibar Gem', 'Zuzu Plant'],
  image: PLANT_IMAGES_BASE_URL + '/ZZ%20Plant.png',
    wateringFrequency: 'Monthly',
 suggestedWateringDays: 30,
 lightRequirement: 'Low to Medium Light',
 careLevel: 'Easy' as const,
 category: 'Low Maintenance'
 },
 {
  name: 'Boston Fern',
  botanicalName: 'Nephrolepis exaltata',
  otherNames: ['Sword Fern'],
  image: PLANT_IMAGES_BASE_URL + '/Boston%20Fern.jpg',
    wateringFrequency: 'Twice weekly',
 suggestedWateringDays: 3,
 lightRequirement: 'Bright Indirect Light',
 careLevel: 'Medium' as const,
 category: 'Ferns'
 },
 {
  name: 'Chinese Money Plant',
  botanicalName: 'Pilea peperomioides',
  otherNames: ['Pancake Plant', 'UFO Plant'],
  image: PLANT_IMAGES_BASE_URL + '/Chinese%20Money%20Plant.jpg',
    wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Bright Indirect Light',
 careLevel: 'Easy' as const,
 category: 'Small Plants'
 },
 {
  name: 'Calathea',
  botanicalName: 'Calathea orbifolia',
  otherNames: ['Round-leaved Calathea'],
  image: PLANT_IMAGES_BASE_URL + '/Calathea.jpg',
    wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Medium Light',
 careLevel: 'Hard' as const,
 category: 'Prayer Plants'
 },
 {
  name: 'Majesty Palm',
  botanicalName: 'Ravenea rivularis',
  otherNames: ['Ravenea', 'Majestic Palm'],
  image: PLANT_IMAGES_BASE_URL + '/Majesty%20Palm.jpg',
    wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Bright Indirect Light',
 careLevel: 'Medium' as const,
 category: 'Palms'
 },
 {
  name: 'Peperomia',
  botanicalName: 'Peperomia obtusifolia',
  otherNames: ['Baby Rubber Plant'],
  image: PLANT_IMAGES_BASE_URL + '/Peperomia.jpg',
    wateringFrequency: 'Weekly',
 suggestedWateringDays: 10,
 lightRequirement: 'Medium Light',
 careLevel: 'Easy' as const,
 category: 'Small Plants'
 },
 {
  name: 'Ponytail Palm',
  botanicalName: 'Beaucarnea recurvata',
  otherNames: ['Elephant\'s Foot'],
  image: PLANT_IMAGES_BASE_URL + '/Ponytail%20Palm.jpg',
    wateringFrequency: 'Monthly',
 suggestedWateringDays: 30,
 lightRequirement: 'Bright Direct Light',
 careLevel: 'Easy' as const,
 category: 'Palms'
 },
 {
  name: 'Prayer Plant',
  botanicalName: 'Maranta leuconeura',
  otherNames: ['Rabbit Tracks'],
  image: PLANT_IMAGES_BASE_URL + '/Prayer%20Plant.jpg',
    wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Medium Light',
 careLevel: 'Medium' as const,
 category: 'Prayer Plants'
 },
 {
  name: 'Parlor Palm',
  botanicalName: 'Chamaedorea elegans',
  otherNames: ['Neanthe Bella Palm'],
  image: PLANT_IMAGES_BASE_URL + '/Parlor%20Palm.jpg',
    wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Low to Medium Light',
 careLevel: 'Easy' as const,
 category: 'Palms'
 },
 {
  name: 'Maidenhair Fern',
  botanicalName: 'Adiantum raddianum',
  otherNames: ['Venus Hair Fern'],
  image: PLANT_IMAGES_BASE_URL + '/Maidenhair%20Fern.jpg',
    wateringFrequency: 'Twice weekly',
 suggestedWateringDays: 3,
 lightRequirement: 'Bright Indirect Light',
 careLevel: 'Hard' as const,
 category: 'Ferns',
 description: 'Delicate and graceful fern with fine, lacy fronds. Known for being finicky but absolutely stunning when properly cared for.',
 toxicity: 'Non-toxic to pets',
 temperature: '65-75°F (18-24°C)',
 humidity: '60-80%',
 careInstructions: [
  'Keep soil consistently moist but not soggy',
  'Provide high humidity with pebble tray or humidifier',
  'Avoid direct sunlight',
  'Use distilled or rainwater if possible',
  'Mist regularly but avoid getting water on fronds'
 ],
 commonProblems: [
  'Brown, crispy fronds: Low humidity or dry air',
  'Yellowing fronds: Natural aging or overwatering',
  'Dropping leaflets: Shock from environmental changes',
  'Slow growth: Needs more humidity or filtered light'
 ]
 },
 {
  name: 'Staghorn Fern',
  botanicalName: 'Platycerium bifurcatum',
  otherNames: ['Elkhorn Fern'],
  image: PLANT_IMAGES_BASE_URL + '/Staghorn%20Fern.jpg',
    wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Bright Indirect Light',
 careLevel: 'Medium' as const,
 category: 'Ferns',
 description: 'An epiphytic fern with distinctive antler-shaped fronds. Often mounted on wood or grown in hanging baskets for dramatic effect.',
 toxicity: 'Non-toxic to pets',
 temperature: '65-80°F (18-27°C)',
 humidity: '50-70%',
 careInstructions: [
  'Soak weekly by submerging the entire mount',
  'Provide bright, indirect light',
  'Ensure good air circulation',
  'Don\'t remove brown shield fronds',
  'Fertilize monthly with diluted liquid fertilizer'
 ],
 commonProblems: [
  'Brown frond tips: Low humidity or over-fertilizing',
  'Yellowing fronds: Usually overwatering',
  'Pests: Watch for scale insects',
  'Slow growth: May need more light or nutrients'
 ]
 },
 {
  name: 'Bird\'s Nest Fern',
  botanicalName: 'Asplenium nidus',
  otherNames: ['Crow\'s Nest Fern'],
  image: PLANT_IMAGES_BASE_URL + '/Birds%20Nest%20Fern.jpg',
    wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Medium Light',
 careLevel: 'Easy' as const,
 category: 'Ferns',
 description: 'A tropical fern with broad, glossy fronds that emerge from a central crown, resembling a bird\'s nest. Perfect for bathrooms.',
 toxicity: 'Non-toxic to pets',
 temperature: '65-80°F (18-27°C)',
 humidity: '50-60%',
 careInstructions: [
  'Water around the base, avoid the center crown',
  'Keep soil consistently moist',
  'Provide filtered or indirect light',
  'Clean leaves with damp cloth occasionally',
  'Don\'t touch or handle new fronds'
 ],
 commonProblems: [
  'Brown leaf tips: Low humidity or fluoride in water',
  'Yellowing fronds: Natural aging or overwatering',
  'Crown rot: Avoid watering into the center',
  'Torn fronds: Handle carefully, new growth is delicate'
 ]
 },
 {
  name: 'Coleus',
  botanicalName: 'Solenostemon scutellarioides',
  otherNames: ['Painted Nettle'],
  image: PLANT_IMAGES_BASE_URL + '/Coleus.jpg',
    wateringFrequency: 'Weekly',
 suggestedWateringDays: 5,
 lightRequirement: 'Bright Indirect Light',
 careLevel: 'Easy' as const,
 category: 'Colorful Foliage',
 description: 'Vibrant foliage plant with incredible color combinations. Coleus comes in countless varieties with unique leaf patterns and colors.',
 toxicity: 'Mildly toxic to pets',
 temperature: '65-75°F (18-24°C)',
 humidity: '40-50%',
 careInstructions: [
  'Keep soil consistently moist',
  'Pinch flower spikes to maintain foliage',
  'Provide bright, indirect light for best colors',
  'Pinch growing tips to encourage bushiness',
  'Easy to propagate from cuttings'
 ],
 commonProblems: [
  'Fading colors: Usually needs more light',
  'Leggy growth: Pinch regularly and provide adequate light',
  'Wilting: Usually needs more water or humidity',
  'Flower spikes: Pinch to redirect energy to foliage'
 ]
 },
 {
  name: 'Caladium',
  botanicalName: 'Caladium bicolor',
  otherNames: ['Angel Wings', 'Elephant Ear'],
  image: PLANT_IMAGES_BASE_URL + '/Caladium.jpg',
    wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Bright Indirect Light',
 careLevel: 'Medium' as const,
 category: 'Colorful Foliage',
 description: 'Stunning tropical plant with heart-shaped leaves in brilliant colors. Caladiums are perfect for adding dramatic color to indoor spaces.',
 toxicity: 'Toxic to pets and children if ingested',
 temperature: '70-80°F (21-27°C)',
 humidity: '50-60%',
 careInstructions: [
  'Keep soil consistently moist during growing season',
  'Provide bright, filtered light',
  'Maintain high humidity',
  'Allow dormancy in winter',
  'Store tubers in warm, dry place during dormancy'
 ],
 commonProblems: [
  'Leaf drop: Natural in fall/winter or too cold',
  'Fading colors: Needs brighter indirect light',
  'Brown leaf edges: Low humidity or fluoride sensitivity',
  'Dormancy: Natural cycle, reduce watering'
 ]
 },
 {
  name: 'Nerve Plant',
  botanicalName: 'Fittonia albivenis',
  otherNames: ['Mosaic Plant'],
  image: PLANT_IMAGES_BASE_URL + '/Nerve%20Plant.jpg',
    wateringFrequency: 'Twice weekly',
 suggestedWateringDays: 3,
 lightRequirement: 'Medium Light',
 careLevel: 'Medium' as const,
 category: 'Small Plants',
 description: 'A small plant with intricate white or pink veined leaves. Perfect for terrariums and adds beautiful texture to plant collections.',
 toxicity: 'Non-toxic to pets',
 temperature: '65-75°F (18-24°C)',
 humidity: '60-70%',
 careInstructions: [
  'Keep soil consistently moist but not soggy',
  'Provide medium to bright indirect light',
  'Maintain high humidity around the plant',
  'Pinch flowers to encourage foliage growth',
  'Propagate easily from stem cuttings'
 ],
 commonProblems: [
  'Wilting: Usually needs more water or humidity',
  'Leggy growth: Pinch regularly to maintain compact shape',
  'Brown leaf tips: Low humidity or fluoride sensitivity',
  'Fading patterns: May need brighter indirect light'
 ]
 },
 {
  name: 'Cast Iron Plant',
  botanicalName: 'Aspidistra elatior',
  otherNames: ['Bar Room Plant'],
  image: PLANT_IMAGES_BASE_URL + '/Cast%20Iron%20Plant.jpg',
    wateringFrequency: 'Weekly',
 suggestedWateringDays: 10,
 lightRequirement: 'Low Light',
 careLevel: 'Easy' as const,
 category: 'Low Maintenance',
 description: 'Nearly indestructible plant with dark green, leathery leaves. Perfect for low-light areas and tolerates neglect better than most plants.',
 toxicity: 'Non-toxic to pets',
 temperature: '55-75°F (13-24°C)',
 humidity: '30-50%',
 careInstructions: [
  'Water when soil feels dry to touch',
  'Tolerates very low light conditions',
  'Clean leaves with damp cloth occasionally',
  'Very drought tolerant once established',
  'Fertilize sparingly, if at all'
 ],
 commonProblems: [
  'Brown leaf tips: Usually from overwatering or poor water quality',
  'Slow growth: Normal and expected for this plant',
  'Scale insects: Occasionally problematic, treat promptly',
  'Yellowing leaves: Natural aging or excessive watering'
 ]
 },
 {
 name: 'Polka Dot Plant',
    botanicalName: 'Hypoestes phyllostachya',
    image: PLANT_IMAGES_BASE_URL + '/Polka%20Dot%20Plant.jpg',
    wateringFrequency: 'Weekly',
 suggestedWateringDays: 5,
 lightRequirement: 'Bright Indirect Light',
 careLevel: 'Easy' as const,
 category: 'Colorful Foliage',
 description: 'A compact plant with spotted leaves in pink, white, or red. Perfect for adding splashes of color to small spaces and terrariums.',
 toxicity: 'Non-toxic to pets',
 temperature: '65-75°F (18-24°C)',
 humidity: '50-60%',
 careInstructions: [
  'Keep soil consistently moist but well-draining',
  'Provide bright, indirect light for best coloration',
  'Pinch flower spikes to maintain foliage',
  'Maintain moderate humidity',
  'Propagate easily from stem cuttings'
 ],
 commonProblems: [
  'Fading spots: Needs more bright, indirect light',
  'Leggy growth: Pinch regularly to maintain compact shape',
  'Wilting: Usually needs more water or humidity',
  'Loss of color: Insufficient light or overwatering'
 ]
 },
 {
  name: 'Aluminum Plant',
  botanicalName: 'Pilea cadierei',
  otherNames: ['Watermelon Pilea'],
  image: PLANT_IMAGES_BASE_URL + '/Aluminum%20Plant.jpg',
    wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Bright Indirect Light',
 careLevel: 'Easy' as const,
 category: 'Small Plants',
 description: 'A small plant with distinctive silver markings on green leaves. Easy to care for and perfect for terrariums or small containers.',
 toxicity: 'Non-toxic to pets',
 temperature: '65-75°F (18-24°C)',
 humidity: '40-50%',
 careInstructions: [
  'Water when top inch of soil feels dry',
  'Provide bright, indirect light',
  'Pinch growing tips to encourage bushiness',
  'Rotate occasionally for even growth',
  'Easy to propagate from stem cuttings'
 ],
 commonProblems: [
  'Leggy growth: Pinch regularly and provide adequate light',
  'Fading silver markings: Needs more bright light',
  'Yellowing leaves: Usually overwatering',
  'Dropping leaves: Environmental stress or overwatering'
 ]
 },
 {
  name: 'Swedish Ivy',
  botanicalName: 'Plectranthus australis',
  otherNames: ['Creeping Charlie'],
  image: PLANT_IMAGES_BASE_URL + '/Swedish%20Ivy.jpg',
    wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Bright Indirect Light',
 careLevel: 'Easy' as const,
 category: 'Low Maintenance',
 description: 'A fast-growing trailing plant with round, scalloped leaves. Despite its name, it\'s not an ivy and is much easier to care for.',
 toxicity: 'Non-toxic to pets',
 temperature: '60-75°F (15-24°C)',
 humidity: '40-50%',
 careInstructions: [
  'Water when top inch of soil feels dry',
  'Provide bright, indirect light',
  'Pinch growing tips to encourage bushiness',
  'Very easy to propagate in water',
  'Fertilize monthly during growing season'
 ],
 commonProblems: [
  'Leggy growth: Pinch regularly and provide adequate light',
  'Yellowing leaves: Usually overwatering or natural aging',
  'Dropping leaves: Environmental stress or underwatering',
  'Slow growth: May need more light or nutrients'
 ]
 },
 {
  name: 'Arrowhead Plant',
  botanicalName: 'Syngonium podophyllum',
  otherNames: ['Goosefoot', 'Syngonium'],
  image: PLANT_IMAGES_BASE_URL + '/Arrowhead%20Plant.jpg',
    wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Medium Light',
 careLevel: 'Easy' as const,
 category: 'Low Maintenance',
 description: 'A versatile plant that changes leaf shape as it matures. Can be grown as a bushy plant or allowed to climb with support.',
 toxicity: 'Toxic to pets if ingested',
 temperature: '65-75°F (18-24°C)',
 humidity: '50-60%',
 careInstructions: [
  'Water when top inch of soil feels dry',
  'Provide medium to bright indirect light',
  'Support climbing growth with moss pole',
  'Prune to maintain desired shape',
  'Propagate easily from stem cuttings'
 ],
 commonProblems: [
  'Yellowing leaves: Usually overwatering',
  'Brown leaf tips: Low humidity or fluoride sensitivity',
  'Leggy growth: Needs more light or pruning',
  'Loss of variegation: May need more bright light'
 ]
 },
 {
  name: 'Wandering Jew',
  botanicalName: 'Tradescantia fluminensis',
  otherNames: ['Inch Plant', 'Spiderwort'],
  image: PLANT_IMAGES_BASE_URL + '/Wandering%20Jew.jpg',
    wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Bright Indirect Light',
 careLevel: 'Easy' as const,
 category: 'Low Maintenance',
 description: 'A fast-growing trailing plant with green and white striped leaves. Extremely easy to propagate and perfect for beginners.',
 toxicity: 'Mildly toxic to pets - may cause skin irritation',
 temperature: '65-75°F (18-24°C)',
 humidity: '40-50%',
 careInstructions: [
  'Keep soil consistently moist but not soggy',
  'Provide bright light for best variegation',
  'Pinch regularly to maintain compact growth',
  'Propagate easily in water or soil',
  'Trim regularly to prevent legginess'
 ],
 commonProblems: [
  'Fading variegation: Needs more bright light',
  'Leggy growth: Pinch regularly and provide adequate light',
  'Brown tips: Low humidity or fluoride sensitivity',
  'Overgrowing: Vigorous grower, trim regularly'
 ]
 }
];
