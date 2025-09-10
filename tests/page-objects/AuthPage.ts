import { Page, Locator, expect } from '@playwright/test';
import { TIMEOUTS } from '../config/timeouts';
import { BasePage } from './BasePage';

export class AuthPage extends BasePage {
  readonly signInTab: Locator;
  readonly signUpTab: Locator;
  readonly signInEmailInput: Locator;
  readonly signInPasswordInput: Locator;
  readonly signUpEmailInput: Locator;
  readonly signUpPasswordInput: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly usernameInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly signInButton: Locator;
  readonly signUpButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly passwordToggle: Locator;

  constructor(page: Page) {
    super(page);
    
    // Tab elements
    this.signInTab = page.getByTestId('sign-in-trigger');
    this.signUpTab = page.getByTestId('sign-up-trigger');
    
    // Sign In Form inputs
    this.signInEmailInput = page.getByTestId('sign-in-email');
    this.signInPasswordInput = page.getByTestId('sign-in-password');
    
    // Sign Up Form inputs
    this.signUpEmailInput = page.getByTestId('sign-up-email');
    this.signUpPasswordInput = page.getByTestId('signup-password');
    this.firstNameInput = page.getByTestId('first-name-input');
    this.lastNameInput = page.getByTestId('last-name-input');
    this.usernameInput = page.getByTestId('username-input');
    this.confirmPasswordInput = page.getByTestId('confirmPassword');
    
    // Buttons
    this.signInButton = page.getByTestId('sign-in-button');
    this.signUpButton = page.getByTestId('sign-up-button');
    
    // Links
    this.forgotPasswordLink = page.getByRole('link', { name: 'Forgot password?' });
    
    // Password toggle - look for button next to password input
    this.passwordToggle = page.locator('[role="tabpanel"]:not([hidden]) button:has(svg)');
  }

  // Dynamic getters for context-aware form elements
  get emailInput(): Locator {
    // Check which tab is active and return appropriate input
    return this.page.locator('[role="tabpanel"]:not([hidden]) input[type="email"]');
  }

  get passwordInput(): Locator {
    // Check which tab is active and return appropriate input
    return this.page.locator('[role="tabpanel"]:not([hidden]) input[type="password"]').first();
  }

  async goto() {
    await super.goto('/auth');
    await this.waitForPageReady();
  }

  async switchToSignUp() {
    await this.clickElement(this.signUpTab);
    await this.page.waitForTimeout(TIMEOUTS.TAB_TRANSITION); // Wait for tab transition
  }

  async switchToSignIn() {
    await this.clickElement(this.signInTab);
    await this.page.waitForTimeout(TIMEOUTS.TAB_TRANSITION); // Wait for tab transition
  }

  async fillSignInForm(email: string, password: string) {
    await this.fillForm([
      { locator: this.signInEmailInput, value: email },
      { locator: this.signInPasswordInput, value: password }
    ]);
  }

  async fillSignUpForm(userData: {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) {
    await this.fillForm([
      { locator: this.firstNameInput, value: userData.firstName },
      { locator: this.lastNameInput, value: userData.lastName },
      { locator: this.usernameInput, value: userData.username },
      { locator: this.signUpEmailInput, value: userData.email },
      { locator: this.signUpPasswordInput, value: userData.password },
      { locator: this.confirmPasswordInput, value: userData.confirmPassword }
    ]);
  }

  async submitSignIn() {
    await this.clickElement(this.signInButton);
    // Brief wait for form submission
    await this.page.waitForTimeout(500);
  }

  async submitSignUp() {
    await this.clickElement(this.signUpButton);
    // Brief wait for form submission
    await this.page.waitForTimeout(500);
  }

  async togglePasswordVisibility() {
    await this.clickElement(this.passwordToggle);
  }

  async clickForgotPassword() {
    await this.clickElement(this.forgotPasswordLink);
  }

  async expectSignInFormVisible() {
    await this.expectVisible(this.signInEmailInput);
    await this.expectVisible(this.signInPasswordInput);
    await this.expectVisible(this.signInButton);
  }

  async expectSignUpFormVisible() {
    await this.expectVisible(this.firstNameInput);
    await this.expectVisible(this.lastNameInput);
    await this.expectVisible(this.usernameInput);
    await this.expectVisible(this.signUpEmailInput);
    await this.expectVisible(this.signUpPasswordInput);
    await this.expectVisible(this.confirmPasswordInput);
    await this.expectVisible(this.signUpButton);
  }

  async expectValidationError(fieldName: string) {
    await super.expectValidationError(fieldName);
  }

  async expectSuccessToast() {
    return await super.expectSuccessToast();
  }

  async expectErrorToast() {
    return await super.expectErrorToast();
  }
}
