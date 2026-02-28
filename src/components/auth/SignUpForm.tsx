import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { SignUpFormFields } from "./SignUpFormFields";
import { authToast } from "@/utils/notifications/toast";
import {
 validateSignUpForm,
 hasValidationErrors,
 type FormData,
 type ValidationErrors,
} from "@/utils/auth/validation";

/**
 * Props for SignUpForm component.
 */
export interface SignUpFormProps {
 isLoading: boolean;
 onSignUp: (
 email: string,
 password: string,
 firstName: string,
 lastName: string,
 username: string
 ) => Promise<{ error?: { message: string } } | void>;
}

/**
 * SignUpForm component for user registration.
 */
export const SignUpForm: React.FC<SignUpFormProps> = ({
 isLoading,
 onSignUp,
}) => {
 const [formData, setFormData] = useState<FormData>({
 firstName: "",
 lastName: "",
 username: "",
 email: "",
 password: "",
 confirmPassword: "",
 });
 const [errors, setErrors] = useState<ValidationErrors>({
 password: "",
 confirmPassword: "",
 username: "",
 email: "",
 });

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();

 const validationErrors = validateSignUpForm(formData);
 setErrors(validationErrors);

 if (hasValidationErrors(validationErrors)) {
  return;
 }

 const { error } =
  (await onSignUp(
  formData.email,
  formData.password,
  formData.firstName,
  formData.lastName,
  formData.username
  )) || {};

 if (error) {
  authToast.signUpError(error.message);
 } else {
  authToast.signUpSuccess();
 }
 };

 const handleInputChange = (field: string, value: string) => {
 setFormData({ ...formData, [field]: value });

 // Clear errors when user starts typing
 if (errors[field as keyof ValidationErrors]) {
  setErrors({ ...errors, [field]: "" });
 }
 };

 return (
 <form onSubmit={handleSubmit} className="space-y-4">
  <SignUpFormFields
  formData={formData}
  errors={errors}
  onInputChange={handleInputChange}
  />
  <Button
  type="submit"
  className="w-full bg-sprout-light hover:bg-sprout-medium text-sprout-white"
  disabled={isLoading}
  data-testid="sign-up-button"
  >
  {isLoading ? "Creating account..." : "Sign Up"}
  </Button>
 </form>
 );
};

export default SignUpForm;
