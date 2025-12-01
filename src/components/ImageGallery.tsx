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

const SCROLL_SPEED = 16; // Pixels per frame for thumb gesture scroll (2x speed)

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
                                className={`relative rounded-lg overflow-hidden cursor-pointer ${selectedImage?.id === image.id ? 'ring-2 ring-white/60' : ''
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
