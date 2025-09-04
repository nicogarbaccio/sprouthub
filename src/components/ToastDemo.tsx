import React from "react";
import { Button } from "@/components/ui/button";
import {
 Card,
 CardContent,
 CardDescription,
 CardHeader,
 CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
 plantToast,
 wateringToast,
 authToast,
 profileToast,
 utilityToast,
 imageToast,
} from "@/utils/toast-helpers";

const ToastDemo: React.FC = () => {
 return (
 <div className="container mx-auto p-6 max-w-4xl space-y-6">
  <div className="text-center space-y-2">
  <h1 className="text-3xl font-bold text-sprout-primary dark:text-sprout-light">
   🎉 Enhanced Toast Notifications
  </h1>
  <p className="text-muted-foreground">
   Experience our new toast system with sprout colors, emojis, and
   delightful animations
  </p>
  </div>

  <div className="grid gap-6 md:grid-cols-2">
  {/* Plant-related Toasts */}
  <Card>
   <CardHeader>
   <CardTitle className="flex items-center gap-2">
    🌱 Plant Toasts
   </CardTitle>
   <CardDescription>Plant management notifications</CardDescription>
   </CardHeader>
   <CardContent className="space-y-3">
   <Button
    onClick={() => plantToast.added("Snake Plant")}
    variant="outline"
    className="w-full justify-start"
   >
    Plant Added Success
   </Button>
   <Button
    onClick={() => plantToast.updated("Monstera Deliciosa")}
    variant="outline"
    className="w-full justify-start"
   >
    Plant Updated
   </Button>
   <Button
    onClick={() =>
    plantToast.careReminder("Fiddle Leaf Fig", "pruning")
    }
    variant="outline"
    className="w-full justify-start"
   >
    Care Reminder
   </Button>
   <Button
    onClick={() => plantToast.error("save", "Connection failed")}
    variant="outline"
    className="w-full justify-start"
   >
    Plant Error
   </Button>
   </CardContent>
  </Card>

  {/* Watering Toasts */}
  <Card>
   <CardHeader>
   <CardTitle className="flex items-center gap-2">
    💧 Watering Toasts
   </CardTitle>
   <CardDescription>Watering system notifications</CardDescription>
   </CardHeader>
   <CardContent className="space-y-3">
   <Button
    onClick={() => wateringToast.recorded("Peace Lily")}
    variant="outline"
    className="w-full justify-start"
   >
    Watering Recorded
   </Button>
   <Button
    onClick={() => wateringToast.reminder(["Pothos", "Snake Plant"])}
    variant="outline"
    className="w-full justify-start"
   >
    Multiple Plant Reminder
   </Button>
   <Button
    onClick={() => wateringToast.scheduled("Rubber Plant")}
    variant="outline"
    className="w-full justify-start"
   >
    Schedule Updated
   </Button>
   <Button
    onClick={() => wateringToast.error("recording")}
    variant="outline"
    className="w-full justify-start"
   >
    Watering Error
   </Button>
   </CardContent>
  </Card>

  {/* Authentication Toasts */}
  <Card>
   <CardHeader>
   <CardTitle className="flex items-center gap-2">
    🔐 Auth Toasts
   </CardTitle>
   <CardDescription>Authentication notifications</CardDescription>
   </CardHeader>
   <CardContent className="space-y-3">
   <Button
    onClick={() => authToast.signInSuccess()}
    variant="outline"
    className="w-full justify-start"
   >
    Sign In Success
   </Button>
   <Button
    onClick={() => authToast.signUpSuccess()}
    variant="outline"
    className="w-full justify-start"
   >
    Sign Up Success
   </Button>
   <Button
    onClick={() => authToast.signOutSuccess()}
    variant="outline"
    className="w-full justify-start"
   >
    Sign Out Success
   </Button>
   <Button
    onClick={() => authToast.signInError("Invalid email or password")}
    variant="outline"
    className="w-full justify-start"
   >
    Auth Error
   </Button>
   </CardContent>
  </Card>

  {/* Utility Toasts */}
  <Card>
   <CardHeader>
   <CardTitle className="flex items-center gap-2">
    🛠️ Utility Toasts
   </CardTitle>
   <CardDescription>General purpose notifications</CardDescription>
   </CardHeader>
   <CardContent className="space-y-3">
   <Button
    onClick={() =>
    utilityToast.info(
     "Pro Tip",
     "Water plants early morning for best absorption"
    )
    }
    variant="outline"
    className="w-full justify-start"
   >
    Info Toast
   </Button>
   <Button
    onClick={() =>
    utilityToast.tip(
     "Growing Tip",
     "Rotate your plants weekly for even growth"
    )
    }
    variant="outline"
    className="w-full justify-start"
   >
    Tip Toast
   </Button>
   <Button
    onClick={() =>
    utilityToast.warning(
     "Maintenance",
     "System will be down for updates tonight"
    )
    }
    variant="outline"
    className="w-full justify-start"
   >
    Warning Toast
   </Button>
   <Button
    onClick={() => profileToast.updated()}
    variant="outline"
    className="w-full justify-start"
   >
    Profile Updated
   </Button>
   </CardContent>
  </Card>
  </div>

  <Separator />

  {/* Image Upload Toasts */}
  <Card>
  <CardHeader>
   <CardTitle className="flex items-center gap-2">
   📸 Image Upload Toasts
   </CardTitle>
   <CardDescription>Image handling notifications</CardDescription>
  </CardHeader>
  <CardContent>
   <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
   <Button
    onClick={() => imageToast.uploaded()}
    variant="outline"
    size="sm"
   >
    Upload Success
   </Button>
   <Button
    onClick={() => imageToast.tooLarge()}
    variant="outline"
    size="sm"
   >
    File Too Large
   </Button>
   <Button
    onClick={() => imageToast.invalidType()}
    variant="outline"
    size="sm"
   >
    Invalid Type
   </Button>
   <Button
    onClick={() => imageToast.uploadError()}
    variant="outline"
    size="sm"
   >
    Upload Error
   </Button>
   </div>
  </CardContent>
  </Card>

  <div className="text-center text-sm text-muted-foreground">
  <p>
   ✨ All toasts use your sprout color palette and include contextual
   emojis
  </p>
  <p>
   🎨 Variants: success (green), warning (orange), error (red), info
   (blue), watering (special blue-green)
  </p>
  </div>
 </div>
 );
};

export default ToastDemo;
