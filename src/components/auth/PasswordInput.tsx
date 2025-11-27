import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps {
 id: string;
 label: string;
 placeholder: string;
 value: string;
 onChange: (value: string) => void;
 error?: string;
 required?: boolean;
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
}) => {
 const [showPassword, setShowPassword] = useState(false);

 return (
 <div className="space-y-2">
  <Label htmlFor={id}>{label}</Label>
  <div className="relative">
  <Input
   id={id}
   type={showPassword ? "text" : "password"}
   placeholder={placeholder}
   value={value}
   onChange={(e) => onChange(e.target.value)}
   className={error ? "border-red-500" : ""}
   required={required}
   data-testid={id}
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
  {error && <p className="text-sm text-red-500" data-testid={`${id}-error`}>{error}</p>}
 </div>
 );
};
