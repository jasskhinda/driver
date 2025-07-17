/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Design system colors
        'primary': '#3B5B63',         // Dark teal
        'secondary': '#84CED3',       // Light teal
        'background': '#FFFFFF',      // White
        'surface': '#F5F7F8',         // Very light grey
        'on-primary': '#FFFFFF',      // White text on primary
        'on-secondary': '#3B5B63',    // Text on light teal
        'disabled': '#B0BEC5',        // Muted grey
        
        // Dark mode colors
        'dark-primary': '#84CED3',    // Light teal (accent on dark)
        'dark-secondary': '#3B5B63',  // Dark teal
        'dark-background': '#121212', // Dark background
        'dark-surface': '#1E1E1E',    // Slightly lighter than background
        'dark-on-primary': '#121212', // Dark text on light teal
        'dark-on-secondary': '#FFFFFF', // White text on dark teal
        'dark-disabled': '#666C6F',   // Muted grey
      },
    },
  },
  plugins: [],
};