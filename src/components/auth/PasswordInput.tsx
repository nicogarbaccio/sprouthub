import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { FieldLabel, settingsInputClasses } from "@/components/settings/SettingsUI";
import { FieldError, invalidInputClasses } from "./AuthUI";

interface PasswordInputProps {
 id: string;
 label: string;
 placeholder: string;
 value: string;
 onChange: (value: string) => void;
 error?: string;
 required?: boolean;
 autoComplete?: string;
}

/**
 * Reusable password input component with show/hide functionality
 */
export const PasswordInput: React.FC<PasswordInputProps> = ({
 id,
 label,
 placeholder,
 value,
 onChange,
 error,
 required = false,
 autoComplete,
}) => {
 const [showPassword, setShowPassword] = useState(false);

 return (
 <div>
  <FieldLabel htmlFor={id}>{label}</FieldLabel>
  <div className="relative">
  <Input
   id={id}
   type={showPassword ? "text" : "password"}
   placeholder={placeholder}
   value={value}
   onChange={(e) => onChange(e.target.value)}
   className={cn(settingsInputClasses, "pr-12", error && invalidInputClasses)}
   required={required}
   autoComplete={autoComplete}
   aria-invalid={!!error}
   data-testid={id}
  />
  <button
   type="button"
   className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl text-muted-foreground hover:text-foreground flex items-center justify-center"
   onClick={() => setShowPassword((v) => !v)}
   aria-label={showPassword ? "Hide password" : "Show password"}
  >
   {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
  </button>
  </div>
  {error && <FieldError testId={`${id}-error`}>{error}</FieldError>}
 </div>
 );
};
