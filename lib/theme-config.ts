import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Helper function to merge Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Define the application's color palette
export const colorPalette = {
  primary: {
    light: "#0284c7", // sky-600
    dark: "#0ea5e9", // sky-500
  },
  secondary: {
    light: "#6366f1", // indigo-500
    dark: "#818cf8", // indigo-400
  },
  accent: {
    light: "#8b5cf6", // violet-500
    dark: "#a78bfa", // violet-400
  },
  success: {
    light: "#16a34a", // green-600
    dark: "#22c55e", // green-500
  },
  warning: {
    light: "#ca8a04", // yellow-600
    dark: "#eab308", // yellow-500
  },
  error: {
    light: "#dc2626", // red-600
    dark: "#ef4444", // red-500
  },
  info: {
    light: "#2563eb", // blue-600
    dark: "#3b82f6", // blue-500
  },
  neutral: {
    50: "#f8fafc", // slate-50
    100: "#f1f5f9", // slate-100
    200: "#e2e8f0", // slate-200
    300: "#cbd5e1", // slate-300
    400: "#94a3b8", // slate-400
    500: "#64748b", // slate-500
    600: "#475569", // slate-600
    700: "#334155", // slate-700
    800: "#1e293b", // slate-800
    900: "#0f172a", // slate-900
    950: "#020617", // slate-950
  },
}

// Light theme background and text colors
export const lightThemeColors = {
  background: "bg-white",
  foreground: "text-slate-900",
  muted: "bg-slate-100",
  mutedForeground: "text-slate-500",
  card: "bg-white",
  cardForeground: "text-slate-900",
  popover: "bg-white",
  popoverForeground: "text-slate-900",
  border: "border-slate-200",
  input: "bg-white border-slate-300",
  primary: "bg-sky-600",
  primaryForeground: "text-white",
  secondary: "bg-slate-100",
  secondaryForeground: "text-slate-900",
  accent: "bg-slate-100",
  accentForeground: "text-slate-900",
  destructive: "bg-red-600",
  destructiveForeground: "text-white",
  ring: "ring-slate-300",
}

// Category color mapping
export const categoryColors = {
  faith: {
    light: {
      bg: "bg-blue-600",
      text: "text-blue-600",
      border: "border-blue-600",
      hover: "hover:bg-blue-700",
      icon: "text-white",
      lightBg: "bg-blue-50",
    },
    dark: {
      bg: "bg-blue-500",
      text: "text-blue-500",
      border: "border-blue-500",
      hover: "hover:bg-blue-600",
      icon: "text-white",
      lightBg: "bg-blue-900",
    },
  },
  life: {
    light: {
      bg: "bg-yellow-600",
      text: "text-yellow-600",
      border: "border-yellow-600",
      hover: "hover:bg-yellow-700",
      icon: "text-white",
      lightBg: "bg-yellow-50",
    },
    dark: {
      bg: "bg-yellow-500",
      text: "text-yellow-500",
      border: "border-yellow-500",
      hover: "hover:bg-yellow-600",
      icon: "text-white",
      lightBg: "bg-yellow-900",
    },
  },
  work: {
    light: {
      bg: "bg-red-600",
      text: "text-red-600",
      border: "border-red-600",
      hover: "hover:bg-red-700",
      icon: "text-white",
      lightBg: "bg-red-50",
    },
    dark: {
      bg: "bg-red-500",
      text: "text-red-500",
      border: "border-red-500",
      hover: "hover:bg-red-600",
      icon: "text-white",
      lightBg: "bg-red-900",
    },
  },
  health: {
    light: {
      bg: "bg-green-600",
      text: "text-green-600",
      border: "border-green-600",
      hover: "hover:bg-green-700",
      icon: "text-white",
      lightBg: "bg-green-50",
    },
    dark: {
      bg: "bg-green-500",
      text: "text-green-500",
      border: "border-green-500",
      hover: "hover:bg-green-600",
      icon: "text-white",
      lightBg: "bg-green-900",
    },
  },
  mindfulness: {
    light: {
      bg: "bg-purple-600",
      text: "text-purple-600",
      border: "border-purple-600",
      hover: "hover:bg-purple-700",
      icon: "text-white",
      lightBg: "bg-purple-50",
    },
    dark: {
      bg: "bg-purple-500",
      text: "text-purple-500",
      border: "border-purple-500",
      hover: "hover:bg-purple-600",
      icon: "text-white",
      lightBg: "bg-purple-900",
    },
  },
  learning: {
    light: {
      bg: "bg-indigo-600",
      text: "text-indigo-600",
      border: "border-indigo-600",
      hover: "hover:bg-indigo-700",
      icon: "text-white",
      lightBg: "bg-indigo-50",
    },
    dark: {
      bg: "bg-indigo-500",
      text: "text-indigo-500",
      border: "border-indigo-500",
      hover: "hover:bg-indigo-600",
      icon: "text-white",
      lightBg: "bg-indigo-900",
    },
  },
  relationships: {
    light: {
      bg: "bg-pink-600",
      text: "text-pink-600",
      border: "border-pink-600",
      hover: "hover:bg-pink-700",
      icon: "text-white",
      lightBg: "bg-pink-50",
    },
    dark: {
      bg: "bg-pink-500",
      text: "text-pink-500",
      border: "border-pink-500",
      hover: "hover:bg-pink-600",
      icon: "text-white",
      lightBg: "bg-pink-900",
    },
  },
}

