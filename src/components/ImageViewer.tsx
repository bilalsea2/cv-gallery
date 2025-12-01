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
