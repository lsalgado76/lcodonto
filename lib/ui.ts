// Shared micro-interaction for pill/CTA buttons: scale(1.02)+brightness(1.05) on
// hover, scale(0.98) on press, 150ms. Reduced motion still gets the transition
// (it's just a transform/filter), but duration collapses via the global
// prefers-reduced-motion override in globals.css.
export const BUTTON_MICRO =
  "transition-[transform,background-color,border-color,color,filter] duration-150 ease-out hover:scale-[1.02] hover:brightness-105 active:scale-[0.98]";
