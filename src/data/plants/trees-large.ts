import { Plant } from '../types';
import { PLANT_IMAGES_BASE_URL } from '@/constants/supabase';

export const treesLargePlants: Plant[] = [
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
 name: 'Schefflera',
    botanicalName: 'Schefflera actinophylla',
    image: PLANT_IMAGES_BASE_URL + '/Schefflera.jpg',
    wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Bright Indirect Light',
 careLevel: 'Easy' as const,
 category: 'Trees & Large Plants'
 },
 {
 name: 'Yucca',
    botanicalName: 'Yucca elephantipes',
    image: PLANT_IMAGES_BASE_URL + '/Yucca.jpg',
    wateringFrequency: 'Bi-weekly',
 suggestedWateringDays: 14,
 lightRequirement: 'Bright Direct Light',
 careLevel: 'Easy' as const,
 category: 'Trees & Large Plants'
 },
 {
 name: 'Norfolk Pine',
    botanicalName: 'Araucaria heterophylla',
    image: PLANT_IMAGES_BASE_URL + '/Norfolk%20Pine.jpg',
    wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Bright Indirect Light',
 careLevel: 'Medium' as const,
 category: 'Trees & Large Plants'
 }
];
