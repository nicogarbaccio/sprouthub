import { Plant } from './types';
import { PLANT_IMAGES_BASE_URL } from '@/constants/supabase';

// Lightweight plant dataset for homepage - popular plants with correct images.
// otherNames mirror the canonical values in src/data/plants/* so the homepage cards render the
// "aka:" line identically to the full Plant Catalog (no empty gap when signed out).
export const homepagePlants: Plant[] = [
 {
 name: 'Snake Plant',
 botanicalName: 'Sansevieria trifasciata',
 otherNames: ['Mother-in-Law\'s Tongue', 'Viper\'s Bowstring Hemp', 'Saint George\'s Sword', 'Sansevieria'],
 image: PLANT_IMAGES_BASE_URL + '/Snake%20Plant.jpg',
 wateringFrequency: 'Monthly',
 suggestedWateringDays: 30,
 lightRequirement: 'Low Light',
 careLevel: 'Easy' as const,
 category: 'Succulents'
 },
 {
 name: 'Pothos',
 botanicalName: 'Epipremnum aureum',
 otherNames: ['Devil\'s Ivy', 'Golden Pothos', 'Hunter\'s Robe', 'Money Plant'],
 image: PLANT_IMAGES_BASE_URL + '/Pothos.png',
 wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Medium Light',
 careLevel: 'Easy' as const,
 category: 'Hanging & Trailing Plants'
 },
 {
 name: 'Peace Lily',
 botanicalName: 'Spathiphyllum wallisii',
 otherNames: ['Spath', 'White Sails', 'Mauna Loa'],
 image: PLANT_IMAGES_BASE_URL + '/Peace%20Lily.jpg',
 wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Low to Medium Light',
 careLevel: 'Easy' as const,
 category: 'Flowering Plants'
 },
 {
 name: 'Rubber Plant',
 botanicalName: 'Ficus elastica',
 otherNames: ['Rubber Fig', 'Rubber Tree', 'India Rubber Plant'],
 image: PLANT_IMAGES_BASE_URL + '/Rubber%20Plant.jpg',
 wateringFrequency: 'Bi-weekly',
 suggestedWateringDays: 14,
 lightRequirement: 'Bright Indirect Light',
 careLevel: 'Medium' as const,
 category: 'Trees & Large Plants'
 },
 {
 name: 'Spider Plant',
 botanicalName: 'Chlorophytum comosum',
 otherNames: ['Airplane Plant', 'Ribbon Plant', 'Spider Ivy', 'St. Bernard\'s Lily'],
 image: PLANT_IMAGES_BASE_URL + '/Spider%20Plant.jpg',
 wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Bright Indirect Light',
 careLevel: 'Easy' as const,
 category: 'Hanging & Trailing Plants'
 },
 {
 name: 'ZZ Plant',
 botanicalName: 'Zamioculcas zamiifolia',
 otherNames: ['Zanzibar Gem', 'Zuzu Plant', 'Eternity Plant'],
 image: PLANT_IMAGES_BASE_URL + '/ZZ%20Plant.png',
 wateringFrequency: 'Monthly',
 suggestedWateringDays: 30,
 lightRequirement: 'Low to Medium Light',
 careLevel: 'Easy' as const,
 category: 'Low Maintenance'
 },
 {
 name: 'Monstera Deliciosa',
 botanicalName: 'Monstera deliciosa',
 otherNames: ['Swiss Cheese Plant', 'Split-Leaf Philodendron', 'Fruit Salad Plant', 'Ceriman'],
 image: PLANT_IMAGES_BASE_URL + '/Monstera%20Deliciosa.png',
 wateringFrequency: 'Bi-weekly',
 suggestedWateringDays: 14,
 lightRequirement: 'Bright Indirect Light',
 careLevel: 'Medium' as const,
 category: 'Tropical Plants'
 },
 {
 name: 'Fiddle Leaf Fig',
 botanicalName: 'Ficus lyrata',
 otherNames: ['Banjo Fig', 'Lyre Leaf Fig'],
 image: PLANT_IMAGES_BASE_URL + '/Fiddle%20Leaf%20Fig.jpg',
 wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Bright Indirect Light',
 careLevel: 'Hard' as const,
 category: 'Trees & Large Plants'
 },
 {
 name: 'Aloe Vera',
 botanicalName: 'Aloe barbadensis',
 otherNames: ['True Aloe', 'Medicinal Aloe', 'Burn Plant', 'First Aid Plant'],
 image: PLANT_IMAGES_BASE_URL + '/Aloe%20Vera.jpg',
 wateringFrequency: 'Bi-weekly',
 suggestedWateringDays: 14,
 lightRequirement: 'Bright Direct Light',
 careLevel: 'Easy' as const,
 category: 'Succulents'
 },
 {
 name: 'Jade Plant',
 botanicalName: 'Crassula ovata',
 otherNames: ['Lucky Plant', 'Money Plant', 'Money Tree', 'Friendship Tree'],
 image: PLANT_IMAGES_BASE_URL + '/Jade%20Plant.jpg',
 wateringFrequency: 'Bi-weekly',
 suggestedWateringDays: 14,
 lightRequirement: 'Bright Direct Light',
 careLevel: 'Easy' as const,
 category: 'Succulents'
 },
 {
 name: 'Boston Fern',
 botanicalName: 'Nephrolepis exaltata',
 otherNames: ['Sword Fern', 'Boston Sword Fern'],
 image: PLANT_IMAGES_BASE_URL + '/Boston%20Fern.jpg',
 wateringFrequency: 'Twice weekly',
 suggestedWateringDays: 3,
 lightRequirement: 'Bright Indirect Light',
 careLevel: 'Medium' as const,
 category: 'Ferns'
 },
 {
 name: 'Heartleaf Philodendron',
 botanicalName: 'Philodendron hederaceum',
 otherNames: ['Sweetheart Plant', 'Philodendron Scandens', 'Heart-Leaf Philodendron'],
 image: PLANT_IMAGES_BASE_URL + '/Heartleaf%20Philodendron.jpg',
 wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Medium Light',
 careLevel: 'Easy' as const,
 category: 'Hanging & Trailing Plants'
 },
 {
 name: 'English Ivy',
 botanicalName: 'Hedera helix',
 otherNames: ['Common Ivy', 'European Ivy', 'Sweetheart Ivy'],
 image: PLANT_IMAGES_BASE_URL + '/English%20Ivy.jpg',
 wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Bright Indirect Light',
 careLevel: 'Easy' as const,
 category: 'Hanging & Trailing Plants'
 },
 {
 name: 'Parlor Palm',
 botanicalName: 'Chamaedorea elegans',
 otherNames: ['Neanthe Bella Palm', 'Good Luck Palm', 'Dwarf Mountain Palm'],
 image: PLANT_IMAGES_BASE_URL + '/Parlor%20Palm.jpg',
 wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Low to Medium Light',
 careLevel: 'Easy' as const,
 category: 'Palms'
 },
 {
 name: 'Dracaena',
 botanicalName: 'Dracaena marginata',
 otherNames: ['Dragon Tree', 'Madagascar Dragon Tree', 'Red-Edge Dracaena'],
 image: PLANT_IMAGES_BASE_URL + '/Dracaena.jpg',
 wateringFrequency: 'Weekly',
 suggestedWateringDays: 10,
 lightRequirement: 'Medium Light',
 careLevel: 'Easy' as const,
 category: 'Trees & Large Plants'
 },
 {
 name: 'Kentia Palm',
 botanicalName: 'Howea forsteriana',
 otherNames: ['Thatch Palm', 'Paradise Palm', 'Sentry Palm'],
 image: PLANT_IMAGES_BASE_URL + '/Kentia%20Palm.jpg',
 wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Low to Medium Light',
 careLevel: 'Easy' as const,
 category: 'Tropical Plants'
 }
];
