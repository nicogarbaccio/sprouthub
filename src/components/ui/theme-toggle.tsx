import { Moon, Sun, Monitor, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/contexts/ThemeContext";

export function ThemeToggle() {
 const { theme, setTheme } = useTheme();

 return (
 <DropdownMenu>
  <DropdownMenuTrigger asChild>
  <Button
   variant="ghost"
   size="icon"
   className="relative h-9 w-9 rounded-full bg-transparent dark:bg-transparent border border-sprout-light/40 dark:border-sprout-cream hover:bg-sprout-light/20 dark:hover:bg-sprout-medium/20 focus-visible:ring-0 focus-visible:ring-offset-0 transition-all duration-200"
   data-testid="theme-toggle"
  >
   <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-sprout-primary dark:text-sprout-warning" />
   <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-sprout-primary dark:text-sprout-white" />
   <span className="sr-only">Toggle theme</span>
  </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent
  align="end"
  className="bg-background dark:bg-sprout-dark border-sprout-light/40 dark:border-sprout-cream/30"
  >
  <DropdownMenuItem
   onClick={() => setTheme("light")}
   className="hover:bg-sprout-light/20 dark:hover:bg-sprout-medium/20 text-foreground dark:text-sprout-cream cursor-pointer"
  >
   <Sun className="mr-2 h-4 w-4 text-sprout-primary dark:text-sprout-warning" />
   <span className="flex-1">Light</span>
   {theme === "light" && (
   <Check className="ml-2 h-4 w-4 text-sprout-primary dark:text-sprout-warning" />
   )}
  </DropdownMenuItem>
  <DropdownMenuItem
   onClick={() => setTheme("dark")}
   className="hover:bg-sprout-light/20 dark:hover:bg-sprout-medium/20 text-foreground dark:text-sprout-cream cursor-pointer"
  >
   <Moon className="mr-2 h-4 w-4 text-sprout-primary dark:text-sprout-white" />
   <span className="flex-1">Dark</span>
   {theme === "dark" && (
   <Check className="ml-2 h-4 w-4 text-sprout-primary dark:text-sprout-white" />
   )}
  </DropdownMenuItem>
  <DropdownMenuItem
   onClick={() => setTheme("system")}
   className="hover:bg-sprout-light/20 dark:hover:bg-sprout-medium/20 text-foreground dark:text-sprout-cream cursor-pointer"
  >
   <Monitor className="mr-2 h-4 w-4 text-sprout-medium dark:text-sprout-light" />
   <span className="flex-1">System</span>
   {theme === "system" && (
   <Check className="ml-2 h-4 w-4 text-sprout-medium dark:text-sprout-light" />
   )}
  </DropdownMenuItem>
  </DropdownMenuContent>
 </DropdownMenu>
 );
}

export function SimpleThemeToggle() {
 const { actualTheme, setTheme } = useTheme();

 const toggleTheme = () => {
 setTheme(actualTheme === "dark" ? "light" : "dark");
 };

 return (
 <Button
  variant="ghost"
  size="icon"
  onClick={toggleTheme}
  className="relative h-9 w-9 rounded-full bg-transparent dark:bg-transparent border border-sprout-light/40 dark:border-sprout-cream hover:bg-sprout-light/20 dark:hover:bg-sprout-medium/20 focus-visible:ring-0 focus-visible:ring-offset-0 transition-all duration-200"
  data-testid="simple-theme-toggle"
 >
  <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-sprout-primary dark:text-sprout-warning" />
  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-sprout-primary dark:text-sprout-white" />
  <span className="sr-only">Toggle theme</span>
 </Button>
 );
}