// Status colors
export const statusColors = {
  success: {
    light: {
      bg: "bg-green-100",
      text: "text-green-800",
      border: "border-green-200",
      icon: "text-green-600",
    },
    dark: {
      bg: "bg-green-900",
      text: "text-green-100",
      border: "border-green-800",
      icon: "text-green-400",
    },
  },
  warning: {
    light: {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      border: "border-yellow-200",
      icon: "text-yellow-600",
    },
    dark: {
      bg: "bg-yellow-900",
      text: "text-yellow-100",
      border: "border-yellow-800",
      icon: "text-yellow-400",
    },
  },
  error: {
    light: {
      bg: "bg-red-100",
      text: "text-red-800",
      border: "border-red-200",
      icon: "text-red-600",
    },
    dark: {
      bg: "bg-red-900",
      text: "text-red-100",
      border: "border-red-800",
      icon: "text-red-400",
    },
  },
  info: {
    light: {
      bg: "bg-blue-100",
      text: "text-blue-800",
      border: "border-blue-200",
      icon: "text-blue-600",
    },
    dark: {
      bg: "bg-blue-900",
      text: "text-blue-100",
      border: "border-blue-800",
      icon: "text-blue-400",
    },
  },
}

// Button variants
export const buttonVariants = {
  primary: {
    light: "bg-sky-600 text-white hover:bg-sky-700 focus:ring-sky-500",
    dark: "bg-sky-500 text-white hover:bg-sky-600 focus:ring-sky-400",
  },
  secondary: {
    light: "bg-slate-200 text-slate-900 hover:bg-slate-300 focus:ring-slate-500",
    dark: "bg-slate-700 text-slate-100 hover:bg-slate-600 focus:ring-slate-400",
  },
  outline: {
    light: "border-2 border-slate-300 text-slate-900 hover:bg-slate-100 focus:ring-slate-500",
    dark: "border-2 border-slate-600 text-slate-100 hover:bg-slate-700 focus:ring-slate-400",
  },
  ghost: {
    light: "text-slate-900 hover:bg-slate-100 focus:ring-slate-500",
    dark: "text-slate-100 hover:bg-slate-800 focus:ring-slate-400",
  },
  destructive: {
    light: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    dark: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-400",
  },
  success: {
    light: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
    dark: "bg-green-500 text-white hover:bg-green-600 focus:ring-green-400",
  },
  warning: {
    light: "bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500",
    dark: "bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-400",
  },
  info: {
    light: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    dark: "bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-400",
  },
}

// Icon sizes
export const iconSizes = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
  xl: "h-8 w-8",
  "2xl": "h-10 w-10",
}

// Icon colors
export const iconColors = {
  slate: "text-slate-600 dark:text-slate-400",
  gray: "text-gray-600 dark:text-gray-400",
  zinc: "text-zinc-600 dark:text-zinc-400",
  neutral: "text-neutral-600 dark:text-neutral-400",
  stone: "text-stone-600 dark:text-stone-400",
  red: "text-red-600 dark:text-red-500",
  orange: "text-orange-600 dark:text-orange-500",
  amber: "text-amber-600 dark:text-amber-500",
  yellow: "text-yellow-600 dark:text-yellow-500",
  lime: "text-lime-600 dark:text-lime-500",
  green: "text-green-600 dark:text-green-500",
  emerald: "text-emerald-600 dark:text-emerald-500",
  teal: "text-teal-600 dark:text-teal-500",
  cyan: "text-cyan-600 dark:text-cyan-500",
  sky: "text-sky-600 dark:text-sky-500",
  blue: "text-blue-600 dark:text-blue-500",
  indigo: "text-indigo-600 dark:text-indigo-500",
  violet: "text-violet-600 dark:text-violet-500",
  purple: "text-purple-600 dark:text-purple-500",
  fuchsia: "text-fuchsia-600 dark:text-fuchsia-500",
  pink: "text-pink-600 dark:text-pink-500",
  rose: "text-rose-600 dark:text-rose-500",
}

// Icon background colors
export const iconBackgroundColors = {
  slate: "bg-slate-100 dark:bg-slate-800",
  gray: "bg-gray-100 dark:bg-gray-800",
  zinc: "bg-zinc-100 dark:bg-zinc-800",
  neutral: "bg-neutral-100 dark:bg-neutral-800",
  stone: "bg-stone-100 dark:bg-stone-800",
  red: "bg-red-100 dark:bg-red-900",
  orange: "bg-orange-100 dark:bg-orange-900",
  amber: "bg-amber-100 dark:bg-amber-900",
  yellow: "bg-yellow-100 dark:bg-yellow-900",
  lime: "bg-lime-100 dark:bg-lime-900",
  green: "bg-green-100 dark:bg-green-900",
  emerald: "bg-emerald-100 dark:bg-emerald-900",
  teal: "bg-teal-100 dark:bg-teal-900",
  cyan: "bg-cyan-100 dark:bg-cyan-900",
  sky: "bg-sky-100 dark:bg-sky-900",
  blue: "bg-blue-100 dark:bg-blue-900",
  indigo: "bg-indigo-100 dark:bg-indigo-900",
  violet: "bg-violet-100 dark:bg-violet-900",
  purple: "bg-purple-100 dark:bg-purple-900",
  fuchsia: "bg-fuchsia-100 dark:bg-fuchsia-900",
  pink: "bg-pink-100 dark:bg-pink-900",
  rose: "bg-rose-100 dark:bg-rose-900",
}
