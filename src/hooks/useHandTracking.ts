"use client";

import { useEffect, useRef, useCallback, useState } from 'react';

export interface HandData {
    landmarks: { x: number; y: number; z: number }[];
    handedness: 'Left' | 'Right';
    isPinching: boolean;
    pinchPosition: { x: number; y: number };
    pinchStrength: number;
    isThumbsUp: boolean;
    isThumbsDown: boolean;
    isOpenPalm: boolean;
}

export interface HandTrackingState {
    leftHand: HandData | null;
    rightHand: HandData | null;
    isReady: boolean;
}

const PINCH_THRESHOLD = 0.08;
const THUMB_GESTURE_THRESHOLD = 0.06; // Minimum vertical distance for thumb gesture

export function useHandTracking(videoRef: React.RefObject<HTMLVideoElement | null>) {
    const [state, setState] = useState<HandTrackingState>({
        leftHand: null,
        rightHand: null,
        isReady: false,
    });

    const handsRef = useRef<any>(null);
    const animationFrameRef = useRef<number>(0);
    const lastProcessTime = useRef<number>(0);

    const calculatePinch = useCallback((landmarks: any[]): { isPinching: boolean; position: { x: number; y: number }; strength: number } => {
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];

        const distance = Math.sqrt(
            Math.pow(thumbTip.x - indexTip.x, 2) +
            Math.pow(thumbTip.y - indexTip.y, 2) +
            Math.pow(thumbTip.z - indexTip.z, 2)
        );

        const isPinching = distance < PINCH_THRESHOLD;
        const strength = Math.max(0, 1 - distance / PINCH_THRESHOLD);

        return {
            isPinching,
            position: {
                x: (thumbTip.x + indexTip.x) / 2,
                y: (thumbTip.y + indexTip.y) / 2,
            },
            strength,
        };
    }, []);

    const detectThumbGesture = useCallback((landmarks: any[]): { isThumbsUp: boolean; isThumbsDown: boolean } => {
        // Thumb landmarks
        const thumbTip = landmarks[4];
        const thumbIP = landmarks[3];
        const thumbMCP = landmarks[2];
        const thumbCMC = landmarks[1];

        // Other finger tips to check if they're curled
        const indexTip = landmarks[8];
        const indexPIP = landmarks[6];
        const middleTip = landmarks[12];
        const middlePIP = landmarks[10];
        const ringTip = landmarks[16];
        const ringPIP = landmarks[14];
        const pinkyTip = landmarks[20];
        const pinkyPIP = landmarks[18];

        // Wrist for reference
        const wrist = landmarks[0];

        // Check if fingers are curled (tips below their PIP joints in y)
        const fingersCurled =
            indexTip.y > indexPIP.y &&
            middleTip.y > middlePIP.y &&
            ringTip.y > ringPIP.y &&
            pinkyTip.y > pinkyPIP.y;

        // Thumb must be extended (tip far from wrist)
        const thumbExtended = Math.abs(thumbTip.x - wrist.x) > 0.05 || Math.abs(thumbTip.y - wrist.y) > 0.1;

        // Calculate thumb direction (vertical)
        const thumbVertical = thumbCMC.y - thumbTip.y; // Positive = up, Negative = down

        const isThumbsUp = fingersCurled && thumbExtended && thumbVertical > THUMB_GESTURE_THRESHOLD;
        const isThumbsDown = fingersCurled && thumbExtended && thumbVertical < -THUMB_GESTURE_THRESHOLD;

        return { isThumbsUp, isThumbsDown };
    }, []);

    const detectOpenPalm = useCallback((landmarks: any[]): boolean => {
        // Check if all fingers are extended
        const fingerTips = [8, 12, 16, 20]; // Index, Middle, Ring, Pinky
        const fingerPIPs = [6, 10, 14, 18];

        const fingersExtended = fingerTips.every((tipIdx, i) => {
            return landmarks[tipIdx].y < landmarks[fingerPIPs[i]].y;
        });

        // Check thumb extension
        const thumbTip = landmarks[4];
        const thumbMCP = landmarks[2];
        const thumbExtended = Math.abs(thumbTip.x - thumbMCP.x) > 0.05;

        return fingersExtended && thumbExtended;
    }, []);

    const processResults = useCallback((results: any) => {
        const now = performance.now();
        if (now - lastProcessTime.current < 16) return; // ~60fps throttle
        lastProcessTime.current = now;

        let leftHand: HandData | null = null;
        let rightHand: HandData | null = null;

        if (results.multiHandLandmarks && results.multiHandedness) {
            for (let i = 0; i < results.multiHandLandmarks.length; i++) {
                const landmarks = results.multiHandLandmarks[i];
                const handedness = results.multiHandedness[i];
                // MediaPipe returns mirrored handedness, so we flip it
                const actualHandedness = handedness.label === 'Left' ? 'Right' : 'Left';

                const pinchData = calculatePinch(landmarks);
                const thumbGesture = detectThumbGesture(landmarks);
                const isOpenPalm = detectOpenPalm(landmarks);

                const handData: HandData = {
                    landmarks: landmarks.map((l: any) => ({ x: l.x, y: l.y, z: l.z })),
                    handedness: actualHandedness,
                    isPinching: pinchData.isPinching,
                    pinchPosition: pinchData.position,
                    pinchStrength: pinchData.strength,
                    isThumbsUp: thumbGesture.isThumbsUp,
                    isThumbsDown: thumbGesture.isThumbsDown,
                    isOpenPalm,
                };

                if (actualHandedness === 'Left') {
                    leftHand = handData;
                } else {
                    rightHand = handData;
                }
            }
        }

        setState(prev => ({
            ...prev,
            leftHand,
            rightHand,
        }));
    }, [calculatePinch, detectThumbGesture, detectOpenPalm]);

    useEffect(() => {
        let mounted = true;

        const initHands = async () => {
            const { Hands } = await import('@mediapipe/hands');

            if (!mounted) return;

            const hands = new Hands({
                locateFile: (file: string) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
                },
            });

            hands.setOptions({
                maxNumHands: 2,
                modelComplexity: 0, // Fastest model
                minDetectionConfidence: 0.7,
                minTrackingConfidence: 0.5,
            });

            hands.onResults(processResults);
            handsRef.current = hands;

            setState(prev => ({ ...prev, isReady: true }));
        };

        initHands();

        return () => {
            mounted = false;
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [processResults]);

    useEffect(() => {
        if (!state.isReady || !videoRef.current || !handsRef.current) return;

        let running = true;

        const processFrame = async () => {
            if (!running || !videoRef.current || !handsRef.current) return;

            if (videoRef.current.readyState >= 2) {
                try {
                    await handsRef.current.send({ image: videoRef.current });
                } catch (e) {
                    // Ignore send errors
                }
            }

            animationFrameRef.current = requestAnimationFrame(processFrame);
        };

        processFrame();

        return () => {
            running = false;
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [state.isReady, videoRef]);

    return state;
}
