/* eslint-disable react-hooks/rules-of-hooks */
import { test as base, expect } from '@playwright/test';
import { AuthPage } from '../page-objects/AuthPage';
import { SmartWateringPage } from '../page-objects/SmartWateringPage';

// Extend basic test by providing page objects
export const test = base.extend<{
  authPage: AuthPage;
  smartWateringPage: SmartWateringPage;
}>({
  authPage: async ({ page }, use) => {
    const authPage = new AuthPage(page);
    await use(authPage);
  },
  
  smartWateringPage: async ({ page }, use) => {
    const smartWateringPage = new SmartWateringPage(page);
    await use(smartWateringPage);
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
