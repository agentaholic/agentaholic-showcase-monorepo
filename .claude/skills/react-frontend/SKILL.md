---
name: react-frontend
description: Use when working on React components, routing, frontend architecture, or UI patterns.
---

## Frontend Stack

- **React 19** with **React Router v7** for routing
- **Vite** for build tooling and dev server
- **TailwindCSS** for styling with **Subframe** components
- **Tanstack Query** for data fetching and caching
- **Wagmi** for Web3 wallet integration
- **TypeScript** with strict configuration

## Frontend Architecture

- React components in `src/app/` with screens-based organization
- UI components from Subframe in `src/ui/`
- Contexts for state management in `src/contexts/`
- Main entry point: `src/app/main.tsx`

## React Router Configuration

The application uses React Router v7 for client-side routing with the following structure:

### Router Setup

- **BrowserRouter initialization**: Configured in `src/app/main.tsx` as the root router wrapper
- **Route definitions**: All application routes are centrally defined in `src/app/AppRoutes.tsx`
- **Screen components**: Located in `src/app/screens/` directory

### Navigation Patterns

- Use `useNavigate()` hook from `react-router` for programmatic navigation
- Use `useParams()` hook to access URL parameters
- Routes are wrapped in `TabBarLayout` for authenticated sections of the app

## Component Organization

### Screen Components

Screen components represent full pages/routes and should:

- Be located in `src/app/screens/`
- Use PascalCase naming (e.g., `LoginScreen.tsx`, `DashboardScreen.tsx`)
- Handle page-level logic and data fetching
- Compose smaller UI components

### UI Components

Reusable UI components should:

- Be located in `src/ui/` (from Subframe)
- Follow the Subframe component patterns
- Be presentational and reusable

### Context Providers

State management contexts should:

- Be located in `src/contexts/`
- Use camelCase folder naming (e.g., `walletConnection/`)
- Export both the context and provider
- Use TypeScript for type safety

## Development Patterns

### TypeScript Configuration

- Strict mode enabled
- All imports must use absolute paths with `~src` alias
- No relative imports allowed (enforced by ESLint)

### Styling

- Use TailwindCSS utility classes
- Leverage Subframe components for consistent design
- Follow the project's design system

### State Management

- Use React Context for global state
- Use Tanstack Query for server state (see frontend-api skill)
- Keep component state local when possible
