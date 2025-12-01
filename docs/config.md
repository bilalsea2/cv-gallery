# Configuration Documentation

This file contains all configuration files needed to set up the project.

## Table of Contents
- [package.json](#packagejson) - Dependencies and scripts
- [tsconfig.json](#tsconfigjson) - TypeScript configuration
- [next.config.ts](#nextconfigts) - Next.js configuration
- [lib/utils.ts](#libutilsts) - Utility functions

---

## package.json

**Location:** `package.json`

Core dependencies for the hand-controlled image viewer.

### Minimal Required Dependencies:

```json
{
  "name": "hand-image-viewer",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@mediapipe/hands": "^0.4.1675469240",
    "@mediapipe/camera_utils": "^0.3.1675466862",
    "clsx": "^2.1.1",
    "framer-motion": "^12.23.24",
    "next": "15.3.5",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tailwind-merge": "^3.3.1"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9.38.0",
    "eslint-config-next": "^16.0.1",
    "tailwindcss": "^4",
    "tw-animate-css": "^1.4.0",
    "typescript": "^5"
  }
}
```

### Installation Command:

```bash
npm install @mediapipe/hands @mediapipe/camera_utils framer-motion clsx tailwind-merge
npm install -D tw-animate-css
```

### Dependency Descriptions:

| Package | Purpose |
|---------|---------|
| `@mediapipe/hands` | Hand landmark detection ML model |
| `@mediapipe/camera_utils` | Camera utilities for MediaPipe |
| `framer-motion` | Animation library for React |
| `clsx` | Conditional class name utility |
| `tailwind-merge` | Merge Tailwind classes without conflicts |
| `tw-animate-css` | Pre-built Tailwind animations |

---

## tsconfig.json

**Location:** `tsconfig.json`

TypeScript configuration with path aliases.

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": [
      "dom",
      "dom.iterable",
      "esnext"
    ],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": [
        "./src/*"
      ]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}
```

### Key Settings:

| Setting | Value | Purpose |
|---------|-------|---------|
| `target` | ES2017 | JavaScript version for output |
| `strict` | true | Enable strict type checking |
| `paths.@/*` | ./src/* | Enable `@/` imports from src folder |
| `jsx` | preserve | Let Next.js handle JSX transformation |

---

## next.config.ts

**Location:** `next.config.ts`

Next.js configuration with image optimization.

### Minimal Configuration:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
```

### Configuration Notes:

- **images.remotePatterns**: Allows loading images from any remote URL
- **typescript.ignoreBuildErrors**: Skip TypeScript errors during build (for development)
- **eslint.ignoreDuringBuilds**: Skip ESLint during build

---

## lib/utils.ts

**Location:** `src/lib/utils.ts`

Utility function for merging Tailwind CSS classes.

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### Usage:

```tsx
import { cn } from "@/lib/utils";

// Merge classes with conflict resolution
<div className={cn("bg-red-500", isActive && "bg-blue-500")} />

// Combine multiple class sources
<button className={cn(baseClasses, variantClasses, className)} />
```

---

## postcss.config.mjs

**Location:** `postcss.config.mjs`

PostCSS configuration for Tailwind CSS v4.

```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
export default config;
```

---

## Project Folder Setup

Create the following folder structure:

```bash
mkdir -p src/app
mkdir -p src/components
mkdir -p src/hooks
mkdir -p src/lib
mkdir -p public/gallery
```

---

## Gallery Images Setup

Place your images in `public/gallery/`:

```
public/
└── gallery/
    ├── image1.jpg
    ├── image2.jpg
    ├── image3.jpg
    ├── image4.jpg
    ├── image5.jpg
    ├── image6.jpg
    ├── image7.jpg
    └── image8.jpg
```

Update `src/components/ImageGallery.tsx` with your image titles:

```typescript
const GALLERY_IMAGES: GalleryImage[] = [
  { id: '1', src: '/gallery/image1.jpg', title: 'Your Project 1' },
  { id: '2', src: '/gallery/image2.jpg', title: 'Your Project 2' },
  // ... add more as needed
];
```

---

## Quick Setup Script

Run these commands to set up a new project:

```bash
# Create Next.js project
npx create-next-app@latest hand-viewer --typescript --tailwind --eslint --app --src-dir
cd hand-viewer

# Install dependencies
npm install @mediapipe/hands @mediapipe/camera_utils framer-motion clsx tailwind-merge
npm install -D tw-animate-css

# Create folders
mkdir -p public/gallery

# Start development server
npm run dev
```

Then copy the files from this documentation into the appropriate locations.
