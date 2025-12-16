import { Plant } from '../types';
import { PLANT_IMAGES_BASE_URL } from '@/constants/supabase';

export const treesLargePlants: Plant[] = [
 {
  name: 'Fiddle Leaf Fig',
  botanicalName: 'Ficus lyrata',
  otherNames: ['Banjo Fig'],
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
  otherNames: ['Rubber Fig', 'Rubber Tree'],
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
  otherNames: ['Dragon Tree', 'Madagascar Dragon Tree'],
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
  otherNames: ['Umbrella Tree', 'Octopus Tree'],
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
  otherNames: ['Spineless Yucca', 'Stick Yucca'],
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
  otherNames: ['Norfolk Island Pine', 'Star Pine'],
  image: PLANT_IMAGES_BASE_URL + '/Norfolk%20Pine.jpg',
    wateringFrequency: 'Weekly',
 suggestedWateringDays: 7,
 lightRequirement: 'Bright Indirect Light',
 careLevel: 'Medium' as const,
 category: 'Trees & Large Plants'
 }
];
