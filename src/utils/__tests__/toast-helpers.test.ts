import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type MockedFunction } from 'vitest';

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
 toast: vi.fn()
}));

// Import the toast helpers after mocking
const { plantToast, wateringToast, authToast, profileToast, utilityToast, imageToast } = await import('../toast-helpers');
const { toast } = await import('@/hooks/use-toast');

const mockToast = toast as MockedFunction<typeof toast>;

describe('Toast Helpers', () => {
 beforeEach(() => {
 mockToast.mockClear();
 });

 describe('plantToast', () => {
 describe('added', () => {
  it('calls toast with correct parameters for plant added', () => {
  plantToast.added('Snake Plant');

  expect(mockToast).toHaveBeenCalledWith({
   title: '🌱 Plant Added Successfully',
   description: 'Snake Plant has been added to your collection',
   variant: 'success'
  });
  expect(mockToast).toHaveBeenCalledTimes(1);
  });

  it('handles plant names with special characters', () => {
  plantToast.added('Fiddle Leaf Fig (Large)');

  expect(mockToast).toHaveBeenCalledWith({
   title: '🌱 Plant Added Successfully',
   description: 'Fiddle Leaf Fig (Large) has been added to your collection',
   variant: 'success'
  });
  });
 });

 describe('updated', () => {
  it('calls toast with correct parameters for plant updated', () => {
  plantToast.updated('Peace Lily');

  expect(mockToast).toHaveBeenCalledWith({
   title: '💾 Plant Updated',
   description: 'Peace Lily information has been saved',
   variant: 'success'
  });
  });
 });

 describe('deleted', () => {
  it('calls toast with correct parameters for plant deleted', () => {
  plantToast.deleted('Spider Plant');

  expect(mockToast).toHaveBeenCalledWith({
   title: '✅ Plant Removed',
   description: 'Spider Plant has been removed from your collection',
   variant: 'success'
  });
  });
 });

 describe('careReminder', () => {
  it('calls toast with correct parameters for care reminder', () => {
  plantToast.careReminder('Monstera', 'watering');

  expect(mockToast).toHaveBeenCalledWith({
   title: '🌿 Care Reminder',
   description: 'Monstera needs watering',
   variant: 'warning'
  });
  });
 });

 describe('error', () => {
  it('calls toast with default error message', () => {
  plantToast.error('update');

  expect(mockToast).toHaveBeenCalledWith({
   title: '💥 Plant update Failed',
   description: 'Failed to update plant',
   variant: 'error'
  });
  });

  it('calls toast with custom error message', () => {
  plantToast.error('delete', 'Network connection failed');

  expect(mockToast).toHaveBeenCalledWith({
   title: '💥 Plant delete Failed',
   description: 'Network connection failed',
   variant: 'error'
  });
  });
 });
 });

 describe('wateringToast', () => {
 describe('recorded', () => {
  it('calls toast with correct parameters for watering recorded', () => {
  wateringToast.recorded('Rubber Plant');

  expect(mockToast).toHaveBeenCalledWith({
   title: '💧 Watering Recorded',
   description: 'Logged watering for Rubber Plant',
   variant: 'watering'
  });
  });
 });

 describe('reminder', () => {
  it('handles single plant reminder', () => {
  wateringToast.reminder(['Snake Plant']);

  expect(mockToast).toHaveBeenCalledWith({
   title: '🚿 Watering Reminder',
   description: 'Snake Plant needs watering',
   variant: 'watering'
  });
  });

  it('handles two plants reminder', () => {
  wateringToast.reminder(['Snake Plant', 'Peace Lily']);

  expect(mockToast).toHaveBeenCalledWith({
   title: '🚿 Watering Reminder',
   description: 'Snake Plant and Peace Lily need watering',
   variant: 'watering'
  });
  });

  it('handles three plants reminder', () => {
  wateringToast.reminder(['Snake Plant', 'Peace Lily', 'Monstera']);

  expect(mockToast).toHaveBeenCalledWith({
   title: '🚿 Watering Reminder',
   description: 'Snake Plant, Peace Lily and Monstera need watering',
   variant: 'watering'
  });
  });
 });

 describe('scheduled', () => {
  it('calls toast with correct parameters for scheduled watering', () => {
  wateringToast.scheduled('Fiddle Leaf Fig');

  expect(mockToast).toHaveBeenCalledWith({
   title: '✅ Schedule Updated',
   description: 'Watering schedule updated for Fiddle Leaf Fig',
   variant: 'success'
  });
  });
 });

 describe('deleted', () => {
  it('calls toast with correct parameters for deleted watering record', () => {
  wateringToast.deleted();

  expect(mockToast).toHaveBeenCalledWith({
   title: '✅ Record Deleted',
   description: 'Watering record has been removed',
   variant: 'success'
  });
  });
 });

 describe('error', () => {
  it('calls toast with correct parameters for watering error', () => {
  wateringToast.error('record');

  expect(mockToast).toHaveBeenCalledWith({
   title: '💥 Watering record Failed',
   description: 'Unable to record watering record',
   variant: 'error'
  });
  });
 });
 });

 describe('authToast', () => {
 describe('signInSuccess', () => {
  it('calls toast for successful sign in', () => {
  authToast.signInSuccess();

  expect(mockToast).toHaveBeenCalledWith({
   title: '✅ Welcome Back!',
   description: 'You have successfully signed in',
   variant: 'success'
  });
  });
 });

 describe('signInError', () => {
  it('calls toast with error message for sign in failure', () => {
  authToast.signInError('Invalid credentials');

  expect(mockToast).toHaveBeenCalledWith({
   title: '🚫 Sign In Failed',
   description: 'Invalid credentials',
   variant: 'error'
  });
  });
 });

 describe('signUpSuccess', () => {
  it('calls toast for successful sign up', () => {
  authToast.signUpSuccess();

  expect(mockToast).toHaveBeenCalledWith({
   title: '💚 Account Created!',
   description: 'Welcome to SproutHub! Start adding your plants',
   variant: 'success'
  });
  });
 });

 describe('signUpError', () => {
  it('calls toast with error message for sign up failure', () => {
  authToast.signUpError('Email already exists');

  expect(mockToast).toHaveBeenCalledWith({
   title: '💥 Registration Failed',
   description: 'Email already exists',
   variant: 'error'
  });
  });
 });

 describe('signOutSuccess', () => {
  it('calls toast for successful sign out', () => {
  authToast.signOutSuccess();

  expect(mockToast).toHaveBeenCalledWith({
   title: '✅ Signed Out',
   description: 'You have been signed out successfully',
   variant: 'success'
  });
  });
 });

 describe('signOutError', () => {
  it('calls toast for sign out error', () => {
  authToast.signOutError();

  expect(mockToast).toHaveBeenCalledWith({
   title: '💥 Sign Out Failed',
   description: 'There was an error signing you out. Please try again.',
   variant: 'error'
  });
  });
 });
 });

 describe('profileToast', () => {
 describe('updated', () => {
  it('calls toast for profile update', () => {
  profileToast.updated();

  expect(mockToast).toHaveBeenCalledWith({
   title: '💾 Profile Updated',
   description: 'Your profile information has been saved',
   variant: 'success'
  });
  });
 });

 describe('passwordChanged', () => {
  it('calls toast for password change', () => {
  profileToast.passwordChanged();

  expect(mockToast).toHaveBeenCalledWith({
   title: '✅ Password Updated',
   description: 'Your password has been changed successfully',
   variant: 'success'
  });
  });
 });

 describe('error', () => {
  it('calls toast with default error message', () => {
  profileToast.error('update profile');

  expect(mockToast).toHaveBeenCalledWith({
   title: '💥 Update Failed',
   description: 'Failed to update profile',
   variant: 'error'
  });
  });

  it('calls toast with custom error message', () => {
  profileToast.error('change password', 'Password too weak');

  expect(mockToast).toHaveBeenCalledWith({
   title: '💥 Update Failed',
   description: 'Password too weak',
   variant: 'error'
  });
  });
 });
 });

 describe('utilityToast', () => {
 describe('saved', () => {
  it('calls toast with saved message', () => {
  utilityToast.saved('Settings');

  expect(mockToast).toHaveBeenCalledWith({
   title: '💾 Saved',
   description: 'Settings has been saved successfully',
   variant: 'success'
  });
  });
 });

 describe('deleted', () => {
  it('calls toast with deleted message', () => {
  utilityToast.deleted('Profile picture');

  expect(mockToast).toHaveBeenCalledWith({
   title: '✅ Deleted',
   description: 'Profile picture has been removed',
   variant: 'success'
  });
  });
 });

 describe('info', () => {
  it('calls toast with info message', () => {
  utilityToast.info('Update Available', 'A new version is ready to install');

  expect(mockToast).toHaveBeenCalledWith({
   title: 'ℹ️ Update Available',
   description: 'A new version is ready to install',
   variant: 'info'
  });
  });
 });

 describe('tip', () => {
  it('calls toast with tip message', () => {
  utilityToast.tip('Pro Tip', 'Water plants in the morning for best results');

  expect(mockToast).toHaveBeenCalledWith({
   title: '💡 Pro Tip',
   description: 'Water plants in the morning for best results',
   variant: 'info'
  });
  });
 });

 describe('warning', () => {
  it('calls toast with warning message', () => {
  utilityToast.warning('Storage Full', 'Please delete some photos to free up space');

  expect(mockToast).toHaveBeenCalledWith({
   title: '⚠️ Storage Full',
   description: 'Please delete some photos to free up space',
   variant: 'warning'
  });
  });
 });

 describe('error', () => {
  it('calls toast with error message', () => {
  utilityToast.error('Connection Failed', 'Unable to connect to server');

  expect(mockToast).toHaveBeenCalledWith({
   title: '❌ Connection Failed',
   description: 'Unable to connect to server',
   variant: 'error'
  });
  });
 });
 });

 describe('imageToast', () => {
 describe('uploaded', () => {
  it('calls toast for successful upload', () => {
  imageToast.uploaded();

  expect(mockToast).toHaveBeenCalledWith({
   title: '✅ Image Uploaded',
   description: 'Your image has been uploaded successfully',
   variant: 'success'
  });
  });
 });

 describe('tooLarge', () => {
  it('calls toast for file too large', () => {
  imageToast.tooLarge();

  expect(mockToast).toHaveBeenCalledWith({
   title: '⚠️ File Too Large',
   description: 'Please select an image smaller than 5MB',
   variant: 'warning'
  });
  });
 });

 describe('invalidType', () => {
  it('calls toast for invalid file type', () => {
  imageToast.invalidType();

  expect(mockToast).toHaveBeenCalledWith({
   title: '🚫 Invalid File Type',
   description: 'Please select a valid image file (JPG, PNG, WebP)',
   variant: 'error'
  });
  });
 });

 describe('uploadError', () => {
  it('calls toast for upload error', () => {
  imageToast.uploadError();

  expect(mockToast).toHaveBeenCalledWith({
   title: '💥 Upload Failed',
   description: 'Failed to upload image. Please try again.',
   variant: 'error'
  });
  });
 });
 });

 describe('toast consistency', () => {
 it('ensures all success toasts use success variant', () => {
  plantToast.added('Test');
  plantToast.updated('Test');
  plantToast.deleted('Test');
  authToast.signInSuccess();
  authToast.signUpSuccess();
  authToast.signOutSuccess();
  profileToast.updated();
  profileToast.passwordChanged();
  utilityToast.saved('Test');
  utilityToast.deleted('Test');
  wateringToast.scheduled('Test');
  wateringToast.deleted();
  imageToast.uploaded();

  const successCalls = mockToast.mock.calls.filter(call => 
  call[0].variant === 'success'
  );
  expect(successCalls).toHaveLength(13);
 });

 it('ensures all error toasts use error variant', () => {
  plantToast.error('test');
  wateringToast.error('test');
  authToast.signInError('test');
  authToast.signUpError('test');
  authToast.signOutError();
  profileToast.error('test');
  utilityToast.error('title', 'desc');
  imageToast.invalidType();
  imageToast.uploadError();

  const errorCalls = mockToast.mock.calls.filter(call => 
  call[0].variant === 'error'
  );
  expect(errorCalls).toHaveLength(9);
 });

 it('ensures all warning toasts use warning variant', () => {
  plantToast.careReminder('test', 'watering');
  utilityToast.warning('title', 'desc');
  imageToast.tooLarge();

  const warningCalls = mockToast.mock.calls.filter(call => 
  call[0].variant === 'warning'
  );
  expect(warningCalls).toHaveLength(3);
 });

 it('ensures watering toasts use watering variant', () => {
  wateringToast.recorded('test');
  wateringToast.reminder(['test']);

  const wateringCalls = mockToast.mock.calls.filter(call => 
  call[0].variant === 'watering'
  );
  expect(wateringCalls).toHaveLength(2);
 });

 it('ensures info toasts use info variant', () => {
  utilityToast.info('title', 'desc');
  utilityToast.tip('title', 'desc');

  const infoCalls = mockToast.mock.calls.filter(call => 
  call[0].variant === 'info'
  );
  expect(infoCalls).toHaveLength(2);
 });
 });
});