import React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FieldLabel, settingsInputClasses } from "@/components/settings/SettingsUI";
import { PasswordInput } from "./PasswordInput";
import { FieldError, invalidInputClasses } from "./AuthUI";
import type { FormData, ValidationErrors } from "@/utils/auth/validation";

interface SignUpFormFieldsProps {
 formData: FormData;
 errors: ValidationErrors;
 onInputChange: (field: string, value: string) => void;
}

/**
 * Form fields component for the signup form
 */
export const SignUpFormFields: React.FC<SignUpFormFieldsProps> = ({
 formData,
 errors,
 onInputChange,
}) => {
 return (
 <>
  <div className="grid grid-cols-2 gap-3">
  <div>
   <FieldLabel htmlFor="firstName">First Name</FieldLabel>
   <Input
   id="firstName"
   placeholder="First name"
   value={formData.firstName}
   onChange={(e) => onInputChange("firstName", e.target.value)}
   required
   autoComplete="given-name"
   className={settingsInputClasses}
   data-testid="first-name-input"
   />
  </div>
  <div>
   <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
   <Input
   id="lastName"
   placeholder="Last name"
   value={formData.lastName}
   onChange={(e) => onInputChange("lastName", e.target.value)}
   required
   autoComplete="family-name"
   className={settingsInputClasses}
   data-testid="last-name-input"
   />
  </div>
  </div>

  <div>
  <FieldLabel htmlFor="username">Username</FieldLabel>
  <Input
   id="username"
   placeholder="Choose a username"
   value={formData.username}
   onChange={(e) => onInputChange("username", e.target.value)}
   className={cn(settingsInputClasses, errors.username && invalidInputClasses)}
   aria-invalid={!!errors.username}
   required
   autoComplete="username"
   data-testid="username-input"
  />
  {errors.username && (
   <FieldError testId="username-error">{errors.username}</FieldError>
  )}
  </div>

  <div>
  <FieldLabel htmlFor="signup-email">Email</FieldLabel>
  <Input
   id="signup-email"
   type="email"
   placeholder="Enter your email"
   value={formData.email}
   onChange={(e) => onInputChange("email", e.target.value)}
   className={cn(settingsInputClasses, errors.email && invalidInputClasses)}
   aria-invalid={!!errors.email}
   required
   inputMode="email"
   autoComplete="email"
   data-testid="sign-up-email"
  />
  {errors.email && <FieldError testId="email-error">{errors.email}</FieldError>}
  </div>

  <PasswordInput
  id="signup-password"
  label="Password"
  placeholder="Create a password"
  value={formData.password}
  onChange={(value) => onInputChange("password", value)}
  error={errors.password}
  required
  autoComplete="new-password"
  />

  <PasswordInput
  id="confirmPassword"
  label="Confirm Password"
  placeholder="Confirm your password"
  value={formData.confirmPassword}
  onChange={(value) => onInputChange("confirmPassword", value)}
  error={errors.confirmPassword}
  required
  autoComplete="new-password"
  />
 </>
 );
};
