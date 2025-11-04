import { cn } from "@/lib/utils";

// Glassmorphism utility classes and configurations
export const glassmorphismStyles = {
  // Main dialog container with glassmorphism effect
  dialogContainer: "backdrop-blur-3xl bg-white/90 dark:bg-slate-900/90 border-white/20 shadow-2xl shadow-black/10 dark:shadow-black/30",
  
  // Header with gradient glassmorphism
  dialogHeader: "backdrop-blur-2xl bg-gradient-to-br from-indigo-500/80 via-purple-600/80 to-pink-500/80 border-b border-white/20 text-white shadow-lg",
  
  // Card sections with subtle glassmorphism
  cardGlass: "backdrop-blur-xl bg-white/60 dark:bg-slate-800/60 border border-white/30 dark:border-slate-600/30 shadow-lg shadow-black/5 dark:shadow-black/20",
  
  // Form sections with lighter glassmorphism
  formSection: "backdrop-blur-lg bg-white/40 dark:bg-slate-800/40 border border-white/20 dark:border-slate-600/20 rounded-xl shadow-md",
  
  // Input fields with subtle glassmorphism
  inputGlass: "backdrop-blur-sm bg-white/70 dark:bg-slate-800/70 border-white/40 dark:border-slate-600/40 focus:border-indigo-400/60 focus:ring-indigo-400/30",
  
  // Button variants with glassmorphism
  buttonGlass: "backdrop-blur-lg bg-white/20 hover:bg-white/30 border border-white/30 hover:border-white/40 text-gray-700 dark:text-gray-200",
  buttonPrimary: "backdrop-blur-lg bg-gradient-to-r from-indigo-500/90 to-purple-600/90 hover:from-indigo-600/90 hover:to-purple-700/90 border border-white/20 text-white shadow-lg",
  buttonSecondary: "backdrop-blur-lg bg-white/30 hover:bg-white/40 border border-white/40 text-gray-700 dark:text-gray-200",
  
  // Floating elements
  floatingCard: "backdrop-blur-2xl bg-white/30 dark:bg-slate-800/30 border border-white/20 dark:border-slate-600/20 shadow-2xl shadow-black/10 dark:shadow-black/30",
  
  // Scroll area with glassmorphism
  scrollArea: "backdrop-blur-sm bg-white/20 dark:bg-slate-800/20",
  
  // Footer section
  footer: "backdrop-blur-xl bg-white/50 dark:bg-slate-800/50 border-t border-white/20 dark:border-slate-600/20",
};

// Animation classes for glassmorphism elements
export const glassmorphismAnimations = {
  fadeIn: "animate-in fade-in-0 duration-300",
  slideIn: "animate-in slide-in-from-bottom-4 duration-300",
  scaleIn: "animate-in scale-in-95 duration-200",
  glowEffect: "transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/20",
};

// Responsive breakpoints for glassmorphism components
export const glassmorphismResponsive = {
  // Dialog sizes - improved for better responsiveness
  dialogSm: "w-[90vw] max-w-md",
  dialogMd: "w-[95vw] max-w-3xl", 
  dialogLg: "w-[95vw] max-w-5xl",
  dialogXl: "w-[95vw] max-w-6xl",
  dialogFull: "w-[95vw] max-w-7xl h-[95vh]",
  
  // Grid layouts
  gridResponsive: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
  gridForm: "grid-cols-1 xl:grid-cols-2",
  
  // Spacing
  paddingResponsive: "p-3 md:p-4 lg:p-6",
  marginResponsive: "space-y-3 md:space-y-4 lg:space-y-6",
  
  // Heights
  dialogHeight: "max-h-[90vh] md:max-h-[95vh]",
  scrollHeight: "h-full max-h-[calc(90vh-8rem)] md:max-h-[calc(95vh-10rem)]",
};

// Helper function to combine glassmorphism styles
export function createGlassmorphismClass(...styles: string[]) {
  return cn(...styles);
}

// Preset combinations for common use cases
export const glassmorphismPresets = {
  // Main form dialog
  formDialog: createGlassmorphismClass(
    glassmorphismStyles.dialogContainer,
    glassmorphismResponsive.dialogLg,
    glassmorphismAnimations.fadeIn
  ),
  
  // Form header
  formHeader: createGlassmorphismClass(
    glassmorphismStyles.dialogHeader,
    glassmorphismResponsive.paddingResponsive
  ),
  
  // Form card section
  formCard: createGlassmorphismClass(
    glassmorphismStyles.cardGlass,
    "rounded-xl",
    glassmorphismAnimations.glowEffect
  ),
  
  // Form input
  formInput: createGlassmorphismClass(
    glassmorphismStyles.inputGlass,
    "transition-all duration-200"
  ),
  
  // Primary button
  primaryButton: createGlassmorphismClass(
    glassmorphismStyles.buttonPrimary,
    glassmorphismAnimations.glowEffect
  ),
  
  // Secondary button
  secondaryButton: createGlassmorphismClass(
    glassmorphismStyles.buttonSecondary,
    glassmorphismAnimations.glowEffect
  ),
  
  // Footer section
  formFooter: createGlassmorphismClass(
    glassmorphismStyles.footer,
    glassmorphismResponsive.paddingResponsive
  ),
};

// Color schemes for different form types
export const glassmorphismColorSchemes = {
  certification: {
    gradient: "from-emerald-500/80 via-teal-600/80 to-cyan-500/80",
    accent: "emerald-500",
    border: "emerald-400/60",
  },
  
  bookChapter: {
    gradient: "from-violet-500/80 via-purple-600/80 to-indigo-500/80", 
    accent: "violet-500",
    border: "violet-400/60",
  },
  
  fdp: {
    gradient: "from-blue-500/80 via-indigo-600/80 to-purple-500/80",
    accent: "blue-500", 
    border: "blue-400/60",
  },
  
  grant: {
    gradient: "from-orange-500/80 via-red-600/80 to-pink-500/80",
    accent: "orange-500",
    border: "orange-400/60",
  },
  
  conference: {
    gradient: "from-green-500/80 via-emerald-600/80 to-teal-500/80",
    accent: "green-500",
    border: "green-400/60",
  },
  
  copyright: {
    gradient: "from-pink-500/80 via-rose-600/80 to-red-500/80",
    accent: "pink-500",
    border: "pink-400/60",
  },
  
  journal: {
    gradient: "from-cyan-500/80 via-blue-600/80 to-indigo-500/80",
    accent: "cyan-500",
    border: "cyan-400/60",
  },
  
  patent: {
    gradient: "from-yellow-500/80 via-orange-600/80 to-red-500/80",
    accent: "yellow-500",
    border: "yellow-400/60",
  },
  
  transaction: {
    gradient: "from-slate-500/80 via-gray-600/80 to-zinc-500/80",
    accent: "slate-500",
    border: "slate-400/60",
  },
};