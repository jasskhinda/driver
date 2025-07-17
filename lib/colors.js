// Color system utilities
export const colors = {
  // Base colors
  primary: 'bg-primary text-on-primary dark:bg-dark-primary dark:text-dark-on-primary',
  secondary: 'bg-secondary text-on-secondary dark:bg-dark-secondary dark:text-dark-on-secondary',
  
  // Backgrounds
  background: 'bg-background dark:bg-dark-background',
  surface: 'bg-surface dark:bg-dark-surface',
  
  // Text colors
  textPrimary: 'text-primary dark:text-dark-primary',
  textSecondary: 'text-on-secondary dark:text-dark-on-secondary',
  textOnPrimary: 'text-on-primary dark:text-dark-on-primary',
  textDisabled: 'text-disabled dark:text-dark-disabled',
  
  // Borders
  border: 'border-disabled dark:border-dark-disabled',
  borderLight: 'border-surface dark:border-dark-surface',
  
  // Interactive elements
  buttonPrimary: 'bg-secondary hover:bg-secondary/90 text-on-secondary dark:bg-dark-primary dark:hover:bg-dark-primary/90 dark:text-dark-on-primary',
  buttonSecondary: 'bg-surface hover:bg-disabled/20 text-primary dark:bg-dark-surface dark:hover:bg-dark-disabled/20 dark:text-dark-primary',
  
  // Status colors (keeping existing)
  success: 'bg-green-500 text-white',
  error: 'bg-red-500 text-white',
  warning: 'bg-yellow-500 text-white',
  info: 'bg-blue-500 text-white',
};

// Color replacements mapping
export const colorReplacements = {
  // Old -> New mappings
  '#2E4F54': 'primary',
  '#7CCFD0': 'secondary',
  '#F8F9FA': 'surface',
  '#DDE5E7': 'disabled',
  '#E0F4F5': 'dark-primary',
  '#1C2C2F': 'dark-surface',
  '#24393C': 'dark-surface',
  '#3F5E63': 'dark-secondary',
  '#60BFC0': 'secondary',
};