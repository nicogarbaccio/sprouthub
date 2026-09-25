import React from "react";

const ProfileHeader: React.FC = () => {
 return (
 <div className="px-1.5 lg:px-0">
  <h1 className="font-display text-[28px] lg:text-[34px] font-bold tracking-[-0.04em] text-foreground">
  Profile
  </h1>
  <p className="text-sm lg:text-[15px] font-medium text-muted-foreground mt-0.5">
  Your account details and password
  </p>
 </div>
 );
};

export default ProfileHeader;
