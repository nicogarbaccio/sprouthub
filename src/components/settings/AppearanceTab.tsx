import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTheme } from "@/contexts/ThemeContext";
import { Sun, Moon, Monitor, Palette } from "lucide-react";
import { CascadingContainer } from "@/components/ui/cascading-container";

export const AppearanceTab = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-purple-500" />
            <CardTitle>Appearance</CardTitle>
          </div>
          <CardDescription>
            Customize how sprouthub looks and feels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme Selection */}
          <CascadingContainer delay={0}>
            <div className="space-y-4">
              <Label className="text-base font-medium">Theme</Label>
              <RadioGroup value={theme} onValueChange={setTheme}>
                <div className="grid grid-cols-1 gap-4">
                  {/* Light Theme */}
                  <Card
                    className={`cursor-pointer transition-all border-2 ${
                      theme === "light"
                        ? "border-plant-primary bg-plant-primary/5 dark:bg-plant-primary/10"
                        : "border-border hover:border-plant-primary/50"
                    }`}
                    onClick={() => setTheme("light")}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="light" id="light" />
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-200 to-yellow-400 flex items-center justify-center">
                            <Sun className="w-5 h-5 text-yellow-700" />
                          </div>
                          <div>
                            <Label
                              htmlFor="light"
                              className="font-medium cursor-pointer text-base"
                            >
                              Light Mode
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Bright and clean interface
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Dark Theme */}
                  <Card
                    className={`cursor-pointer transition-all border-2 ${
                      theme === "dark"
                        ? "border-plant-primary bg-plant-primary/5 dark:bg-plant-primary/10"
                        : "border-border hover:border-plant-primary/50"
                    }`}
                    onClick={() => setTheme("dark")}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="dark" id="dark" />
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                            <Moon className="w-5 h-5 text-blue-300" />
                          </div>
                          <div>
                            <Label
                              htmlFor="dark"
                              className="font-medium cursor-pointer text-base"
                            >
                              Dark Mode
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Easy on the eyes in low light
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* System Theme */}
                  <Card
                    className={`cursor-pointer transition-all border-2 ${
                      theme === "system"
                        ? "border-plant-primary bg-plant-primary/5 dark:bg-plant-primary/10"
                        : "border-border hover:border-plant-primary/50"
                    }`}
                    onClick={() => setTheme("system")}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="system" id="system" />
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200 flex items-center justify-center">
                            <Monitor className="w-5 h-5 text-purple-700" />
                          </div>
                          <div>
                            <Label
                              htmlFor="system"
                              className="font-medium cursor-pointer text-base"
                            >
                              System Default
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Follow your device's theme setting
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </RadioGroup>
            </div>
          </CascadingContainer>
        </CardContent>
      </Card>
    </div>
  );
};
