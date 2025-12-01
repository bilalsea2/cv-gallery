# Hooks Documentation

This file contains all hook source code for the Hand-Controlled Image Viewer.

## Table of Contents
- [useHandTracking.ts](#usehandtrackingts)
- [use-mobile.ts](#use-mobilets)

---

## useHandTracking.ts

**Location:** `src/hooks/useHandTracking.ts`

Custom hook for MediaPipe Hands integration with pinch and thumb gesture detection.

### Features:
- Real-time hand landmark detection
- Pinch gesture detection with configurable threshold
- Thumbs up/down gesture detection
- 60fps throttling for performance
- Support for both left and right hands

### Types:

```typescript
export interface HandData {
  landmarks: { x: number; y: number; z: number }[];
  handedness: 'Left' | 'Right';
  isPinching: boolean;
  pinchPosition: { x: number; y: number };
  pinchStrength: number;
  isThumbsUp: boolean;
  isThumbsDown: boolean;
}

export interface HandTrackingState {
  leftHand: HandData | null;
  rightHand: HandData | null;
  isReady: boolean;
}
```

### Full Source Code:

```tsx
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
        
        const handData: HandData = {
          landmarks: landmarks.map((l: any) => ({ x: l.x, y: l.y, z: l.z })),
          handedness: actualHandedness,
          isPinching: pinchData.isPinching,
          pinchPosition: pinchData.position,
          pinchStrength: pinchData.strength,
          isThumbsUp: thumbGesture.isThumbsUp,
          isThumbsDown: thumbGesture.isThumbsDown,
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
  }, [calculatePinch, detectThumbGesture]);

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
```

### Usage Example:

```tsx
import { useRef } from 'react';
import { useHandTracking } from '@/hooks/useHandTracking';

function MyComponent() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { leftHand, rightHand, isReady } = useHandTracking(videoRef);

  return (
    <div>
      <video ref={videoRef} autoPlay muted playsInline />
      {isReady && (
        <div>
          {leftHand?.isPinching && <p>Left hand pinching!</p>}
          {rightHand?.isThumbsUp && <p>Right thumbs up!</p>}
        </div>
      )}
    </div>
  );
}
```

### Configuration Constants:

| Constant | Default | Description |
|----------|---------|-------------|
| `PINCH_THRESHOLD` | 0.08 | Distance threshold for pinch detection (lower = more sensitive) |
| `THUMB_GESTURE_THRESHOLD` | 0.06 | Vertical distance for thumb gesture detection |

### MediaPipe Hand Landmarks Reference:

```
0 - Wrist
1-4 - Thumb (CMC, MCP, IP, TIP)
5-8 - Index finger (MCP, PIP, DIP, TIP)
9-12 - Middle finger (MCP, PIP, DIP, TIP)
13-16 - Ring finger (MCP, PIP, DIP, TIP)
17-20 - Pinky (MCP, PIP, DIP, TIP)
```

---

## use-mobile.ts

**Location:** `src/hooks/use-mobile.ts`

Simple hook for detecting mobile/touch devices (if needed).

```tsx
import { useState, useEffect } from 'react';

export function useMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}
```
