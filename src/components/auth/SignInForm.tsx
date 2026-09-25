import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { FieldLabel, settingsInputClasses, settingsPrimaryButtonClasses } from "@/components/settings/SettingsUI";
import { PasswordInput } from "./PasswordInput";
import { authToast } from "@/utils/notifications/toast";
import { Link } from "react-router-dom";

/**
 * Props for SignInForm component.
 */
export interface SignInFormProps {
 isLoading: boolean;
 onSignIn: (
 email: string,
 password: string
 ) => Promise<{ error?: { message: string } } | void>;
}

/**
 * SignInForm component for user authentication.
 */
export const SignInForm: React.FC<SignInFormProps> = ({
 isLoading,
 onSignIn,
}) => {
 const [formData, setFormData] = useState({
 email: "",
 password: "",
 });

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 const { error } = (await onSignIn(formData.email, formData.password)) || {};
 if (error) {
  authToast.signInError(error.message);
 }
 };

 return (
 <form onSubmit={handleSubmit} className="space-y-3">
  <div>
  <FieldLabel htmlFor="signin-email">Email</FieldLabel>
  <Input
   id="signin-email"
   type="email"
   placeholder="Enter your email"
   value={formData.email}
   onChange={(e) => setFormData({ ...formData, email: e.target.value })}
   required
   inputMode="email"
   autoComplete="email"
   data-testid="sign-in-email"
   className={settingsInputClasses}
  />
  </div>
  <PasswordInput
  id="sign-in-password"
  label="Password"
  placeholder="Enter your password"
  value={formData.password}
  onChange={(value) => setFormData({ ...formData, password: value })}
  required
  autoComplete="current-password"
  />

  <div className="flex justify-end -mt-1">
  <Link
   to="/forgot-password"
   className="text-sm font-bold text-link hover:underline underline-offset-2 px-1"
  >
   Forgot password?
  </Link>
  </div>

  <button
  type="submit"
  className={settingsPrimaryButtonClasses}
  disabled={isLoading}
  data-testid="sign-in-button"
  >
  {isLoading ? "Signing in..." : "Sign In"}
  </button>
 </form>
 );
};

export default SignInForm;
