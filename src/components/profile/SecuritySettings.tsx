import React from "react";
import {
 Card,
 CardContent,
 CardDescription,
 CardHeader,
 CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Key } from "lucide-react";
import { PasswordInput } from "@/components/auth/PasswordInput";

interface PasswordData {
 currentPassword: string;
 newPassword: string;
 confirmPassword: string;
}

interface SecuritySettingsProps {
 passwordData: PasswordData;
 setPasswordData: React.Dispatch<React.SetStateAction<PasswordData>>;
 handleChangePassword: () => Promise<void>;
 isLoading: boolean;
 hasValidPasswordChanges: () => boolean;
}

const SecuritySettings: React.FC<SecuritySettingsProps> = ({
 passwordData,
 setPasswordData,
 handleChangePassword,
 isLoading,
 hasValidPasswordChanges,
}) => {
 return (
 <Card>
  <CardHeader>
  <div className="flex items-center space-x-2">
   <Key className="w-5 h-5" />
   <CardTitle>Change Password</CardTitle>
  </div>
  <CardDescription>
   Update your password to keep your account secure
  </CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
  <PasswordInput
   id="new_password"
   label="New Password"
   placeholder="Enter new password"
   value={passwordData.newPassword}
   onChange={(value) =>
   setPasswordData((prev) => ({ ...prev, newPassword: value }))
   }
  />

  <PasswordInput
   id="confirm_password"
   label="Confirm New Password"
   placeholder="Confirm new password"
   value={passwordData.confirmPassword}
   onChange={(value) =>
   setPasswordData((prev) => ({ ...prev, confirmPassword: value }))
   }
  />

  <Button
   onClick={handleChangePassword}
   disabled={isLoading || !hasValidPasswordChanges()}
   className={`w-full font-medium ${
   hasValidPasswordChanges() && !isLoading
    ? "bg-sprout-success hover:bg-sprout-success/90 text-white"
    : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600 cursor-not-allowed"
   }`}
  >
   {isLoading ? "Updating..." : "Change Password"}
  </Button>
  </CardContent>
 </Card>
 );
};

export default SecuritySettings;
