# Creative Portfolio - Tech meets Art

## Overview

This is a full-stack creative portfolio application that showcases both technical and artistic projects. Built with React, TypeScript, and Express, it features a dynamic content management system for displaying web development projects, digital art, photography, traditional art, creative writing, and more. The application includes an admin authentication system for content management and supports private/public content visibility.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server
- React Router for client-side routing and navigation
- SWC plugin for faster compilation

**UI Component System**
- Radix UI primitives for accessible, unstyled components
- shadcn/ui component library with Tailwind CSS styling
- Custom design system with tech/art/gaming themed color schemes
- Responsive design with mobile-first approach using custom breakpoints

**State Management**
- React Context API for global state (AdminContext, DataContext)
- TanStack Query (React Query) for server state management
- Local component state with useState/useReducer hooks

**Styling Approach**
- Tailwind CSS for utility-first styling
- CSS custom properties for theme variables
- Custom CSS files for specialized components (creative-writing.css, semantic-helpers.css)
- Dark mode support via next-themes

### Backend Architecture

**Server Framework**
- Express.js server with TypeScript
- Middleware for JSON parsing, URL encoding, and request logging
- RESTful API design pattern for CRUD operations

**Data Layer**
- Drizzle ORM for database interactions
- PostgreSQL as the primary database (via Neon serverless)
- In-memory storage fallback (MemStorage) for development/testing
- Schema validation using Zod

**API Structure**
- `/api/projects` - Project CRUD endpoints with category filtering
- `/api/gallery` - Gallery item management
- `/api/cv` - CV/resume upload and retrieval
- `/api/writings` - Creative writing pieces management
- `/api/albums` - Album/collection organization
- `/api/tags` - Tag management system

### Authentication & Authorization

**Admin System**
- Simple credential-based authentication (username/password)
- Session persistence via localStorage
- Context-based auth state management
- Protected routes and conditional UI rendering based on admin status

### External Dependencies

**Core Libraries**
- `react` & `react-dom` - UI framework
- `express` - Backend server framework
- `drizzle-orm` - Database ORM
- `@neondatabase/serverless` - PostgreSQL connection pooling
- `zod` - Schema validation
- `react-router-dom` - Client-side routing
- `@tanstack/react-query` - Server state management

**UI Components**
- `@radix-ui/*` - Accessible UI primitives (dialogs, dropdowns, tabs, etc.)
- `lucide-react` - Icon library
- `tailwindcss` - Utility-first CSS framework
- `class-variance-authority` - Component variant styling
- `embla-carousel-react` - Carousel functionality

**Form Handling**
- `react-hook-form` - Form state management
- `@hookform/resolvers` - Form validation resolvers

**PDF Handling**
- `pdfjs-dist` - PDF rendering and viewing

**Development Tools**
- `vite` - Build tool and dev server
- `typescript` - Type safety
- `eslint` - Code linting
- `drizzle-kit` - Database migration tool

**Database**
- PostgreSQL (via Neon serverless platform)
- Connection string configured via `DATABASE_URL` environment variable
- WebSocket support for serverless connections

**File Storage**
- Google Cloud Storage for social media images and assets
- Local storage fallback for development

### Key Design Patterns

**Component Organization**
- Feature-based page components (WebDevelopment, DigitalArt, CreativeWriting, etc.)
- Reusable UI components in `/components` and `/components/ui`
- Shared type definitions in `/types`
- Centralized constants in `/constants`

**Data Flow**
- Context providers wrap the application for global state
- Components consume contexts via custom hooks (useAdmin, useData)
- API calls abstracted in `/lib/backend.ts`
- Type-safe data structures defined in shared schema

**Responsive Design**
- Mobile breakpoint at 768px (via useIsMobile hook)
- Responsive container and padding utilities
- Adaptive layouts for different screen sizes
- Touch-friendly interactions on mobile devices