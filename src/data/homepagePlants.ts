import { Plant } from './types';
import { PLANT_IMAGES_BASE_URL } from '@/constants/supabase';

// Lightweight plant dataset for homepage - popular plants with correct images
export const homepagePlants: Plant[] = [
 {
 name: 'Snake Plant',
 botanicalName: 'Sansevieria trifasciata',
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
 image: PLANT_IMAGES_BASE_URL + '/Kentia%20Palm.jpg',
 wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Low to Medium Light',
 careLevel: 'Easy' as const,
 category: 'Tropical Plants'
 }
]; 