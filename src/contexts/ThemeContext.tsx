import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { storage } from "@/utils/storage";

type Theme = "light" | "dark" | "system";

interface ThemeProviderProps {
 children: React.ReactNode;
 defaultTheme?: Theme;
 storageKey?: string;
}

interface ThemeProviderState {
 theme: Theme;
 setTheme: (theme: Theme) => void;
 actualTheme: "light" | "dark"; // The resolved theme (without 'system')
}

const initialState: ThemeProviderState = {
 theme: "system",
 setTheme: () => null,
 actualTheme: "light",
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
 children,
 defaultTheme = "system",
 storageKey = "sprouthub-ui-theme",
 ...props
}: ThemeProviderProps) {
 const [theme, setTheme] = useState<Theme>(
 () => (storage.getItem<Theme>(storageKey) as Theme) || defaultTheme
 );
 const [actualTheme, setActualTheme] = useState<"light" | "dark">("light");

 useEffect(() => {
 const root = window.document.documentElement;

 root.classList.remove("light", "dark");

 let resolvedTheme: "light" | "dark";

 if (theme === "system") {
  resolvedTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
  ? "dark"
  : "light";
 } else {
  resolvedTheme = theme;
 }

 root.classList.add(resolvedTheme);
 setActualTheme(resolvedTheme);
 }, [theme]);

 useEffect(() => {
 const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

 const handleChange = () => {
  if (theme === "system") {
  const resolvedTheme = mediaQuery.matches ? "dark" : "light";
  document.documentElement.classList.remove("light", "dark");
  document.documentElement.classList.add(resolvedTheme);
  setActualTheme(resolvedTheme);
  }
 };

 mediaQuery.addEventListener("change", handleChange);
 return () => mediaQuery.removeEventListener("change", handleChange);
 }, [theme]);

 const stableSetTheme = useCallback((newTheme: Theme) => {
  storage.setItem(storageKey, newTheme);
  setTheme(newTheme);
 }, [storageKey]);

 const value = useMemo(() => ({
 theme,
 setTheme: stableSetTheme,
 actualTheme,
 }), [theme, stableSetTheme, actualTheme]);

 return (
 <ThemeProviderContext.Provider {...props} value={value}>
  {children}
 </ThemeProviderContext.Provider>
 );
}

export const useTheme = () => {
 const context = useContext(ThemeProviderContext);

 if (context === undefined)
 throw new Error("useTheme must be used within a ThemeProvider");

 return context;
};
