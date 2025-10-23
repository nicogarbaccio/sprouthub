import { Page, Locator, expect } from '@playwright/test';
import { TIMEOUTS } from '../config/timeouts';
import { BasePage } from './BasePage';

export class HouseholdPage extends BasePage {

  // Main elements
  readonly householdsSection: Locator;
  readonly createHouseholdButton: Locator;
  readonly householdCards: Locator;
  readonly emptyState: Locator;

  // Household management
  readonly householdNames: Locator;
  readonly memberLists: Locator;
  readonly inviteButtons: Locator;
  readonly viewMembersButtons: Locator;
  readonly deleteHouseholdButtons: Locator;

  // Invitations
  readonly invitationsSection: Locator;
  readonly invitationCards: Locator;
  readonly acceptInvitationButtons: Locator;
  readonly declineInvitationButtons: Locator;

  // Dialogs
  readonly createHouseholdDialog: Locator;
  readonly inviteMemberDialog: Locator;
  readonly viewMembersDialog: Locator;
  readonly confirmDeleteDialog: Locator;

  // Form fields
  readonly householdNameInput: Locator;
  readonly householdDescriptionInput: Locator;
  readonly inviteEmailInput: Locator;
  readonly inviteRoleSelect: Locator;

  // Member management
  readonly memberItems: Locator;
  readonly removeMemberButtons: Locator;
  readonly memberRoleBadges: Locator;

  // Plant cards in household context
  readonly householdPlantCards: Locator;
  readonly plantActionButtons: Locator;
  readonly editPlantButtons: Locator;
  readonly deletePlantButtons: Locator;

  constructor(page: Page) {
    super(page);

    // Main elements
    this.householdsSection = page.getByTestId('households-section');
    this.createHouseholdButton = page.getByRole('button', { name: /create household/i });
    this.householdCards = page.getByTestId('household-card');
    this.emptyState = page.getByTestId('households-empty-state');

    // Household management
    this.householdNames = page.getByTestId('household-name');
    this.memberLists = page.getByTestId('member-list');
    this.inviteButtons = page.getByRole('button', { name: /invite/i });
    this.viewMembersButtons = page.getByRole('button', { name: /view members|members/i });
    this.deleteHouseholdButtons = page.getByRole('button', { name: /delete household/i });

    // Invitations
    this.invitationsSection = page.getByTestId('invitations-section');
    this.invitationCards = page.getByTestId('invitation-card');
    this.acceptInvitationButtons = page.getByRole('button', { name: /accept/i });
    this.declineInvitationButtons = page.getByRole('button', { name: /decline/i });

    // Dialogs
    this.createHouseholdDialog = page.getByRole('dialog', { name: /create household/i });
    this.inviteMemberDialog = page.getByRole('dialog', { name: /invite member/i });
    this.viewMembersDialog = page.getByRole('dialog', { name: /members|household members/i });
    this.confirmDeleteDialog = page.getByRole('dialog', { name: /confirm|delete/i });

    // Form fields
    this.householdNameInput = page.getByLabel(/household name/i);
    this.householdDescriptionInput = page.getByLabel(/description/i);
    this.inviteEmailInput = page.getByLabel(/email/i);
    this.inviteRoleSelect = page.getByLabel(/role/i);

    // Member management
    this.memberItems = page.getByTestId('member-item');
    this.removeMemberButtons = page.getByRole('button', { name: /remove.*member|remove/i });
    this.memberRoleBadges = page.getByTestId('member-role-badge');

    // Plant cards in household context
    this.householdPlantCards = page.getByTestId('household-plant-card');
    this.plantActionButtons = page.getByTestId('plant-actions-menu');
    this.editPlantButtons = page.getByRole('button', { name: /edit.*plant/i });
    this.deletePlantButtons = page.getByRole('button', { name: /delete.*plant/i });
  }

  async goto() {
    await super.goto('/households');
    await this.waitForPageReady();
  }

  // Household creation
  async clickCreateHousehold() {
    await this.clickElement(this.createHouseholdButton);
    await this.waitForDialogOpen(this.createHouseholdDialog);
  }

  async fillHouseholdForm(name: string, description?: string) {
    await this.fillField(this.householdNameInput, name);
    if (description) {
      await this.fillField(this.householdDescriptionInput, description);
    }
  }

  async submitCreateHousehold() {
    const submitButton = this.createHouseholdDialog.getByRole('button', { name: /create|submit/i });
    await this.clickElement(submitButton);
  }

  async createHousehold(name: string, description?: string): Promise<boolean> {
    try {
      // Check if create button exists
      const hasCreateButton = await this.createHouseholdButton.isVisible({ timeout: 2000 });
      if (!hasCreateButton) {
        console.log('Create household button not found - household UI may not be implemented');
        return false;
      }

      await this.clickCreateHousehold();
      await this.fillHouseholdForm(name, description);
      await this.submitCreateHousehold();

      // Wait for either success or error toast
      try {
        await this.expectSuccessToast();
        return true;
      } catch (e) {
        // May have failed due to validation or other issue
        console.log('Create household did not show success toast');
        return false;
      }
    } catch (error) {
      console.log('Failed to create household:', error);
      return false;
    }
  }

