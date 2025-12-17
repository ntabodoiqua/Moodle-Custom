/**
 * Main theme configuration for IELTS application
 * Combines colors, typography, spacing, and other design tokens
 */

import { colors, brandColors } from "./colors";
import {
  fonts,
  fontSizes,
  fontWeights,
  lineHeights,
  letterSpacings,
  typography,
} from "./typography";
import { spacing, borderRadius, shadows, transitions, zIndex } from "./spacing";

export const theme = {
  colors,
  brandColors,
  fonts,
  fontSizes,
  fontWeights,
  lineHeights,
  letterSpacings,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  zIndex,
} as const;

// Type for the theme
export type Theme = typeof theme;

// Export everything for convenience
export * from "./colors";
export * from "./typography";
export * from "./spacing";

// Default export
export default theme;
