
import { Plant } from '../types';
import { PLANT_IMAGES_BASE_URL } from '@/constants/supabase';

export const airPlants: Plant[] = [
  {
    name: 'Blushing Bride',
    botanicalName: 'Tillandsia ionantha',
    otherNames: ['Sky Plant', 'Air Plant'],
    image: PLANT_IMAGES_BASE_URL + '/Blushing%20Bride.jpg',
    wateringFrequency: 'Weekly',
    suggestedWateringDays: 7,
    lightRequirement: 'Bright Indirect Light',
    careLevel: 'Medium' as const,
    category: 'Air Plants',
    description: 'A compact air plant that turns pink/red when blooming. Perfect for terrariums, hanging displays, or mounted arrangements.',
    toxicity: 'Non-toxic to pets',
    temperature: '65-80°F (18-27°C)',
    humidity: '50-60%',
    careInstructions: [
      'Soak in water for 20-30 minutes weekly',
      'Shake off excess water and air dry completely',
      'Provide bright, indirect light',
      'Ensure good air circulation',
      'Mist between waterings in dry climates'
    ],
    commonProblems: [
      'Rotting: Usually from not drying completely after watering',
      'Shriveling: Needs more frequent watering or humidity',
      'Brown tips: Low humidity or over-fertilizing',
      'No blooming: Needs more bright light'
    ]
  },
  {
    name: 'Spanish Moss',
    botanicalName: 'Tillandsia usneoides',
    otherNames: ['Old Man\'s Beard', 'Grandpa\'s Beard'],
    image: PLANT_IMAGES_BASE_URL + '/Spanish%20Moss.jpg',
    wateringFrequency: 'Twice weekly',
    suggestedWateringDays: 3,
    lightRequirement: 'Bright Indirect Light',
    careLevel: 'Medium' as const,
    category: 'Air Plants',
    description: 'Dramatic trailing air plant that creates beautiful cascading displays. Often used in hanging arrangements and terrariums.',
    toxicity: 'Non-toxic to pets',
    temperature: '60-80°F (15-27°C)',
    humidity: '60-70%',
    careInstructions: [
      'Mist thoroughly 2-3 times per week',
      'Occasionally soak in water for 10-15 minutes',
      'Ensure excellent air circulation',
      'Provide bright, filtered light',
      'Gently shake to remove excess water'
    ],
    commonProblems: [
      'Rotting sections: Poor air circulation or staying wet too long',
      'Drying out: Needs more frequent misting',
      'Pests: Check for spider mites in dry conditions',
      'Breaking apart: Natural growth pattern, not a problem'
    ]
  },
  {
    name: 'Queen of Air Plants',
    botanicalName: 'Tillandsia xerographica',
    otherNames: ['Xeros'],
    image: PLANT_IMAGES_BASE_URL + '/Queen%20of%20Air%20Plants.jpg',
    wateringFrequency: 'Weekly',
    suggestedWateringDays: 10,
    lightRequirement: 'Bright Indirect Light',
    careLevel: 'Easy' as const,
    category: 'Air Plants',
    description: 'Known as the "Queen of Air Plants," this large, silvery air plant forms a stunning rosette and is very drought tolerant.',
    toxicity: 'Non-toxic to pets',
    temperature: '65-80°F (18-27°C)',
    humidity: '40-60%',
    careInstructions: [
      'Soak for 1-2 hours every 10-14 days',
      'Turn upside down to dry completely',
      'Provide bright, indirect light',
      'Avoid getting water trapped in center',
      'Very drought tolerant once established'
    ],
    commonProblems: [
      'Center rot: Water trapped in the rosette',
      'Dry, brittle leaves: Needs more humidity or watering',
      'Slow growth: Normal for this species',
      'Brown tips: Usually from low humidity'
    ]
  },
  {
    name: 'Pink Quill',
    botanicalName: 'Tillandsia cyanea',
    otherNames: ['Blue-flowered Torch', 'Fan Flower'],
    image: PLANT_IMAGES_BASE_URL + '/Pink%20Quill.jpg',
    wateringFrequency: 'Weekly',
    suggestedWateringDays: 7,
    lightRequirement: 'Bright Indirect Light',
    careLevel: 'Medium' as const,
    category: 'Air Plants',
    description: 'Also known as Pink Quill, this air plant produces a stunning pink flowering spike with purple flowers. Often grown in pots with bark.',
    toxicity: 'Non-toxic to pets',
    temperature: '65-80°F (18-27°C)',
    humidity: '50-60%',
    careInstructions: [
      'Water by misting leaves and watering soil if potted',
      'Provide bright, filtered light',
      'Maintain moderate humidity',
      'Remove spent flowers to encourage new growth',
      'Can be grown mounted or in well-draining bark mix'
    ],
    commonProblems: [
      'Brown leaf tips: Low humidity or water quality issues',
      'Fading flower spike: Natural after blooming period',
      'Overwatering: Can cause root rot if planted in soil',
      'Insufficient blooming: Needs bright light and maturity'
    ]
  },
  {
    name: 'Potbelly Air Plant',
    botanicalName: 'Tillandsia bulbosa',
    otherNames: ['Bulbous Air Plant'],
    image: PLANT_IMAGES_BASE_URL + '/Potbelly%20Air%20Plant.jpg',
    wateringFrequency: 'Weekly',
    suggestedWateringDays: 7,
    lightRequirement: 'Bright Indirect Light',
    careLevel: 'Medium' as const,
    category: 'Air Plants',
    description: 'A unique air plant with a bulbous base and twisted, tentacle-like leaves. Creates an interesting sculptural element in displays.',
    toxicity: 'Non-toxic to pets',
    temperature: '65-80°F (18-27°C)',
    humidity: '50-60%',
    careInstructions: [
      'Soak weekly for 20-30 minutes',
      'Ensure base dries completely to prevent rot',
      'Provide bright, indirect light',
      'Good air circulation is essential',
      'Mist lightly between soakings if very dry'
    ],
    commonProblems: [
      'Base rot: Usually from water trapped in bulbous section',
      'Curling leaves: Natural characteristic, not a problem',
      'Slow growth: Normal for this species',
      'Brown tips: Usually low humidity or over-fertilizing'
    ]
  }
];
