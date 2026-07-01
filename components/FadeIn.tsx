"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}

// Reduced-motion handling comes from <MotionConfig reducedMotion="user"> in layout.tsx,
// not a branch here — branching on useReducedMotion() renders different DOM on the
// server (no window) vs. the client's first paint and breaks hydration.
export function FadeIn({ children, delay = 0, y = 16, className }: FadeInProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
