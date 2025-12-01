# App Documentation

This file contains all source code for the `src/app/` folder.

## Table of Contents
- [page.tsx](#pagetsx) - Main application page
- [layout.tsx](#layouttsx) - Root layout
- [globals.css](#globalscss) - Global styles

---

## page.tsx

**Location:** `src/app/page.tsx`

Main application page with camera initialization, hand tracking integration, and UI composition.

```tsx
"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useHandTracking } from '@/hooks/useHandTracking';
import ImageGallery from '@/components/ImageGallery';
import ImageViewer from '@/components/ImageViewer';
import HandCursors from '@/components/HandCursors';
import Timer from '@/components/Timer';
import LoadingOverlay from '@/components/LoadingOverlay';

interface GalleryImage {
  id: string;
  src: string;
  title: string;
}

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [initialDragPos, setInitialDragPos] = useState<{ x: number; y: number } | undefined>();
  
  const handTracking = useHandTracking(videoRef);

  // Initialize camera
  useEffect(() => {
    let stream: MediaStream | null = null;

    const initCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
            frameRate: { ideal: 30 },
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraReady(true);
          
          // 3-second loading animation
          setTimeout(() => {
            setIsLoading(false);
          }, 3000);
        }
      } catch (err) {
        console.error('Camera error:', err);
        setIsLoading(false);
      }
    };

    initCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Draw mirrored video to canvas for display
  useEffect(() => {
    if (!cameraReady || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const drawFrame = () => {
      if (video.readyState >= 2) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Calculate cover dimensions
        const videoAspect = video.videoWidth / video.videoHeight;
        const canvasAspect = canvas.width / canvas.height;
        
        let drawWidth, drawHeight, offsetX, offsetY;
        
        if (canvasAspect > videoAspect) {
          drawWidth = canvas.width;
          drawHeight = canvas.width / videoAspect;
          offsetX = 0;
          offsetY = (canvas.height - drawHeight) / 2;
        } else {
          drawWidth = canvas.height * videoAspect;
          drawHeight = canvas.height;
          offsetX = (canvas.width - drawWidth) / 2;
          offsetY = 0;
        }

        // Mirror the video
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(video, -offsetX - drawWidth, offsetY, drawWidth, drawHeight);
        ctx.restore();
      }

      animationId = requestAnimationFrame(drawFrame);
    };

    drawFrame();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [cameraReady]);

  const handleImageSelect = useCallback((image: GalleryImage | null, dragPosition?: { x: number; y: number }) => {
    setSelectedImage(image);
    setInitialDragPos(dragPosition);
  }, []);

  const handleCloseImage = useCallback(() => {
    setSelectedImage(null);
    setInitialDragPos(undefined);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {/* Hidden video element for camera capture */}
      <video
        ref={videoRef}
        className="hidden"
        playsInline
        muted
        autoPlay
      />

      {/* Mirrored camera canvas background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Overlay gradient for better UI visibility */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/40 pointer-events-none" />

      {/* Timer */}
      <Timer isVisible={!isLoading} />

      {/* Hand tracking status indicator */}
      <motion.div
        className="fixed top-6 right-[26%] z-30"
        initial={{ opacity: 0 }}
        animate={{ opacity: !isLoading ? 1 : 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="bg-black/40 backdrop-blur-md rounded-xl px-3 py-1.5 border border-white/10 flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${handTracking.isReady ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`} />
          <span className="text-white/70 text-xs">
            {handTracking.isReady ? 'Hands Ready' : 'Loading...'}
          </span>
        </div>
      </motion.div>

      {/* Main content area - shows selected image or instructions */}
      <div className="absolute inset-0 right-[25%]">
        {!selectedImage && !isLoading && (
          <motion.div
            className="absolute bottom-12 left-1/2 -translate-x-1/2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            <div className="bg-black/50 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/10">
              <div className="flex flex-col items-center gap-2">
                <p className="text-white/80 text-sm font-medium">Hand Gesture Controls</p>
                <div className="flex gap-6 text-xs text-white/60">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                    Right: Select & Drag
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    Left: Zoom & Pan
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Image viewer */}
        <ImageViewer
          image={selectedImage}
          leftHand={handTracking.leftHand}
          rightHand={handTracking.rightHand}
          onClose={handleCloseImage}
          initialPosition={initialDragPos}
        />
      </div>

      {/* Gallery sidebar */}
      <ImageGallery
        rightHand={handTracking.rightHand}
        onImageSelect={handleImageSelect}
        selectedImage={selectedImage}
        isDragging={isDragging}
        setIsDragging={setIsDragging}
      />

      {/* Hand cursors */}
      <HandCursors
        leftHand={handTracking.leftHand}
        rightHand={handTracking.rightHand}
      />

      {/* Loading overlay with 3-second animation */}
      <LoadingOverlay isVisible={isLoading} />
    </div>
  );
}
```

---

## layout.tsx

**Location:** `src/app/layout.tsx`

Root layout with metadata and global providers.

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hand-Controlled Image Viewer",
  description: "Interactive image gallery controlled by hand gestures",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
```

---

## globals.css

**Location:** `src/app/globals.css`

Global styles using Tailwind CSS v4 with CSS custom properties.

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.556 0 0);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}

/* Hide Next.js error overlay portal */
nextjs-portal {
  display: none !important;
}
```

---

## Key Architecture Notes

### Camera Initialization Flow:
1. Request camera access with `getUserMedia`
2. Attach stream to hidden `<video>` element
3. Start drawing mirrored frames to canvas
4. Begin 3-second loading animation
5. Initialize MediaPipe hand tracking

### Video Mirroring:
The camera feed is mirrored using canvas `ctx.scale(-1, 1)` so the user sees themselves as in a mirror.

### Component Hierarchy:
```
Home (page.tsx)
├── LoadingOverlay (loading animation)
├── Timer (recording timer)
├── HandCursors (cursor indicators)
├── ImageGallery (right sidebar)
└── ImageViewer (main image display)
```

### State Management:
- `isLoading` - Controls loading overlay visibility
- `cameraReady` - Tracks camera initialization
- `selectedImage` - Currently viewed image
- `isDragging` - Whether user is dragging an image
- `initialDragPos` - Starting position for drag animations
