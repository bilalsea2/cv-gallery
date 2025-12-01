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
