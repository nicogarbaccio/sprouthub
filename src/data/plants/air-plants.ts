import { Plant } from '../types';
import { PLANT_IMAGES_BASE_URL } from '@/constants/supabase';

export const airPlants: Plant[] = [
  {
    name: 'Blushing Bride',
    botanicalName: 'Tillandsia ionantha',
    otherNames: ['Sky Plant', 'Air Plant'],
    image: PLANT_IMAGES_BASE_URL + '/Blushing%20Bride.jpg',
    wateringFrequency: 'Weekly soak or 2-3x weekly misting',
    suggestedWateringDays: 7,
    lightRequirement: 'Bright Indirect Light',
    careLevel: 'Easy' as const,
    category: 'Air Plants',
    description: 'One of the most popular and beginner-friendly air plants, this compact beauty features silvery-green spiky leaves that dramatically transform to vibrant pink or red when blooming. The stunning color change occurs as the plant prepares to flower, creating a "blushing" effect that lasts for weeks. Native to Mexico and Central America, it grows 2-3 inches tall and thrives in various display methods including terrariums, hanging arrangements, driftwood mounts, or decorative holders. Its small size and forgiving nature make it perfect for first-time air plant enthusiasts.',
    toxicity: 'Non-toxic to pets and humans',
    temperature: '60-80°F (15-27°C)',
    humidity: '50-60%',
    careInstructions: [
      'Soak in room temperature water for 20-30 minutes weekly, OR mist thoroughly 2-3 times per week',
      'After soaking, gently shake off excess water and place upside down to drain',
      'Allow to dry completely within 4 hours in a well-ventilated area',
      'Provide bright, indirect light - near an east or west-facing window is ideal',
      'Use filtered, distilled, or rainwater when possible (tap water minerals can cause brown tips)',
      'Fertilize monthly during growing season with diluted bromeliad or air plant fertilizer (¼ strength)',
      'Ensure good air circulation - avoid enclosed containers without airflow'
    ],
    commonProblems: [
      'Rotting: Usually from not drying completely after watering or poor air circulation',
      'Shriveling or curling leaves: Needs more frequent watering or higher humidity',
      'Brown or black tips: Low humidity, over-fertilizing, or poor water quality',
      'Not blooming: Needs more bright light or plant may be too young (takes 2-3 years to mature)',
      'Leaves falling off: Severe dehydration or natural offsets (pups) forming'
    ]
  },
  {
    name: 'Spanish Moss',
    botanicalName: 'Tillandsia usneoides',
    otherNames: ['Old Man\'s Beard', 'Grandpa\'s Beard'],
    image: PLANT_IMAGES_BASE_URL + '/Spanish%20Moss.jpg',
    wateringFrequency: '2-3 times per week',
    suggestedWateringDays: 3,
    lightRequirement: 'Bright Indirect Light',
    careLevel: 'Medium' as const,
    category: 'Air Plants',
    description: 'The iconic symbol of the American South, Spanish Moss creates stunning cascading displays with its silvery-gray, thread-like stems that can grow several feet long. Despite its name, it\'s not actually a moss but an epiphytic air plant that naturally drapes from tree branches in humid climates. Unlike other Tillandsia species, Spanish Moss has no roots and absorbs all water and nutrients through specialized scales on its stems. It\'s perfect for creating dramatic hanging installations, adding texture to terrariums, or crafting natural decorative accents. Native to the southeastern United States through South America, it brings an ethereal, bohemian aesthetic to any space.',
    toxicity: 'Non-toxic to pets and humans',
    temperature: '60-80°F (15-27°C)',
    humidity: '60-70%',
    careInstructions: [
      'Mist thoroughly 2-3 times per week until water runs through the strands',
      'Misting is preferred over soaking as it absorbs water through its surface scales',
      'Occasionally soak in water for 10-15 minutes if very dry, then drain well',
      'Gently shake or squeeze to remove excess water after misting or soaking',
      'Ensure excellent air circulation - this is critical to prevent rot',
      'Provide bright, filtered light but avoid direct sun which can scorch',
      'Use soft water (rainwater, distilled, or filtered) to prevent mineral buildup',
      'Fertilize every 2-3 weeks with very diluted bromeliad fertilizer during growing season'
    ],
    commonProblems: [
      'Rotting sections (turning black or slimy): Poor air circulation or staying wet too long',
      'Drying out (becoming brittle and brown): Needs more frequent misting or higher humidity',
      'Pests: Check for spider mites, especially in dry indoor conditions',
      'Breaking apart: This is natural growth and propagation, not a problem',
      'Yellowing: Too much direct sun or water quality issues'
    ]
  },
  {
    name: 'Queen of Air Plants',
    botanicalName: 'Tillandsia xerographica',
    otherNames: ['Xeros'],
    image: PLANT_IMAGES_BASE_URL + '/Queen%20of%20Air%20Plants.jpg',
    wateringFrequency: 'Every 10-14 days',
    suggestedWateringDays: 10,
    lightRequirement: 'Bright Indirect Light',
    careLevel: 'Easy' as const,
    category: 'Air Plants',
    description: 'Aptly named the "Queen of Air Plants," Tillandsia xerographica is one of the most striking and sought-after air plant species available. This dramatic specimen forms a large, silvery-white rosette of thick, curling leaves that can grow 10-12 inches wide (or larger with age). Native to the dry forests of Mexico, Guatemala, and El Salvador, it has evolved to be extremely drought-tolerant, making it one of the easiest air plants to care for. Its sculptural form makes it a stunning standalone centerpiece, perfect for coffee tables, shelves, or mounted displays. The silvery trichomes covering its leaves give it a frosted appearance that catches light beautifully.',
    toxicity: 'Non-toxic to pets and humans',
    temperature: '50-90°F (10-32°C) - very temperature tolerant',
    humidity: '40-60%',
    careInstructions: [
      'Soak in room temperature water for 1-2 hours every 10-14 days',
      'After soaking, turn completely upside down and gently shake to remove water',
      'Allow to dry thoroughly in a well-ventilated area - this may take 3-4 hours',
      'Never let water pool in the center rosette as this causes rot',
      'Provide bright, indirect light - can tolerate more light than most air plants',
      'Very drought tolerant once established; better to underwater than overwater',
      'Use filtered, rainwater, or distilled water to prevent mineral spots on leaves',
      'Fertilize sparingly (every 2-3 months) with diluted air plant fertilizer'
    ],
    commonProblems: [
      'Center rot (black, mushy core): Water trapped in the rosette - always dry upside down',
      'Dry, brittle leaves: Needs more humidity, longer soaking, or more frequent watering',
      'Slow growth: This is normal - xerographica is a slow-growing species',
      'Brown tips: Usually from low humidity or tap water minerals',
      'Lower leaves dying: Natural as plant matures and grows new leaves from center'
    ]
  },
  {
    name: 'Pink Quill',
    botanicalName: 'Tillandsia cyanea',
    otherNames: ['Blue-flowered Torch', 'Fan Flower'],
    image: PLANT_IMAGES_BASE_URL + '/Pink%20Quill.jpg',
    wateringFrequency: 'Twice weekly',
    suggestedWateringDays: 3,
    lightRequirement: 'Bright Indirect Light',
    careLevel: 'Medium' as const,
    category: 'Air Plants',
    description: 'A unique member of the Tillandsia family, Pink Quill is actually a terrestrial bromeliad that prefers to grow potted rather than mounted like typical air plants. Native to Ecuador, it produces one of the most spectacular flowering displays in the bromeliad world: a large, flattened pink paddle-shaped bract that can last for months, with vibrant purple-blue flowers emerging sequentially along its edges. The plant forms an attractive rosette of narrow, arching green leaves that can reach 10-12 inches tall. Unlike true epiphytic air plants, Pink Quill thrives best when planted in a well-draining orchid or bark mix, making it an excellent choice for those who prefer traditional potted plants with extraordinary blooms.',
    toxicity: 'Non-toxic to pets and humans',
    temperature: '60-80°F (15-27°C)',
    humidity: '50-70%',
    careInstructions: [
      'Water potting mix thoroughly when top inch feels dry (usually twice weekly)',
      'Mist leaves 2-3 times per week to maintain humidity',
      'Plant in well-draining orchid bark mix or specialized bromeliad soil',
      'Provide bright, filtered light - avoid direct sun which can scorch leaves',
      'Maintain moderate to high humidity for best flowering',
      'Remove spent flowers as they fade to encourage continued blooming',
      'After main bloom spike fades, plant will produce offsets (pups) before dying',
      'Fertilize monthly during growing season with diluted balanced fertilizer'
    ],
    commonProblems: [
      'Brown leaf tips: Low humidity, water quality issues, or fluoride sensitivity',
      'Fading flower spike: Natural after several months of blooming',
      'Root rot: Overwatering or poorly draining potting mix',
      'No blooming: Insufficient bright light, plant too young, or needs maturity (2-3 years)',
      'Yellowing leaves: Overwatering or natural die-back after flowering cycle completes'
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
    description: 'One of the most distinctive and sculptural air plants available, Potbelly Air Plant features a bulbous, hollow base with wild, twisted tentacle-like leaves that curl and spiral in fascinating patterns. Native to the humid forests of Central and South America, from Mexico to Colombia, this species has evolved a unique bulbous structure that houses beneficial insects in nature, creating a symbiotic relationship. The twisted, ribbon-like leaves can be green to reddish-purple depending on light exposure. Growing 4-7 inches tall, it creates an alien-like, artistic presence that\'s perfect for mounted displays, hanging arrangements, or as a conversation-starting centerpiece. When happy, it produces tubular purple and red flowers.',
    toxicity: 'Non-toxic to pets and humans',
    temperature: '60-85°F (15-29°C)',
    humidity: '50-70%',
    careInstructions: [
      'Soak in room temperature water for 20-30 minutes weekly',
      'After soaking, turn completely upside down to drain - this is critical for this species',
      'Ensure the bulbous base dries completely within 4 hours to prevent rot',
      'Provide bright, indirect light with good air circulation',
      'Can tolerate slightly more humidity than other Tillandsia species',
      'Mist lightly 1-2 times between soakings if air is very dry',
      'Use filtered, distilled, or rainwater to avoid mineral buildup',
      'Fertilize monthly during growing season with diluted bromeliad fertilizer (¼ strength)'
    ],
    commonProblems: [
      'Base rot (soft, black bulb): Water trapped inside bulbous section - always dry upside down',
      'Excessively curling leaves: This is a natural characteristic, not a problem',
      'Slow growth: Normal for this species - it\'s a patient grower',
      'Brown tips: Low humidity, over-fertilizing, or poor water quality',
      'Leaves turning brown at base: May indicate rot starting - improve air circulation and drying'
    ]
  }
];