  // Member invitation
  async openInviteMemberDialog(householdIndex: number = 0) {
    const inviteButton = this.inviteButtons.nth(householdIndex);
    await this.clickElement(inviteButton);
    await this.waitForDialogOpen(this.inviteMemberDialog);
  }

  async fillInviteForm(email: string, role: 'member' | 'admin' = 'member') {
    await this.fillField(this.inviteEmailInput, email);
    if (role !== 'member') {
      await this.selectOption(this.inviteRoleSelect, role);
    }
  }

  async submitInvite() {
    const submitButton = this.inviteMemberDialog.getByRole('button', { name: /invite|send/i });
    await this.clickElement(submitButton);
  }

  async inviteMember(email: string, role: 'member' | 'admin' = 'member', householdIndex: number = 0) {
    await this.openInviteMemberDialog(householdIndex);
    await this.fillInviteForm(email, role);
    await this.submitInvite();
  }

  // View members
  async openViewMembersDialog(householdIndex: number = 0) {
    const viewButton = this.viewMembersButtons.nth(householdIndex);
    await this.clickElement(viewButton);
    await this.waitForDialogOpen(this.viewMembersDialog);
  }

  async closeMembersDialog() {
    await this.closeDialog(this.viewMembersDialog);
  }

  // Member management
  async removeMember(memberIndex: number = 0) {
    const removeButton = this.removeMemberButtons.nth(memberIndex);
    await this.clickElement(removeButton);
  }

  async removeMemberById(memberId: string) {
    const removeButton = this.page.getByTestId(`remove-member-${memberId}`);
    await this.clickElement(removeButton);
  }

  // Household deletion
  async deleteHousehold(householdIndex: number = 0) {
    const deleteButton = this.deleteHouseholdButtons.nth(householdIndex);
    await this.clickElement(deleteButton);
    // May have confirmation dialog
    await this.page.waitForTimeout(TIMEOUTS.SHORT_WAIT);
  }

  async confirmDeleteHousehold() {
    const confirmButton = this.confirmDeleteDialog.getByRole('button', { name: /delete|confirm/i });
    await this.clickElement(confirmButton);
  }

  // Invitations
  async acceptInvitation(invitationIndex: number = 0) {
    const acceptButton = this.acceptInvitationButtons.nth(invitationIndex);
    await this.clickElement(acceptButton);
    await this.expectSuccessToast();
  }

  async declineInvitation(invitationIndex: number = 0) {
    const declineButton = this.declineInvitationButtons.nth(invitationIndex);
    await this.clickElement(declineButton);
    await this.expectSuccessToast();
  }

  // Plant operations in household context
  async openPlantActionsMenu(plantIndex: number = 0) {
    const menuButton = this.plantActionButtons.nth(plantIndex);
    await this.clickElement(menuButton);
    await this.page.waitForTimeout(TIMEOUTS.SHORT_WAIT);
  }

  async clickEditPlant(plantIndex: number = 0) {
    await this.openPlantActionsMenu(plantIndex);
    const editButton = this.editPlantButtons.nth(plantIndex);
    await this.clickElement(editButton);
  }

  async clickDeletePlant(plantIndex: number = 0) {
    await this.openPlantActionsMenu(plantIndex);
    const deleteButton = this.deletePlantButtons.nth(plantIndex);
    await this.clickElement(deleteButton);
  }

  // Assertions
  async expectHouseholdCount(expectedCount: number) {
    await expect(this.householdCards).toHaveCount(expectedCount);
  }

  async expectInvitationCount(expectedCount: number) {
    await expect(this.invitationCards).toHaveCount(expectedCount);
  }

  async expectMemberCount(expectedCount: number) {
    await expect(this.memberItems).toHaveCount(expectedCount);
  }

  async expectEmptyState() {
    await this.expectVisible(this.emptyState);
  }

  async expectHouseholdsVisible() {
    await this.expectVisible(this.householdCards.first());
  }

  async expectInvitationsVisible() {
    await this.expectVisible(this.invitationCards.first());
  }

  async expectMemberRole(memberIndex: number, expectedRole: string) {
    const roleBadge = this.memberRoleBadges.nth(memberIndex);
    await this.expectText(roleBadge, expectedRole);
  }

  async expectCreateHouseholdDialogVisible() {
    await expect(this.createHouseholdDialog).toBeVisible();
  }

  async expectInviteMemberDialogVisible() {
    await expect(this.inviteMemberDialog).toBeVisible();
  }

  async expectViewMembersDialogVisible() {
    await expect(this.viewMembersDialog).toBeVisible();
  }

  async expectErrorToastWithMessage(message: string | RegExp) {
    const toast = await this.expectErrorToast();
    await expect(toast).toContainText(message);
  }

  async expectSuccessToastWithMessage(message: string | RegExp) {
    const toast = await this.expectSuccessToast();
    await expect(toast).toContainText(message);
  }

  // Utility methods
  async getHouseholdCount() {
    return await this.householdCards.count();
  }

  async getInvitationCount() {
    return await this.invitationCards.count();
  }

  async getMemberCount() {
    return await this.memberItems.count();
  }
}
