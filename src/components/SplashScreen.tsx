import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Web-based splash screen shown briefly on app launch (PWA/browser).
 * Shows the logo with a fade-in, then fades out to reveal the app.
 * Only shows once per session.
 */
// Match Tailwind's lg breakpoint
const isMobile = () =>
  typeof window !== "undefined" && window.innerWidth < 1024;

export const SplashScreen = () => {
  const [visible, setVisible] = useState(() => {
    // Only show on mobile, once per session
    if (!isMobile()) return false;
    if (sessionStorage.getItem("splash-shown")) return false;
    sessionStorage.setItem("splash-shown", "1");
    return true;
  });

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setVisible(false), 1200);
    return () => clearTimeout(timer);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-sprout-primary"
        >
          <motion.img
            src="/LogoDark.svg"
            alt="sprouthub"
            className="h-20 w-auto mb-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          />
          <motion.span
            className="text-3xl font-bold text-sprout-cream"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            sprouthub
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
