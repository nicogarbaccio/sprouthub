import React from "react";

const ProfileHeader: React.FC = () => {
 return (
  <div className="text-center mb-8">
   <h1 className="text-3xl font-bold text-foreground mb-2">
    Profile Settings
   </h1>
   <p className="text-muted-foreground">
    Manage your account information and preferences
   </p>
  </div>
 );
};

export default ProfileHeader;
