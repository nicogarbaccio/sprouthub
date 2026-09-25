import React from "react";
import {
 SettingsCard,
 settingsPrimaryButtonClasses,
} from "@/components/settings/SettingsUI";
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
 <SettingsCard
  title="Change Password"
  description="Use a new password to keep your account secure"
  icon={Key}
 >
  <PasswordInput
  id="new_password"
  label="New Password"
  placeholder="Enter new password"
  value={passwordData.newPassword}
  onChange={(value) =>
   setPasswordData((prev) => ({ ...prev, newPassword: value }))
  }
  autoComplete="new-password"
  />

  <PasswordInput
  id="confirm_password"
  label="Confirm New Password"
  placeholder="Confirm new password"
  value={passwordData.confirmPassword}
  onChange={(value) =>
   setPasswordData((prev) => ({ ...prev, confirmPassword: value }))
  }
  autoComplete="new-password"
  />

  <button
  type="button"
  onClick={handleChangePassword}
  disabled={isLoading || !hasValidPasswordChanges()}
  className={settingsPrimaryButtonClasses}
  >
  {isLoading ? "Updating..." : "Change Password"}
  </button>
 </SettingsCard>
 );
};

export default SecuritySettings;
