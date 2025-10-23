/* eslint-disable react-hooks/rules-of-hooks */
import { test as base, expect } from '@playwright/test';
import { AuthPage } from '../page-objects/AuthPage';
import { SmartWateringPage } from '../page-objects/SmartWateringPage';
import { PlantCatalogPage } from '../page-objects/PlantCatalogPage';
import { PlantDetailsPage } from '../page-objects/PlantDetailsPage';
import { MyPlantsPage } from '../page-objects/MyPlantsPage';
import { AddPlantDialogPage } from '../page-objects/AddPlantDialogPage';
import { HouseholdPage } from '../page-objects/HouseholdPage';

// Extend basic test by providing page objects
export const test = base.extend<{
  authPage: AuthPage;
  smartWateringPage: SmartWateringPage;
  plantCatalogPage: PlantCatalogPage;
  plantDetailsPage: PlantDetailsPage;
  myPlantsPage: MyPlantsPage;
  addPlantDialogPage: AddPlantDialogPage;
  householdPage: HouseholdPage;
}>({
  authPage: async ({ page }, use) => {
    const authPage = new AuthPage(page);
    await use(authPage);
  },

  smartWateringPage: async ({ page }, use) => {
    const smartWateringPage = new SmartWateringPage(page);
    await use(smartWateringPage);
  },

  plantCatalogPage: async ({ page }, use) => {
    const plantCatalogPage = new PlantCatalogPage(page);
    await use(plantCatalogPage);
  },

  plantDetailsPage: async ({ page }, use) => {
    const plantDetailsPage = new PlantDetailsPage(page);
    await use(plantDetailsPage);
  },

  myPlantsPage: async ({ page }, use) => {
    const myPlantsPage = new MyPlantsPage(page);
    await use(myPlantsPage);
  },

  addPlantDialogPage: async ({ page }, use) => {
    const addPlantDialogPage = new AddPlantDialogPage(page);
    await use(addPlantDialogPage);
  },

  householdPage: async ({ page }, use) => {
    const householdPage = new HouseholdPage(page);
    await use(householdPage);
  },
});

export { expect } from '@playwright/test';

// Test data fixtures - using environment variables when available
export const testUsers = {
  validUser: {
    email: process.env.TEST_EMAIL || 'test@sprouthub.app',
    password: process.env.TEST_PASSWORD || 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
    username: 'testuser'
  },
  invalidUser: {
    email: 'invalid@sprouthub.dev',
    password: 'wrongpassword'
  }
};

export const testPlants = {
  smallPlant: {
    name: 'Test Small Plant',
    type: 'Succulent',
    size: 'small'
  },
  mediumPlant: {
    name: 'Test Medium Plant', 
    type: 'Monstera',
    size: 'medium'
  },
  largePlant: {
    name: 'Test Large Plant',
    type: 'Fiddle Leaf Fig',
    size: 'large'
  }
};

export const wateringFactors = {
  plantSizes: ['small', 'medium', 'large'],
  lightLevels: ['low', 'medium', 'high'],
  temperatures: ['cool', 'moderate', 'warm'],
  humidityLevels: ['low', 'medium', 'high'],
  careStyles: ['minimal', 'moderate', 'intensive'],
  soilTypes: ['well-draining', 'moisture-retaining', 'fast-draining']
};

export const testPlantData = {
  snakePlant: {
    name: 'Snake Plant',
    botanicalName: 'Sansevieria trifasciata',
    category: 'Succulents',
    careLevel: 'Easy',
    lightRequirement: 'Low Light',
    wateringFrequency: 'Monthly',
    suggestedWateringDays: 30
  },
  pothos: {
    name: 'Pothos',
    botanicalName: 'Epipremnum aureum',
    category: 'Hanging & Trailing Plants',
    careLevel: 'Easy',
    lightRequirement: 'Medium Light',
    wateringFrequency: 'Weekly',
    suggestedWateringDays: 7
  },
  peaceLily: {
    name: 'Peace Lily',
    botanicalName: 'Spathiphyllum wallisii',
    category: 'Flowering Plants',
    careLevel: 'Easy',
    lightRequirement: 'Low to Medium Light',
    wateringFrequency: 'Weekly',
    suggestedWateringDays: 7
  }
};

export const testRooms = [
  'Living Room',
  'Bedroom',
  'Kitchen',
  'Bathroom',
  'Office',
  'Balcony',
  'Garden'
];

export const testFormData = {
  validPlant: {
    nickname: 'My Snake Plant',
    plantType: 'Snake Plant',
    room: 'Living Room',
    isOutdoor: false
  },
  invalidPlant: {
    nickname: '', // Empty nickname
    plantType: '', // Empty plant type
    room: 'Living Room'
  },
  outdoorPlant: {
    nickname: 'Garden Pothos',
    plantType: 'Pothos',
    room: 'Garden',
    isOutdoor: true
  }
};

export const catalogTestData = {
  homepagePlantLimit: 16,
  catalogPlantLimit: 24,
  searchTerms: {
    valid: ['snake', 'pothos', 'lily'],
    invalid: ['nonexistentplant', 'xyz123'],
    botanical: ['sansevieria', 'epipremnum']
  },
  categories: ['Succulents', 'Hanging & Trailing Plants', 'Flowering Plants', 'Trees & Large Plants'],
  careLevels: ['Easy', 'Medium', 'Hard'],
  lightRequirements: ['Low Light', 'Medium Light', 'Bright Indirect Light', 'Low to Medium Light']
};

export const householdTestData = {
  household: {
    name: 'Test Household',
    description: 'A test household for E2E tests'
  },
  secondUser: {
    email: process.env.TEST_EMAIL_2 || 'test2@sprouthub.app',
    password: process.env.TEST_PASSWORD_2 || 'TestPassword123!',
  },
  thirdUser: {
    email: process.env.TEST_EMAIL_3 || 'test3@sprouthub.app',
    password: process.env.TEST_PASSWORD_3 || 'TestPassword123!',
  },
  invalidEmails: {
    malformed: 'invalid-email',
    missingAt: 'testsprouthub.app',
    missingDomain: 'test@',
    missingTld: 'test@sprouthub'
  }
};
