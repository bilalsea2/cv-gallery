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
    { id: '1', src: '/gallery/image1.jpg', title: 'codeforces' },
    { id: '2', src: '/gallery/image2.jpg', title: 'kep.uz' },
    { id: '3', src: '/gallery/image3.jpg', title: 'acmp.ru' },
    { id: '4', src: '/gallery/image4.jpg', title: 'linux' },
    { id: '5', src: '/gallery/image5.jpg', title: 'olympiad 1' },
    { id: '6', src: '/gallery/image6.jpg', title: 'olympiad 2' },
    { id: '7', src: '/gallery/image7.jpg', title: 'olympiad 3' },
    { id: '8', src: '/gallery/image8.jpg', title: 'sarmolabs' },
    { id: '9', src: '/gallery/image9.jpg', title: 'presTechAward' },
    { id: '10', src: '/gallery/image10.jpg', title: 'peony.uz' },
    { id: '11', src: '/gallery/image11.gif', title: 'hackathon' },
    { id: '12', src: '/gallery/image12.jpg', title: 'github' },
    { id: '13', src: '/gallery/image13.jpg', title: 'almaty' },
    { id: '14', src: '/gallery/image14.jpg', title: 'marathons' },
    { id: '15', src: '/gallery/image15.jpg', title: 'marathons' },
    { id: '16', src: '/gallery/image16.jpg', title: 'marathons' },
    { id: '17', src: '/gallery/image17.jpg', title: 'run' },
    { id: '18', src: '/gallery/image18.jpg', title: 'run' },
    { id: '19', src: '/gallery/image19.jpg', title: 'run' },
    { id: '20', src: '/gallery/image20.jpg', title: 'run' },
    { id: '21', src: '/gallery/image21.jpg', title: 'run' },
    { id: '22', src: '/gallery/image22.jpg', title: 'run' },
    { id: '23', src: '/gallery/image23.jpg', title: 'run' },
];

const SCROLL_SPEED = 20; // Pixels per frame for thumb gesture scroll (2x speed)

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
    const contentRef = useRef<HTMLDivElement>(null);
    const lastPinchState = useRef(false);

    const lastThumbActionTime = useRef(0);
    const lastSelectedId = useRef<string | null>(null);

    // Keep track of last selected image
    useEffect(() => {
        if (selectedImage) {
            lastSelectedId.current = selectedImage.id;
        }
    }, [selectedImage]);

    // Handle thumbs up/down for next/prev image
    useEffect(() => {
        if (!rightHand || draggedImage) {
            setIsThumbScrolling(null);
            return;
        }

        const now = Date.now();
        if (now - lastThumbActionTime.current < 1000) return; // 1 second cooldown

        if (rightHand.isThumbsUp) {
            // Select Next Image
            setIsThumbScrolling('down'); // Visual feedback direction
            lastThumbActionTime.current = now;

            let currentIndex = -1;
            if (selectedImage) {
                currentIndex = GALLERY_IMAGES.findIndex(img => img.id === selectedImage.id);
            } else if (lastSelectedId.current) {
                currentIndex = GALLERY_IMAGES.findIndex(img => img.id === lastSelectedId.current);
            }

            const nextIndex = currentIndex + 1 < GALLERY_IMAGES.length ? currentIndex + 1 : 0;
            const nextImage = GALLERY_IMAGES[nextIndex];

            onImageSelect(nextImage);

            // Scroll to make it visible
            // Approximate height of item + gap = 140px
            const targetScroll = Math.max(0, nextIndex * 140 - 100);
            setScrollY(targetScroll);

        } else if (rightHand.isThumbsDown) {
            // Select Previous Image
            setIsThumbScrolling('up'); // Visual feedback direction
            lastThumbActionTime.current = now;

            let currentIndex = 0;
            if (selectedImage) {
                currentIndex = GALLERY_IMAGES.findIndex(img => img.id === selectedImage.id);
            } else if (lastSelectedId.current) {
                currentIndex = GALLERY_IMAGES.findIndex(img => img.id === lastSelectedId.current);
            }

            const prevIndex = currentIndex - 1 >= 0 ? currentIndex - 1 : GALLERY_IMAGES.length - 1;
            const prevImage = GALLERY_IMAGES[prevIndex];

            onImageSelect(prevImage);

            // Scroll to make it visible
            const targetScroll = Math.max(0, prevIndex * 140 - 100);
            setScrollY(targetScroll);

        } else {
            setIsThumbScrolling(null);
        }
    }, [rightHand, draggedImage, selectedImage, onImageSelect]);

    // Handle pinch-to-drag in gallery
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
                // Use elementFromPoint to find the image under the pinch
                // We temporarily hide the cursor/hand to find the element
                const element = document.elementFromPoint(pinchX, pinchY);
                const imageContainer = element?.closest('[data-image-id]');

                if (imageContainer) {
                    const id = imageContainer.getAttribute('data-image-id');
                    const image = GALLERY_IMAGES.find(img => img.id === id);
                    if (image) {
                        setDraggedImage(image);
                        setDragPosition({ x: pinchX, y: pinchY });
                        setIsDragging(true);
                    }
                } else {
                    // Fallback to approximate calculation if elementFromPoint fails
                    // This is less accurate but works if the pointer events are blocked
                    const relY = pinchY - galleryRect.top + scrollY;
                    // Estimate height based on width (approx 16/10 aspect ratio + padding)
                    const itemHeight = (galleryRect.width - 24) * (10 / 16) + 12;
                    const imageIndex = Math.floor(relY / itemHeight);

                    if (imageIndex >= 0 && imageIndex < GALLERY_IMAGES.length) {
                        // Only select if we haven't found it via elementFromPoint
                        // setDraggedImage(GALLERY_IMAGES[imageIndex]);
                        // setDragPosition({ x: pinchX, y: pinchY });
                        // setIsDragging(true);
                    }
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
            const element = document.elementFromPoint(pinchX, pinchY);
            const imageContainer = element?.closest('[data-image-id]');

            if (imageContainer) {
                const id = imageContainer.getAttribute('data-image-id');
                setHoveredImage(id || null);
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
                    <p className="text-white/50 text-xs mt-1">👍 Next · 👎 Prev</p>
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
                        ref={contentRef}
                        className="p-3 space-y-3"
                        animate={{ y: -scrollY }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    >
                        {GALLERY_IMAGES.map((image) => (
                            <motion.div
                                key={image.id}
                                data-image-id={image.id}
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
