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
