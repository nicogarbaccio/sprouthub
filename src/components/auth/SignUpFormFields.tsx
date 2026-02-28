import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "./PasswordInput";
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
  <div className="grid grid-cols-2 gap-4">
  <div className="space-y-2">
   <Label htmlFor="firstName">First Name</Label>
   <Input
   id="firstName"
   placeholder="First name"
   value={formData.firstName}
   onChange={(e) => onInputChange("firstName", e.target.value)}
   required
   autoComplete="given-name"
   data-testid="first-name-input"
   />
  </div>
  <div className="space-y-2">
   <Label htmlFor="lastName">Last Name</Label>
   <Input
   id="lastName"
   placeholder="Last name"
   value={formData.lastName}
   onChange={(e) => onInputChange("lastName", e.target.value)}
   required
   autoComplete="family-name"
   data-testid="last-name-input"
   />
  </div>
  </div>

  <div className="space-y-2">
  <Label htmlFor="username">Username</Label>
  <Input
   id="username"
   placeholder="Choose a username"
   value={formData.username}
   onChange={(e) => onInputChange("username", e.target.value)}
   className={errors.username ? "border-red-500" : ""}
   required
   autoComplete="username"
   data-testid="username-input"
  />
  {errors.username && (
   <p className="text-sm text-red-500" data-testid="username-error">{errors.username}</p>
  )}
  </div>

  <div className="space-y-2">
  <Label htmlFor="signup-email">Email</Label>
  <Input
   id="signup-email"
   type="email"
   placeholder="Enter your email"
   value={formData.email}
   onChange={(e) => onInputChange("email", e.target.value)}
   className={errors.email ? "border-red-500" : ""}
   required
   inputMode="email"
   autoComplete="email"
   data-testid="sign-up-email"
  />
  {errors.email && <p className="text-sm text-red-500" data-testid="email-error">{errors.email}</p>}
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
