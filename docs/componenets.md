# Components Documentation

This file contains all the component source code for the Hand-Controlled Image Viewer.

## Table of Contents
- [HandCursors.tsx](#handcursorstsx)
- [ImageGallery.tsx](#imagegallerytsx)
- [ImageViewer.tsx](#imageviewertsx)
- [LoadingOverlay.tsx](#loadingoverlaytsx)
- [Timer.tsx](#timertsx)
- [ErrorReporter.tsx](#errorreportertsx)

---

## HandCursors.tsx

**Location:** `src/components/HandCursors.tsx`

Visual cursors that follow hand positions with pinch feedback animations.

```tsx
"use client";

import { motion, AnimatePresence } from 'framer-motion';
import type { HandData } from '@/hooks/useHandTracking';

interface HandCursorsProps {
  leftHand: HandData | null;
  rightHand: HandData | null;
}

export default function HandCursors({ leftHand, rightHand }: HandCursorsProps) {
  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {/* Left Hand Cursor */}
      <AnimatePresence>
        {leftHand && (
          <motion.div
            className="absolute"
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: 1,
              scale: 1,
              x: (1 - leftHand.pinchPosition.x) * window.innerWidth - 20,
              y: leftHand.pinchPosition.y * window.innerHeight - 20,
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          >
            <div className={`relative w-10 h-10 flex items-center justify-center`}>
              {/* Outer ring */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-blue-400"
                animate={{
                  scale: leftHand.isPinching ? 0.7 : 1,
                  borderColor: leftHand.isPinching ? '#60a5fa' : '#93c5fd',
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              />
              {/* Inner dot */}
              <motion.div
                className="w-3 h-3 rounded-full bg-blue-400"
                animate={{
                  scale: leftHand.isPinching ? 1.5 : 1,
                  backgroundColor: leftHand.isPinching ? '#3b82f6' : '#60a5fa',
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              />
              {/* Pinch indicator */}
              <AnimatePresence>
                {leftHand.isPinching && (
                  <motion.div
                    className="absolute inset-[-8px] rounded-full border border-blue-300/50"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1.2, opacity: [0, 1, 0] }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.4, repeat: Infinity }}
                  />
                )}
              </AnimatePresence>
            </div>
            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-blue-300 font-medium">
              L
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right Hand Cursor */}
      <AnimatePresence>
        {rightHand && (
          <motion.div
            className="absolute"
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: 1,
              scale: 1,
              x: (1 - rightHand.pinchPosition.x) * window.innerWidth - 20,
              y: rightHand.pinchPosition.y * window.innerHeight - 20,
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          >
            <div className={`relative w-10 h-10 flex items-center justify-center`}>
              {/* Outer ring */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-green-400"
                animate={{
                  scale: rightHand.isPinching ? 0.7 : 1,
                  borderColor: rightHand.isPinching ? '#4ade80' : '#86efac',
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              />
              {/* Inner dot */}
              <motion.div
                className="w-3 h-3 rounded-full bg-green-400"
                animate={{
                  scale: rightHand.isPinching ? 1.5 : 1,
                  backgroundColor: rightHand.isPinching ? '#22c55e' : '#4ade80',
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              />
              {/* Pinch indicator */}
              <AnimatePresence>
                {rightHand.isPinching && (
                  <motion.div
                    className="absolute inset-[-8px] rounded-full border border-green-300/50"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1.2, opacity: [0, 1, 0] }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.4, repeat: Infinity }}
                  />
                )}
              </AnimatePresence>
            </div>
            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-green-300 font-medium">
              R
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

---

## ImageGallery.tsx

**Location:** `src/components/ImageGallery.tsx`

Right sidebar gallery with thumbs up/down scrolling and pinch-to-drag selection.

```tsx
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { HandData } from '@/hooks/useHandTracking';

interface GalleryImage {
  id: string;
  src: string;
  title: string;
}

interface ImageGalleryProps {
  rightHand: HandData | null;
  onImageSelect: (image: GalleryImage | null, dragPosition?: { x: number; y: number }) => void;
  selectedImage: GalleryImage | null;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
}

// Images are loaded from public/gallery/ folder
// To add your own images, place them in public/gallery/ with names like:
// image1.jpg, image2.png, project-screenshot.jpg, certificate.pdf, etc.
const GALLERY_IMAGES: GalleryImage[] = [
  { id: '1', src: '/gallery/image1.jpg', title: 'Project 1' },
  { id: '2', src: '/gallery/image2.jpg', title: 'Project 2' },
  { id: '3', src: '/gallery/image3.jpg', title: 'Project 3' },
  { id: '4', src: '/gallery/image4.jpg', title: 'Certificate 1' },
  { id: '5', src: '/gallery/image5.jpg', title: 'Certificate 2' },
  { id: '6', src: '/gallery/image6.jpg', title: 'Screenshot 1' },
  { id: '7', src: '/gallery/image7.jpg', title: 'Screenshot 2' },
  { id: '8', src: '/gallery/image8.jpg', title: 'Screenshot 3' },
];

const SCROLL_SPEED = 8; // Pixels per frame for thumb gesture scroll

export default function ImageGallery({ 
  rightHand, 
  onImageSelect, 
  selectedImage, 
  isDragging, 
  setIsDragging 
}: ImageGalleryProps) {
  const [scrollY, setScrollY] = useState(0);
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);
  const [draggedImage, setDraggedImage] = useState<GalleryImage | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [isThumbScrolling, setIsThumbScrolling] = useState<'up' | 'down' | null>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const lastPinchState = useRef(false);
  const pinchStartY = useRef(0);
  const scrollStartY = useRef(0);

  // Handle thumbs up/down scroll for right hand
  useEffect(() => {
    if (!rightHand || draggedImage) {
      setIsThumbScrolling(null);
      return;
    }

    const galleryRect = galleryRef.current?.getBoundingClientRect();
    if (!galleryRect) return;

    const maxScroll = Math.max(0, GALLERY_IMAGES.length * 140 - (galleryRect.height - 60));

    if (rightHand.isThumbsUp) {
      setIsThumbScrolling('up');
      setScrollY(prev => Math.max(0, prev - SCROLL_SPEED));
    } else if (rightHand.isThumbsDown) {
      setIsThumbScrolling('down');
      setScrollY(prev => Math.min(maxScroll, prev + SCROLL_SPEED));
    } else {
      setIsThumbScrolling(null);
    }
  }, [rightHand, draggedImage]);

  // Handle pinch-to-drag in gallery (keep existing pinch logic for selecting images)
  useEffect(() => {
    if (!rightHand || draggedImage) return;
    // Skip if doing thumb gesture
    if (rightHand.isThumbsUp || rightHand.isThumbsDown) return;

    const galleryRect = galleryRef.current?.getBoundingClientRect();
    if (!galleryRect) return;

    const pinchX = (1 - rightHand.pinchPosition.x) * window.innerWidth;
    const pinchY = rightHand.pinchPosition.y * window.innerHeight;

    // Check if pinch is inside gallery
    const isInGallery = pinchX >= galleryRect.left && pinchX <= galleryRect.right &&
                        pinchY >= galleryRect.top && pinchY <= galleryRect.bottom;

    if (rightHand.isPinching && isInGallery) {
      if (!lastPinchState.current) {
        // Start of pinch - check if on an image
        const relY = pinchY - galleryRect.top + scrollY;
        const imageIndex = Math.floor(relY / 140);
        
        if (imageIndex >= 0 && imageIndex < GALLERY_IMAGES.length) {
          setDraggedImage(GALLERY_IMAGES[imageIndex]);
          setDragPosition({ x: pinchX, y: pinchY });
          setIsDragging(true);
        }
      }
    }

    lastPinchState.current = rightHand.isPinching;
  }, [rightHand, draggedImage, scrollY, setIsDragging]);

  // Handle dragging image
  useEffect(() => {
    if (!draggedImage || !rightHand) return;

    const pinchX = (1 - rightHand.pinchPosition.x) * window.innerWidth;
    const pinchY = rightHand.pinchPosition.y * window.innerHeight;

    setDragPosition({ x: pinchX, y: pinchY });

    // Release image when pinch ends
    if (!rightHand.isPinching) {
      // Check if released in main view area (left 75% of screen)
      if (pinchX < window.innerWidth * 0.75) {
        onImageSelect(draggedImage, { x: pinchX, y: pinchY });
      }
      setDraggedImage(null);
      setIsDragging(false);
    }
  }, [rightHand, draggedImage, onImageSelect, setIsDragging]);

  // Determine hovered image from hand position
  useEffect(() => {
    if (!rightHand || draggedImage) {
      setHoveredImage(null);
      return;
    }

    const galleryRect = galleryRef.current?.getBoundingClientRect();
    if (!galleryRect) return;

    const pinchX = (1 - rightHand.pinchPosition.x) * window.innerWidth;
    const pinchY = rightHand.pinchPosition.y * window.innerHeight;

    const isInGallery = pinchX >= galleryRect.left && pinchX <= galleryRect.right &&
                        pinchY >= galleryRect.top && pinchY <= galleryRect.bottom;

    if (isInGallery) {
      const relY = pinchY - galleryRect.top + scrollY;
      const imageIndex = Math.floor(relY / 140);
      if (imageIndex >= 0 && imageIndex < GALLERY_IMAGES.length) {
        setHoveredImage(GALLERY_IMAGES[imageIndex].id);
      } else {
        setHoveredImage(null);
      }
    } else {
      setHoveredImage(null);
    }
  }, [rightHand, scrollY, draggedImage]);

  return (
    <>
      <div className="absolute right-0 top-0 bottom-0 w-1/4 bg-black/40 backdrop-blur-md border-l border-white/10 flex flex-col z-20">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-white/90 font-medium text-sm tracking-wide">Gallery</h2>
          <p className="text-white/50 text-xs mt-1">👍 Scroll up · 👎 Scroll down</p>
        </div>
        
        {/* Scroll indicator - top */}
        <AnimatePresence>
          {isThumbScrolling === 'up' && (
            <motion.div
              className="absolute top-14 left-0 right-0 h-8 bg-gradient-to-b from-green-500/30 to-transparent z-10 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
        </AnimatePresence>
        
        <div 
          ref={galleryRef}
          className="flex-1 overflow-hidden relative"
        >
          <motion.div 
            className="p-3 space-y-3"
            animate={{ y: -scrollY }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {GALLERY_IMAGES.map((image) => (
              <motion.div
                key={image.id}
                className={`relative rounded-lg overflow-hidden cursor-pointer ${
                  selectedImage?.id === image.id ? 'ring-2 ring-white/60' : ''
                }`}
                animate={{
                  scale: hoveredImage === image.id ? 1.02 : 1,
                  opacity: draggedImage?.id === image.id ? 0.3 : 1,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <div className="aspect-[16/10] relative">
                  <img
                    src={image.src}
                    alt={image.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-white/90 text-xs font-medium truncate">{image.title}</p>
                  </div>
                  {hoveredImage === image.id && (
                    <motion.div
                      className="absolute inset-0 border-2 border-white/40 rounded-lg"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    />
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
        
        {/* Scroll indicator - bottom */}
        <AnimatePresence>
          {isThumbScrolling === 'down' && (
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-green-500/30 to-transparent z-10 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Dragged image preview */}
      <AnimatePresence>
        {draggedImage && (
          <motion.div
            className="fixed pointer-events-none z-50"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: 1, 
              opacity: 1,
              x: dragPosition.x - 100,
              y: dragPosition.y - 60,
            }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <div className="w-[200px] rounded-lg overflow-hidden shadow-2xl ring-2 ring-white/60">
              <img
                src={draggedImage.src}
                alt={draggedImage.title}
                className="w-full aspect-[16/10] object-cover"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
```

---

## ImageViewer.tsx

**Location:** `src/components/ImageViewer.tsx`

Main image viewer with zoom, pan, drag, and dismiss functionality.

```tsx
"use client";

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { HandData } from '@/hooks/useHandTracking';

interface GalleryImage {
  id: string;
  src: string;
  title: string;
}

interface ImageViewerProps {
  image: GalleryImage | null;
  leftHand: HandData | null;
  rightHand: HandData | null;
  onClose: () => void;
  initialPosition?: { x: number; y: number };
}

export default function ImageViewer({ image, leftHand, rightHand, onClose, initialPosition }: ImageViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDraggingWithRight, setIsDraggingWithRight] = useState(false);
  const [isInDismissZone, setIsInDismissZone] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  
  const lastPinchY = useRef(0);
  const lastPinchX = useRef(0);
  const isPinching = useRef(false);
  const rightPinchStart = useRef<{ x: number; y: number } | null>(null);

  // Handle right hand dragging for moving the image
  useEffect(() => {
    if (!image || !rightHand || isDismissing) return;

    const pinchX = (1 - rightHand.pinchPosition.x) * window.innerWidth;
    const pinchY = rightHand.pinchPosition.y * window.innerHeight;
    
    // Only track if pinch is in main view area (left 75%)
    const isInMainView = pinchX < window.innerWidth * 0.75;

    if (rightHand.isPinching && isInMainView) {
      if (!rightPinchStart.current) {
        // Start of right hand pinch
        rightPinchStart.current = { x: pinchX, y: pinchY };
        setIsDraggingWithRight(true);
      } else {
        // Calculate new position based on hand movement
        const deltaX = pinchX - rightPinchStart.current.x;
        const deltaY = pinchY - rightPinchStart.current.y;
        
        setPan({ x: deltaX, y: deltaY });
        
        // Check if in dismiss zone (bottom 15% of screen)
        const dismissThreshold = window.innerHeight * 0.85;
        setIsInDismissZone(pinchY > dismissThreshold);
      }
    } else if (!rightHand.isPinching && rightPinchStart.current) {
      // Released - check if should dismiss
      if (isInDismissZone) {
        setIsDismissing(true);
        setTimeout(() => {
          onClose();
          setIsDismissing(false);
          setIsInDismissZone(false);
        }, 400);
      } else {
        // Snap back to center
        setPan({ x: 0, y: 0 });
      }
      rightPinchStart.current = null;
      setIsDraggingWithRight(false);
      setIsInDismissZone(false);
    }
  }, [rightHand, image, isInDismissZone, isDismissing, onClose]);

  // Handle zoom and pan with left hand
  useEffect(() => {
    if (!image || !leftHand || isDraggingWithRight) return;

    const pinchY = leftHand.pinchPosition.y * window.innerHeight;
    const pinchX = (1 - leftHand.pinchPosition.x) * window.innerWidth;

    if (leftHand.isPinching) {
      if (!isPinching.current) {
        lastPinchY.current = pinchY;
        lastPinchX.current = pinchX;
        isPinching.current = true;
      } else {
        const deltaY = pinchY - lastPinchY.current;
        const deltaX = pinchX - lastPinchX.current;

        if (Math.abs(deltaY) > Math.abs(deltaX) * 0.5) {
          const zoomDelta = -deltaY * 0.008;
          setZoom(prev => Math.max(0.5, Math.min(4, prev + zoomDelta)));
        }
        
        if (Math.abs(deltaX) > 5) {
          setPan(prev => ({
            x: Math.max(-300, Math.min(300, prev.x + deltaX * 0.5)),
            y: prev.y
          }));
        }

        lastPinchY.current = pinchY;
        lastPinchX.current = pinchX;
      }
    } else {
      isPinching.current = false;
    }
  }, [leftHand, image, isDraggingWithRight]);

  // Reset when image changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setIsDraggingWithRight(false);
    setIsInDismissZone(false);
    setIsDismissing(false);
    rightPinchStart.current = null;
  }, [image?.id]);

  if (!image) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="absolute inset-0 right-[25%] flex items-center justify-center z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Dismiss zone glow at bottom */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: isDraggingWithRight ? (isInDismissZone ? 1 : 0.3) : 0,
          }}
          transition={{ duration: 0.2 }}
        >
          <div 
            className="w-full h-full"
            style={{
              background: isInDismissZone 
                ? 'linear-gradient(to top, rgba(239, 68, 68, 0.8) 0%, rgba(239, 68, 68, 0.4) 40%, transparent 100%)'
                : 'linear-gradient(to top, rgba(239, 68, 68, 0.3) 0%, transparent 100%)',
            }}
          />
          <motion.div
            className="absolute bottom-4 left-1/2 -translate-x-1/2"
            animate={{ 
              scale: isInDismissZone ? [1, 1.1, 1] : 1,
              opacity: isDraggingWithRight ? 1 : 0,
            }}
            transition={{ 
              scale: { repeat: Infinity, duration: 0.6 },
              opacity: { duration: 0.2 }
            }}
          >
            <span className={`text-sm font-medium ${isInDismissZone ? 'text-red-400' : 'text-white/60'}`}>
              {isInDismissZone ? 'Release to dismiss' : 'Drag here to dismiss'}
            </span>
          </motion.div>
        </motion.div>

        {/* Image container */}
        <motion.div
          className="relative max-w-[70%] max-h-[80%]"
          initial={initialPosition ? {
            x: initialPosition.x - window.innerWidth * 0.375,
            y: initialPosition.y - window.innerHeight * 0.5,
            scale: 0.3,
            opacity: 0,
          } : { scale: 0.8, opacity: 0 }}
          animate={isDismissing ? {
            y: window.innerHeight,
            scale: 0.5,
            opacity: 0,
            rotate: 10,
          } : {
            x: pan.x,
            y: pan.y,
            scale: isDraggingWithRight ? zoom * 0.95 : zoom,
            opacity: isInDismissZone ? 0.6 : 1,
            rotate: isInDismissZone ? 5 : 0,
          }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ 
            type: isDismissing ? 'tween' : 'spring', 
            stiffness: 200, 
            damping: 25,
            duration: isDismissing ? 0.4 : undefined,
          }}
        >
          <div className={`rounded-2xl overflow-hidden shadow-2xl ring-1 ${isInDismissZone ? 'ring-red-500/60' : 'ring-white/20'} transition-all duration-200`}>
            <img
              src={image.src}
              alt={image.title}
              className="max-w-full max-h-[70vh] object-contain"
              draggable={false}
            />
          </div>
          
          {/* Image title */}
          <motion.div
            className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: isDraggingWithRight ? 0 : 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="bg-black/40 backdrop-blur-sm rounded-full px-4 py-1.5 border border-white/10">
              <span className="text-white/90 text-sm font-medium">{image.title}</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Zoom indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: isDraggingWithRight ? 0 : 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="bg-black/40 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10 flex items-center gap-3">
            <span className="text-white/60 text-xs">Zoom</span>
            <div className="w-24 h-1 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white/60 rounded-full"
                animate={{ width: `${((zoom - 0.5) / 3.5) * 100}%` }}
              />
            </div>
            <span className="text-white/80 text-xs font-mono w-10">{zoom.toFixed(1)}x</span>
          </div>
        </motion.div>

        {/* Controls hint */}
        <motion.div
          className="absolute top-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: isDraggingWithRight ? 0 : 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="bg-black/40 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/10">
            <div className="flex items-center gap-4 text-xs text-white/60">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                Right hand: Move
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                Left hand: Zoom & Pan
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
```

---

## LoadingOverlay.tsx

**Location:** `src/components/LoadingOverlay.tsx`

3-second loading animation with camera initialization feedback.

```tsx
"use client";

import { motion } from 'framer-motion';

interface LoadingOverlayProps {
  isVisible: boolean;
}

export default function LoadingOverlay({ isVisible }: LoadingOverlayProps) {
  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-white flex items-center justify-center"
      initial={{ opacity: 1 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
      style={{ pointerEvents: isVisible ? 'auto' : 'none' }}
    >
      <motion.div
        className="flex flex-col items-center gap-6"
        initial={{ scale: 1, opacity: 1 }}
        animate={{ scale: isVisible ? 1 : 0.8, opacity: isVisible ? 1 : 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Animated circles */}
        <div className="relative w-20 h-20">
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-gray-300"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute inset-2 rounded-full border-2 border-gray-400"
            animate={{ scale: [1.2, 1, 1.2], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute inset-4 rounded-full bg-gray-800"
            animate={{ scale: [0.8, 1, 0.8] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
        
        {/* Loading text */}
        <motion.div
          className="text-gray-600 font-medium tracking-wider text-sm"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Initializing camera...
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
```

---

## Timer.tsx

**Location:** `src/components/Timer.tsx`

Recording timer with M:SS format display.

```tsx
"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TimerProps {
  isVisible: boolean;
}

export default function Timer({ isVisible }: TimerProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible]);

  const minutes = Math.floor(seconds / 60) % 10; // Single digit minutes
  const secs = seconds % 60;

  const formatTime = () => {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      className="fixed top-6 left-6 z-30"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : -20 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="bg-black/40 backdrop-blur-md rounded-xl px-4 py-2 border border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-white font-mono text-xl tracking-wider">
            {formatTime()}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
```

---

## ErrorReporter.tsx

**Location:** `src/components/ErrorReporter.tsx`

Error boundary and reporting component (optional, for development).

```tsx
"use client";

import { useEffect, useRef } from "react";

type ReporterProps = {
  error?: Error & { digest?: string };
  reset?: () => void;
};

export default function ErrorReporter({ error, reset }: ReporterProps) {
  const lastOverlayMsg = useRef("");
  const pollRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const inIframe = window.parent !== window;
    if (!inIframe) return;

    const send = (payload: unknown) => window.parent.postMessage(payload, "*");

    const onError = (e: ErrorEvent) =>
      send({
        type: "ERROR_CAPTURED",
        error: {
          message: e.message,
          stack: e.error?.stack,
          filename: e.filename,
          lineno: e.lineno,
          colno: e.colno,
          source: "window.onerror",
        },
        timestamp: Date.now(),
      });

    const onReject = (e: PromiseRejectionEvent) =>
      send({
        type: "ERROR_CAPTURED",
        error: {
          message: e.reason?.message ?? String(e.reason),
          stack: e.reason?.stack,
          source: "unhandledrejection",
        },
        timestamp: Date.now(),
      });

    const pollOverlay = () => {
      const overlay = document.querySelector("[data-nextjs-dialog-overlay]");
      const node =
        overlay?.querySelector(
          "h1, h2, .error-message, [data-nextjs-dialog-body]"
        ) ?? null;
      const txt = node?.textContent ?? node?.innerHTML ?? "";
      if (txt && txt !== lastOverlayMsg.current) {
        lastOverlayMsg.current = txt;
        send({
          type: "ERROR_CAPTURED",
          error: { message: txt, source: "nextjs-dev-overlay" },
          timestamp: Date.now(),
        });
      }
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onReject);
    pollRef.current = setInterval(pollOverlay, 1000);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onReject);
      pollRef.current && clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    if (!error) return;
    window.parent.postMessage(
      {
        type: "global-error-reset",
        error: {
          message: error.message,
          stack: error.stack,
          digest: error.digest,
          name: error.name,
        },
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
      },
      "*"
    );
  }, [error]);

  if (!error) return null;

  return (
    <html>
      <body className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-destructive">
              Something went wrong!
            </h1>
            <p className="text-muted-foreground">
              An unexpected error occurred. Please try again.
            </p>
          </div>
          <div className="space-y-2">
            {process.env.NODE_ENV === "development" && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  Error details
                </summary>
                <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                  {error.message}
                  {error.stack && (
                    <div className="mt-2 text-muted-foreground">
                      {error.stack}
                    </div>
                  )}
                  {error.digest && (
                    <div className="mt-2 text-muted-foreground">
                      Digest: {error.digest}
                    </div>
                  )}
                </pre>
              </details>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
```
