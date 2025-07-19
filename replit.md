# BioScriptor - AI-Powered Bioinformatics Assistant

## Overview

BioScriptor is a full-stack web application that serves as an AI-powered bioinformatics assistant. The application provides a ChatGPT-style interface for natural language bioinformatics queries, file analysis capabilities, and molecular visualization tools. It's designed to help researchers and scientists with various molecular biology tasks including CRISPR design, PCR simulation, sequence analysis, and more.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a modern full-stack architecture with a clear separation between frontend and backend concerns:

- **Frontend**: React-based single-page application with TypeScript
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Firebase Authentication with Google OAuth
- **Deployment**: Designed for production deployment with Vite build system

## Key Components

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development and building
- **UI Library**: shadcn/ui components built on Radix UI primitives for consistent design
- **Styling**: Tailwind CSS with custom CSS variables for theming (light/dark mode support)
- **State Management**: TanStack Query for server state management, React hooks for local state
- **Routing**: Wouter for client-side routing (lightweight alternative to React Router)
- **File Handling**: Custom file upload components with support for bioinformatics file formats (.fasta, .gb, .pdb, .csv)

### Backend Architecture
- **Framework**: Express.js with TypeScript for type safety
- **Database ORM**: Drizzle ORM with PostgreSQL dialect for type-safe database operations
- **Authentication**: Firebase Admin SDK integration for user verification
- **File Processing**: Multer for multipart form data handling with memory storage
- **Session Management**: Connect-pg-simple for PostgreSQL-backed session storage
- **Payment Processing**: PayPal SDK integration for subscription management

### Database Schema
The application uses a PostgreSQL database with the following main entities:
- **Users**: Stores user profile information, Firebase UID, subscription tier, and query count
- **Chat Sessions**: Stores conversation history with message arrays as JSON
- **Bio Files**: Stores uploaded biological files with content and analysis results
- **Subscriptions**: Manages PayPal subscription data and user tier information

### AI and Bioinformatics Services
- **Natural Language Processing**: Custom query parsing to identify bioinformatics task types
- **Bioinformatics Analysis**: Built-in algorithms for sequence analysis, CRISPR guide design, PCR simulation
- **File Analysis**: Support for common bioinformatics file formats with automatic feature detection
- **Molecular Visualization**: Integration ready for 3D molecular viewers (NGL Viewer mentioned in blueprints)

## Data Flow

1. **User Authentication**: Users authenticate via Firebase (Google OAuth), creating or retrieving user records
2. **Chat Interface**: Users submit natural language queries or file uploads through a ChatGPT-style interface
3. **Query Processing**: Backend parses queries to determine bioinformatics task type and parameters
4. **File Analysis**: Uploaded files are analyzed based on format (.fasta, .gb, .pdb, .csv) with results stored
5. **AI Response Generation**: Appropriate bioinformatics algorithms are applied and results formatted for display
6. **Session Management**: All conversations are stored persistently with user association
7. **Subscription Management**: PayPal integration handles user tier upgrades and usage tracking

## External Dependencies

### Core Dependencies
- **Database**: Neon Database (PostgreSQL serverless) via `@neondatabase/serverless`
- **Authentication**: Firebase SDK for client and server-side authentication
- **Payment Processing**: PayPal Server SDK for subscription management
- **UI Components**: Radix UI primitives for accessible, unstyled components
- **State Management**: TanStack Query for server state synchronization

### Development Tools
- **Build System**: Vite with React plugin and TypeScript support
- **Code Quality**: TypeScript for type safety across the entire stack
- **Styling**: Tailwind CSS with PostCSS for utility-first styling
- **Database Migration**: Drizzle Kit for schema management and migrations

## Deployment Strategy

The application is configured for production deployment with the following considerations:

### Build Process
- **Client Build**: Vite builds the React application to `dist/public`
- **Server Build**: esbuild bundles the Express server to `dist/index.js`
- **Environment**: Supports both development and production modes with appropriate optimizations

### Environment Configuration
- **Database**: Requires `DATABASE_URL` for PostgreSQL connection
- **Authentication**: Requires Firebase configuration environment variables
- **Payment**: Requires PayPal client credentials for subscription processing
- **Development**: Includes Replit-specific configurations for cloud development

### Scalability Considerations
- **Database**: Uses connection pooling with Neon Database for serverless PostgreSQL
- **Session Storage**: PostgreSQL-backed sessions for horizontal scalability
- **File Storage**: Currently uses memory storage for file uploads (can be extended to cloud storage)
- **Caching**: TanStack Query provides client-side caching for API responses

The architecture supports both development in cloud environments (Replit) and traditional deployment scenarios, with careful separation of concerns and type safety throughout the stack.