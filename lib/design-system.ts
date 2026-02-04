export const designSystem = {
  spacing: {
    xs: '0.5rem',   // 8px
    sm: '1rem',     // 16px
    md: '1.5rem',   // 24px
    lg: '2rem',     // 32px
    xl: '3rem',     // 48px
    '2xl': '4rem',  // 64px
  },
  
  typography: {
    h1: 'text-4xl font-bold text-deep-teal',
    h2: 'text-2xl font-semibold text-deep-teal',
    h3: 'text-xl font-medium text-deep-teal',
    h4: 'text-lg font-medium text-deep-teal',
    body: 'text-base font-normal text-dark-text',
    bodyMuted: 'text-base font-normal text-slate-blue',
    small: 'text-sm text-slate-blue',
    caption: 'text-xs text-slate-blue',
    label: 'text-sm font-medium text-dark-text',
  },
  
  iconSizes: {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8',
    '2xl': 'h-10 w-10',
  },
  
  shadows: {
    card: 'shadow-sm hover:shadow-md transition-shadow',
    cardHover: 'shadow-md hover:shadow-lg transition-shadow',
    dialog: 'shadow-xl',
    elevated: 'shadow-lg',
  },
  
  animations: {
    fast: 'duration-150',
    normal: 'duration-200',
    slow: 'duration-300',
  },

  semanticColors: {
    success: 'bg-green-100 text-green-800 border-green-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    inactive: 'bg-gray-100 text-gray-800 border-gray-200',
  },

  borderRadius: {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  },

  transitions: {
    default: 'transition-all duration-200 ease-in-out',
    fast: 'transition-all duration-150 ease-in-out',
    slow: 'transition-all duration-300 ease-in-out',
  },

  verticalSpacing: {
    section: 'space-y-12',      // Between major sections
    subsection: 'space-y-8',     // Between subsections
    group: 'space-y-6',         // Between related groups
    items: 'space-y-4',         // Between list items
    fields: 'space-y-3',        // Between form fields
    tight: 'space-y-2',         // Tightly related items
  },
} as const

// Legacy exports for backward compatibility
export const spacing = designSystem.spacing
export const iconSizes = designSystem.iconSizes
export const animations = designSystem.animations
export const shadows = designSystem.shadows
export const borderRadius = designSystem.borderRadius
export const transitions = designSystem.transitions
