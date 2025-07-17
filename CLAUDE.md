# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands
- Dev: `npm run dev` (uses Next.js with Turbopack)
- Build: `npm run build`
- Start: `npm run start` (for production builds)
- Lint: `npm run lint`
- Test: `npm run test` or `playwright test`
- Test UI: `npm run test:ui` (opens Playwright test UI)
- Single test: `playwright test tests/e2e/filename.spec.js`

## Code Style Guidelines
- **JavaScript**: Modern ES6+ features, functional components for React
- **Formatting**: Consistent indentation with 2 spaces
- **Imports**: Group imports (1. React/Next, 2. External libraries, 3. Internal modules)
- **Naming**: camelCase for variables/functions, PascalCase for components/classes
- **Error Handling**: Use try/catch blocks with proper error logging
- **Component Structure**: Functional components with hooks, prefer composition
- **File Organization**: Group related files in directories
- **Path Aliases**: Use @/* as configured in jsconfig.json

## Best Practices
- Use TailwindCSS for styling
- Follow Next.js App Router conventions and best practices
- Keep components small and focused on a single responsibility

## Architecture

### Database (Supabase)
- **Tables**: `trips` (bookings), `profiles` (user data with roles)
- **Auth**: Supabase Auth with email/password and Google OAuth
- **RLS**: Row-level security policies for data access control
- **Roles**: client, driver, dispatcher (stored in profiles.role)

### Key Integrations
- **Stripe**: Payment method management via `/api/stripe/*` routes
- **Google Maps**: Places Autocomplete and Directions API for trip planning
- **Email**: Nodemailer for dispatcher notifications

### API Routes Structure
- `/api/auth/*` - Authentication endpoints
- `/api/stripe/*` - Payment processing
- `/api/trips/*` - Trip management and notifications

### Component Patterns
- Server Components by default, Client Components with 'use client'
- Form components handle their own submission logic
- Dashboard pages fetch data server-side using createServerComponentClient
- Middleware handles authentication redirects

## Database Credentials

NEXT_PUBLIC_SUPABASE_URL=https://btzfgasugkycbavcwvnx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0emZnYXN1Z2t5Y2JhdmN3dm54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2MzcwOTIsImV4cCI6MjA2MDIxMzA5Mn0.FQtQXKvkBLVtmCqShLyg_y9EDPrufyWQnbD8EE25zSU

## Color Palette

Light Mode: {
  "primary": "#3B5B63",         // Dark teal (used in text and outlines)
  "secondary": "#84CED3",       // Light teal (used in windows and heart)
  "background": "#FFFFFF",      // White
  "surface": "#F5F7F8",         // Very light grey
  "onPrimary": "#FFFFFF",       // White text on primary
  "onSecondary": "#3B5B63",     // Text on light teal
  "disabled": "#B0BEC5"         // Muted grey
}

Dark mode: {
  "primary": "#84CED3",         // Light teal (accent color on dark)
  "secondary": "#3B5B63",       // Dark teal
  "background": "#121212",      // Dark background
  "surface": "#1E1E1E",         // Slightly lighter than background
  "onPrimary": "#121212",       // Dark text on light teal
  "onSecondary": "#FFFFFF",     // White text on dark teal
  "disabled": "#666C6F"         // Muted grey
}