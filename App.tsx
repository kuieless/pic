import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import Experience from './components/Experience';
import PhotoModal from './components/PhotoModal';
import { GestureType, Vector3 } from './types';
import { IMAGES } from './constants';

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [gesture, setGesture] = useState<GestureType>(GestureType.NONE);
  const [handPos, setHandPos] = useState<Vector3>([0, 0, 0]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const requestRef = useRef<number>(0);

  // Preload Images
  useEffect(() => {
    IMAGES.forEach((src) => {
        const img = new Image();
        img.src = src;
    });
  }, []);

  // Setup MediaPipe
  useEffect(() => {
    const setup = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        
        landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        
        setLoading(false);
        startCamera();
      } catch (e) {
        console.error("Failed to load MediaPipe", e);
      }
    };
    setup();
  }, []);

  const startCamera = async () => {
    if (!videoRef.current) return;
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
        videoRef.current.addEventListener('loadeddata', predictWebcam);
    } catch(err) {
        console.error("Camera denied", err);
    }
  };

  const predictWebcam = () => {
    if (!landmarkerRef.current || !videoRef.current) return;
    
    const startTimeMs = performance.now();
    if (videoRef.current.currentTime > 0) {
       const result = landmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);
       
       if (result.landmarks && result.landmarks.length > 0) {
         const landmarks = result.landmarks[0];
         
         // Hand position for subtle parallax (optional)
         const cx = landmarks[9].x; 
         const cy = landmarks[9].y;
         setHandPos([-(cx - 0.5) * 2, -(cy - 0.5) * 2, 0]);

         // Simplified Gesture Logic
         const thumbTip = landmarks[4];
         const indexTip = landmarks[8];
         const middleTip = landmarks[12];
         const ringTip = landmarks[16];
         const pinkyTip = landmarks[20];
         
         const isIndexUp = indexTip.y < landmarks[6].y;
         const isMiddleUp = middleTip.y < landmarks[10].y;
         const isRingUp = ringTip.y < landmarks[14].y;
         const isPinkyUp = pinkyTip.y < landmarks[18].y;

         // Check if at least 4 fingers are up/extended to consider it "Open Palm"
         const openFingers = [isIndexUp, isMiddleUp, isRingUp, isPinkyUp].filter(Boolean).length;

         if (openFingers >= 4) {
            setGesture(GestureType.OPEN_PALM);
         } else {
            // Default to Tree for Fist, Pointing, Pinching, etc.
            setGesture(GestureType.FIST);
         }

       } else {
         setGesture(GestureType.FIST); // Default to tree if no hand
       }
    }
    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  return (
    <div 
        className="w-full h-screen relative text-white overflow-hidden"
        style={{
            // Radial Gradient: Deep Emerald Center -> Dark Black/Green Edge
            background: 'radial-gradient(circle at 50% 50%, #003024 0%, #001510 40%, #000000 100%)'
        }}
    >
      <video ref={videoRef} autoPlay playsInline className="absolute opacity-0 pointer-events-none w-1 h-1" />

      {/* Pre-cached images hidden in DOM */}
      <div className="hidden">
        {IMAGES.map(src => <img key={src} src={src} alt="preload" />)}
      </div>

      {loading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#00100c]">
           <div className="text-4xl font-cinzel text-yellow-500 animate-pulse tracking-widest drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]">
              MERRY CHRISTMAS
           </div>
           <div className="mt-4 text-emerald-500 font-times italic">Planting the magic...</div>
        </div>
      )}

      {!loading && <Experience gesture={gesture} handPosition={handPos} />}

      <PhotoModal gesture={gesture} />

      <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none transition-opacity duration-500">
          <div className="inline-block bg-black/40 backdrop-blur-md px-8 py-3 rounded-full border border-yellow-500/30 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
             <p className="text-yellow-100 font-cinzel text-sm tracking-[0.2em] uppercase drop-shadow-md">
                {gesture === GestureType.OPEN_PALM 
                    ? "✧ Revealing Memory ✧" 
                    : "✧ Merry Christmas Qian ✧"}
             </p>
          </div>
      </div>
      
      {/* Subtle overlay to blend edges nicely */}
      <div className="absolute inset-0 pointer-events-none border-[30px] border-black/20 opacity-80" 
           style={{boxShadow: 'inset 0 0 150px #000'}}></div>
    </div>
  );
};

export default App;