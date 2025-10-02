# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Install dependencies:**
```bash
npm install
```

**Start development server:**
```bash
npm run dev
```
Runs on port 3000 at http://localhost:3000

**Build for production:**
```bash
npm run build
```

**Preview production build:**
```bash
npm run preview
```

## Environment Setup

This application requires a Gemini API key for AI features:
1. Create a `.env.local` file in the root directory
2. Set `GEMINI_API_KEY=your_api_key_here`

The API key is used by the Gemini integration in `lib/gemini.ts` for generating product names, descriptions, and prices from uploaded images.

## Architecture Overview

This is a React e-commerce management platform built with Vite, TypeScript, and React Router. The application has two main views:

### Core Structure
- **App.tsx**: Main application with navigation between Shop and Admin pages
- **types.ts**: Central type definitions (Product interface)
- **contexts/ProductContext.tsx**: Global product state management using React Context
- **hooks/useProducts.ts**: Custom hook handling product CRUD operations and localStorage persistence

### Pages
- **ShopPage**: Customer-facing product catalog
- **AdminPage**: Administrative interface for product management

### Components
- **ProductForm**: Modal form for creating/editing products with AI-powered content generation
- **ProductCard**: Display component for products
- **ConfirmDeleteModal**: Confirmation dialog for product deletion

### Data Management
- Products are stored in browser localStorage (no backend database)
- Initial state is empty - products are added through the admin interface
- Product images are stored as base64 data URLs

### AI Integration
The `lib/gemini.ts` module provides three AI-powered functions:
- `generateProductName()`: Creates product names from uploaded images
- `generateProductDescription()`: Generates product descriptions
- `generateProductPrice()`: Suggests pricing based on product details

### Key Dependencies
- React 19.2.0 with React Router for navigation
- @google/genai for Gemini AI integration
- @heroicons/react for UI icons
- Vite for build tooling
- TypeScript for type safety

### File Structure Patterns
- Components use functional components with TypeScript interfaces
- State management follows React Context pattern
- Custom hooks encapsulate business logic
- All UI text is in Traditional Chinese