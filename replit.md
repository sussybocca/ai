# Overview

This is a full-stack AI chat application built with React and Express. The app allows users to send prompts to Google's Gemini AI model and receive generated text responses. It features a modern, responsive interface with dark/light theme support and real-time chat functionality. The application uses an in-memory storage system for message persistence during the session.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite as the build tool and development server
- **UI Framework**: Tailwind CSS for styling with shadcn/ui component library for consistent, accessible UI components
- **State Management**: TanStack React Query for server state management and data fetching
- **Routing**: Wouter for lightweight client-side routing
- **Theme System**: Custom theme provider supporting light/dark modes with localStorage persistence

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints for AI text generation and message retrieval
- **Error Handling**: Centralized error middleware with structured error responses
- **Request Logging**: Custom middleware for API request/response logging

## Data Storage
- **Primary Storage**: In-memory storage using JavaScript Maps for development/demo purposes
- **Database Schema**: Defined using Drizzle ORM with PostgreSQL dialect, ready for production database integration
- **Schema Design**: Separate tables for users and messages with UUID primary keys and timestamp tracking

## Authentication & Authorization
- **Current State**: No authentication implemented - designed for single-user demo/development
- **Prepared Structure**: User schema exists with username/password fields for future authentication implementation
- **Session Management**: Express session configuration ready (connect-pg-simple for PostgreSQL sessions)

## External Dependencies
- **AI Service**: Google Gemini AI (gemini-2.5-flash model) via @google/genai SDK
- **Database**: PostgreSQL with Neon serverless driver (@neondatabase/serverless)
- **Development Tools**: Replit-specific plugins for development environment integration
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Date Utilities**: date-fns for consistent date formatting and manipulation