
import { Plant } from '../types';

export const tropicalPlants: Plant[] = [
 {
 name: 'Monstera Deliciosa',
 botanicalName: 'Monstera deliciosa',
 image: 'https://res.cloudinary.com/dojdglovh/image/upload/v1748540196/united-nursery-monstera-plants-21887-64_600_qccheq.jpg',
 wateringFrequency: 'Bi-weekly',
 suggestedWateringDays: 14,
 lightRequirement: 'Bright Indirect Light',
 careLevel: 'Medium' as const,
 category: 'Tropical Plants'
 },
 {
 name: 'Bird of Paradise',
 botanicalName: 'Strelitzia nicolai',
 image: 'https://res.cloudinary.com/dojdglovh/image/upload/v1748540227/multi-planted-bird-of-paradise-strelitzia-nicolai-25cm-pot-my-jungle-home-142052_tycvp3.jpg',
 wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Bright Indirect Light',
 careLevel: 'Hard' as const,
 category: 'Tropical Plants'
 },
 {
 name: 'Alocasia',
 botanicalName: 'Alocasia amazonica',
 image: 'https://res.cloudinary.com/dojdglovh/image/upload/v1748540250/alocasia-amazonica-potted-plant-elephant-ear__0653981_pe708210_s5_n3zpxt.jpg',
 wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Bright Indirect Light',
 careLevel: 'Hard' as const,
 category: 'Tropical Plants'
 },
 {
 name: 'Monstera Adansonii',
 botanicalName: 'Monstera adansonii',
 image: 'https://res.cloudinary.com/dojdglovh/image/upload/v1748540275/Monstera_Adansonii_Swiss_Cheese_Plant_btuaki.jpg',
 wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Bright Indirect Light',
 careLevel: 'Medium' as const,
 category: 'Tropical Plants'
 },
 {
 name: 'Dieffenbachia',
 botanicalName: 'Dieffenbachia seguine',
 image: 'https://res.cloudinary.com/dojdglovh/image/upload/v1748540302/DG5_1024px_anuzkc.jpg',
 wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Medium Light',
 careLevel: 'Easy' as const,
 category: 'Tropical Plants'
 },
 {
 name: 'Philodendron Brasil',
 botanicalName: 'Philodendron hederaceum',
 image: 'https://res.cloudinary.com/dojdglovh/image/upload/v1750805312/1713224407501_s5dqa4.jpg',
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
 image: 'https://res.cloudinary.com/dojdglovh/image/upload/v1750805262/07_PALM_KENTIA_6-7FT_01_fdrgw2.jpg',
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
 image: 'https://res.cloudinary.com/dojdglovh/image/upload/v1750804910/banana-musa-plant-in-pot-royalty-free-image-1699118571.jpg_ozao1i.jpg',
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
 name: 'Fiddle Leaf Fig',
 botanicalName: 'Ficus lyrata',
 image: 'https://res.cloudinary.com/dojdglovh/image/upload/v1750805185/bloomscape_fiddle-leaf-fig_charcoal-e1652800894846_vlfmkt.jpg',
 wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Bright Indirect Light',
 careLevel: 'Hard' as const,
 category: 'Tropical Plants',
 description: 'A trendy houseplant with large, violin-shaped leaves. Known for being finicky but creates a dramatic statement in any room.',
 toxicity: 'Toxic to pets if ingested',
 temperature: '65-75°F (18-24°C)',
 humidity: '40-50%',
 careInstructions: [
  'Water when top inch of soil is dry',
  'Provide consistent bright, indirect light',
  'Avoid moving or rotating frequently',
  'Clean leaves weekly with damp cloth',
  'Fertilize monthly during growing season'
 ],
 commonProblems: [
  'Brown spots: Usually from overwatering or inconsistent watering',
  'Leaf drop: Stress from changes in light, water, or location',
  'Brown edges: Low humidity or root problems',
  'Slow growth: Normal, be patient with this plant'
 ]
 },
 {
 name: 'Croton',
 botanicalName: 'Codiaeum variegatum',
 image: 'https://res.cloudinary.com/dojdglovh/image/upload/v1750805039/large-croton-house-plant-PL112322.425_zamfnl.jpg',
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
 name: 'Calathea Orbifolia',
 botanicalName: 'Calathea Orbifolia',
 image: 'https://res.cloudinary.com/dojdglovh/image/upload/v1750804970/lighter_r1ycrj.jpg',
 wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Medium Light',
 careLevel: 'Hard' as const,
 category: 'Tropical Plants',
 description: 'A prayer plant with large, round leaves featuring distinctive silver and green stripes. Leaves fold up at night like hands in prayer.',
 toxicity: 'Non-toxic to pets',
 temperature: '65-75°F (18-24°C)',
 humidity: '60-70%',
 careInstructions: [
  'Keep soil consistently moist but not soggy',
  'Use distilled or filtered water',
  'Provide bright, indirect light',
  'Maintain high humidity with humidifier',
  'Avoid cold drafts and temperature fluctuations'
 ],
 commonProblems: [
  'Brown leaf edges: Low humidity or fluoride in water',
  'Curling leaves: Low humidity or underwatering',
  'Fading patterns: Needs more filtered light',
  'Spider mites: Common in low humidity'
 ]
 },
 {
 name: 'Philodendron Pink Princess',
 botanicalName: 'Philodendron erubescens',
 image: 'https://res.cloudinary.com/dojdglovh/image/upload/v1750805349/20250120211054_file_678ebbdea2df9_x3scee.jpg',
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
 image: 'https://res.cloudinary.com/dojdglovh/image/upload/v1750805164/DETA-1855_jqndwt.jpg',
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
