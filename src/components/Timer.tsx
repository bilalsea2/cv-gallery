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
