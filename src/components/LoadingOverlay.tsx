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
