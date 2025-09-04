import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { authToast } from "@/utils/toast-helpers";
import { Link } from "react-router-dom";
import type { ToastProps } from "@/components/ui/toast";

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
 const [showPassword, setShowPassword] = useState(false);
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
  <form onSubmit={handleSubmit} className="space-y-4">
   <div className="space-y-2">
    <Label htmlFor="signin-email">Email</Label>
    <Input
     id="signin-email"
     type="email"
     placeholder="Enter your email"
     value={formData.email}
     onChange={(e) => setFormData({ ...formData, email: e.target.value })}
     required
     data-testid="sign-in-email"
    />
   </div>
   <div className="space-y-2">
    <Label htmlFor="signin-password">Password</Label>
    <div className="relative">
     <Input
      id="signin-password"
      type={showPassword ? "text" : "password"}
      placeholder="Enter your password"
      value={formData.password}
      onChange={(e) =>
       setFormData({ ...formData, password: e.target.value })
      }
      required
      data-testid="sign-in-password"
     />
     <Button
      type="button"
      variant="ghost"
      size="sm"
      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
      onClick={() => setShowPassword((v) => !v)}
     >
      {showPassword ? (
       <EyeOff className="h-4 w-4" />
      ) : (
       <Eye className="h-4 w-4" />
      )}
     </Button>
    </div>
   </div>

   <div className="flex items-center justify-between">
    <div></div>
    <Link
     to="/forgot-password"
     className="text-sm text-sprout-cream hover:text-sprout-light dark:hover:text-sprout-pale transition-colors"
    >
     Forgot password?
    </Link>
   </div>

   <Button
    type="submit"
    className="w-full bg-sprout-light hover:bg-sprout-medium text-sprout-white"
    disabled={isLoading}
    data-testid="sign-in-button"
   >
    {isLoading ? "Signing in..." : "Sign In"}
   </Button>
  </form>
 );
};

export default SignInForm;
