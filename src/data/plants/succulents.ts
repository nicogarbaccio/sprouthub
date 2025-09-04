
import { Plant } from '../types';

export const succulents: Plant[] = [
 {
  name: 'Snake Plant',
  botanicalName: 'Sansevieria trifasciata',
  image: 'https://res.cloudinary.com/dojdglovh/image/upload/v1748539871/sansevieria-laurentii-snake-plant-25cm-pot-my-jungle-home-160415_lxt6q5.jpg',
  wateringFrequency: 'Monthly',
  suggestedWateringDays: 30,
  lightRequirement: 'Low Light',
  careLevel: 'Easy' as const,
  category: 'Succulents'
 },
 {
  name: 'Aloe Vera',
  botanicalName: 'Aloe barbadensis',
  image: 'https://res.cloudinary.com/dojdglovh/image/upload/v1748539884/aloe-vera-potted-plant-aloe__1368841_pe957973_s5_hpimjy.jpg',
  wateringFrequency: 'Bi-weekly',
  suggestedWateringDays: 14,
  lightRequirement: 'Bright Direct Light',
  careLevel: 'Easy' as const,
  category: 'Succulents'
 },
 {
  name: 'Jade Plant',
  botanicalName: 'Crassula ovata',
  image: 'https://res.cloudinary.com/dojdglovh/image/upload/v1748539908/beautiful-crassula-ovata-jade-plant-money-plant-royalty-free-image-1722349156.jpg_qlw1gn.jpg',
  wateringFrequency: 'Bi-weekly',
  suggestedWateringDays: 14,
  lightRequirement: 'Bright Direct Light',
  careLevel: 'Easy' as const,
  category: 'Succulents'
 },
 {
  name: 'Echeveria',
  botanicalName: 'Echeveria elegans',
  image: 'https://res.cloudinary.com/dojdglovh/image/upload/v1748539932/20220816_184151_2048x_lqg2sj.jpg',
  wateringFrequency: 'Bi-weekly',
  suggestedWateringDays: 14,
  lightRequirement: 'Bright Direct Light',
  careLevel: 'Easy' as const,
  category: 'Succulents'
 },
 {
  name: 'String of Pearls',
  botanicalName: 'Senecio rowleyanus',
  image: 'https://res.cloudinary.com/dojdglovh/image/upload/v1748539957/string-of-pearls-plant-30347238998058_grande_sq0txv.jpg',
  wateringFrequency: 'Bi-weekly',
  suggestedWateringDays: 14,
  lightRequirement: 'Bright Indirect Light',
  careLevel: 'Medium' as const,
  category: 'Succulents'
 },
 {
  name: 'Haworthia',
  botanicalName: 'Haworthia cooperi',
  image: 'https://res.cloudinary.com/dojdglovh/image/upload/v1748539986/Haworthiacooperi_9_qoahjo.jpg',
  wateringFrequency: 'Bi-weekly',
  suggestedWateringDays: 14,
  lightRequirement: 'Bright Indirect Light',
  careLevel: 'Easy' as const,
  category: 'Succulents'
 },
 {
  name: 'Barrel Cactus',
  botanicalName: 'Ferocactus wislizeni',
  image: 'https://res.cloudinary.com/dojdglovh/image/upload/v1750943758/fer_wislezi2__09693.1698858264_zuvfer.jpg',
  wateringFrequency: 'Monthly',
  suggestedWateringDays: 30,
  lightRequirement: 'Bright Direct Light',
  careLevel: 'Easy' as const,
  category: 'Succulents',
  description: 'A classic desert cactus with a distinctive barrel shape and prominent spines. Very drought tolerant and perfect for sunny windowsills.',
  toxicity: 'Non-toxic but has sharp spines',
  temperature: '70-80°F (21-27°C)',
  humidity: '10-30%',
  careInstructions: [
   'Water deeply but infrequently',
   'Ensure excellent drainage',
   'Provide maximum sunlight',
   'Avoid watering in winter',
   'Use cactus-specific potting mix'
  ],
  commonProblems: [
   'Root rot: Usually from overwatering',
   'Soft/mushy sections: Sign of rot, needs immediate attention',
   'Lack of growth: May need more light or nutrients',
   'Pests: Watch for mealybugs and scale'
  ]
 },
 {
  name: 'Lithops',
  botanicalName: 'Lithops species',
  image: 'https://res.cloudinary.com/dojdglovh/image/upload/v1750943852/LivingStoneLithops2.5l_k7z8ou.jpg',
  wateringFrequency: 'Monthly',
  suggestedWateringDays: 45,
  lightRequirement: 'Bright Direct Light',
  careLevel: 'Hard' as const,
  category: 'Succulents',
  description: 'Known as Living Stones, these fascinating succulents mimic rocks in their natural habitat. They require very specific care and watering schedules.',
  toxicity: 'Non-toxic to pets',
  temperature: '65-80°F (18-27°C)',
  humidity: '10-30%',
  careInstructions: [
   'Water only during active growing season',
   'Stop watering when splitting begins',
   'Provide maximum direct sunlight',
   'Use very well-draining mineral soil',
   'Never water during dormancy'
  ],
  commonProblems: [
   'Overwatering: Most common cause of death',
   'Stretching: Insufficient light',
   'Not splitting: Natural cycle, be patient',
   'Soft plants: Usually from too much water'
  ]
 },
 {
  name: 'Prickly Pear Cactus',
  botanicalName: 'Opuntia microdasys',
  image: 'https://res.cloudinary.com/dojdglovh/image/upload/v1750943948/bloomscape_prickly-pear-cactus_charcoal-e1625250902451_mhgfkt.jpg',
  wateringFrequency: 'Monthly',
  suggestedWateringDays: 30,
  lightRequirement: 'Bright Direct Light',
  careLevel: 'Easy' as const,
  category: 'Succulents',
  description: 'A charming paddle-shaped cactus with fuzzy spines. Easy to care for and produces beautiful yellow flowers when mature.',
  toxicity: 'Non-toxic but has irritating glochids (tiny spines)',
  temperature: '70-80°F (21-27°C)',
  humidity: '10-30%',
  careInstructions: [
   'Water sparingly, especially in winter',
   'Provide maximum direct sunlight',
   'Use cactus potting mix with excellent drainage',
   'Handle with thick gloves to avoid glochids',
   'Allow soil to dry completely between waterings'
  ],
  commonProblems: [
   'Overwatering: Can cause root rot quickly',
   'Soft pads: Usually sign of overwatering',
   'Glochid irritation: Use tweezers to remove spines from skin',
   'Slow growth: Normal for cacti, be patient'
  ]
 },
 {
  name: 'Zebra Plant',
  botanicalName: 'Haworthia fasciata',
  image: 'https://res.cloudinary.com/dojdglovh/image/upload/v1750944008/shutterstock_2348932457_om9nu1.jpg',
  wateringFrequency: 'Bi-weekly',
  suggestedWateringDays: 14,
  lightRequirement: 'Bright Indirect Light',
  careLevel: 'Easy' as const,
  category: 'Succulents',
  description: 'A small succulent with distinctive white stripes on dark green leaves. Perfect for beginners and produces small white flowers.',
  toxicity: 'Non-toxic to pets',
  temperature: '65-80°F (18-27°C)',
  humidity: '30-40%',
  careInstructions: [
   'Water when soil is dry to touch',
   'Provide bright, indirect light',
   'Use well-draining succulent soil',
   'Remove flower stalks after blooming',
   'Propagate from offsets'
  ],
  commonProblems: [
   'Root rot: From overwatering',
   'Stretching: Needs more light',
   'Brown tips: Usually low humidity or poor water quality',
   'Slow growth: Normal for small succulents'
  ]
 },
 {
  name: 'Paddle Plant',
  botanicalName: 'Kalanchoe thyrsiflora',
  image: 'https://res.cloudinary.com/dojdglovh/image/upload/v1750943894/bhg-succulant-kalanchoe-thyrsiflora-CEISxlHCqL-AlzmBsFyz-L-4f3ed69d03b847888f5013f7a4cbe904_etwkdz.jpg',
  wateringFrequency: 'Bi-weekly',
  suggestedWateringDays: 14,
  lightRequirement: 'Bright Direct Light',
  careLevel: 'Easy' as const,
  category: 'Succulents',
  description: 'A striking succulent with large, flat, paddle-shaped leaves that develop red edges in bright light. Also called Flapjack Plant.',
  toxicity: 'Toxic to pets if ingested',
  temperature: '65-75°F (18-24°C)',
  humidity: '30-40%',
  careInstructions: [
   'Water when soil is completely dry',
   'Provide bright, direct sunlight for red coloring',
   'Use well-draining succulent mix',
   'Remove flower stalk to preserve plant energy',
   'Propagate from leaf cuttings'
  ],
  commonProblems: [
   'Green color (no red): Needs more direct sunlight',
   'Overwatering: Can cause root rot',
   'Stretching: Insufficient light',
   'Dying after flowering: Natural lifecycle, propagate before'
  ]
 },
 {
  name: 'String of Buttons',
  botanicalName: 'Crassula perforata',
  image: 'https://res.cloudinary.com/dojdglovh/image/upload/v1750943977/shutterstock_315824633Optimized-591x533_efjg35.webp',
  wateringFrequency: 'Bi-weekly',
  suggestedWateringDays: 14,
  lightRequirement: 'Bright Direct Light',
  careLevel: 'Easy' as const,
  category: 'Succulents',
  description: 'An unusual succulent where triangular leaves appear to be threaded on the stem like buttons. Forms interesting geometric patterns.',
  toxicity: 'Non-toxic to pets',
  temperature: '65-75°F (18-24°C)',
  humidity: '30-40%',
  careInstructions: [
   'Water thoroughly when soil is dry',
   'Provide bright, direct light',
   'Use well-draining succulent soil',
   'Pinch growing tips to encourage branching',
   'Easy to propagate from stem cuttings'
  ],
  commonProblems: [
   'Stretching: Needs more bright light',
   'Overwatering: Watch for soft, mushy stems',
   'Leggy growth: Pinch tips regularly',
   'Slow growth: Normal for this species'
  ]
 },
 {
  name: 'Ghost Plant',
  botanicalName: 'Graptopetalum paraguayense',
  image: 'https://res.cloudinary.com/dojdglovh/image/upload/v1750943810/Variegated-Ghost-Plant-Graptopetalum-Paraguayense-6-inch_5_1800x1800_exxl79.jpg',
  wateringFrequency: 'Bi-weekly',
  suggestedWateringDays: 14,
  lightRequirement: 'Bright Direct Light',
  careLevel: 'Easy' as const,
  category: 'Succulents',
  description: 'A beautiful rosette succulent with silvery-blue leaves that take on pink hues in bright light. Very hardy and produces many offsets.',
  toxicity: 'Non-toxic to pets',
  temperature: '65-80°F (18-27°C)',
  humidity: '30-40%',
  careInstructions: [
   'Water when soil is completely dry',
   'Provide bright light for best coloration',
   'Use well-draining succulent mix',
   'Remove offsets to propagate',
   'Protect from extreme heat'
  ],
  commonProblems: [
   'Loss of color: Needs more bright light',
   'Overwatering: Can cause root rot',
   'Stretching: Insufficient light',
   'Pest issues: Watch for mealybugs'
  ]
 }
];
