import React, { useEffect, useState } from 'react';
import { IMAGES } from '../constants';
import { GestureType } from '../types';

interface PhotoModalProps {
  gesture: GestureType;
}

const PhotoModal: React.FC<PhotoModalProps> = ({ gesture }) => {
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    if (gesture === GestureType.OPEN_PALM) {
        // Pick random image if not already showing one
        if (!activeImage) {
            const randomImg = IMAGES[Math.floor(Math.random() * IMAGES.length)];
            setActiveImage(randomImg);
            // Fade in
            setTimeout(() => setOpacity(1), 100);
        }
    } else {
        // Fade out then clear
        setOpacity(0);
        const t = setTimeout(() => setActiveImage(null), 500);
        return () => clearTimeout(t);
    }
  }, [gesture]);

  if (!activeImage) return null;

  return (
    <div 
        className="fixed inset-0 pointer-events-none flex items-center justify-center z-50 transition-opacity duration-700 ease-in-out"
        style={{ opacity }}
    >
        <div className="relative p-4 bg-black/60 backdrop-blur-md border border-yellow-600/50 rounded-lg shadow-[0_0_50px_rgba(255,215,0,0.3)] transform transition-transform duration-700 scale-100">
            <div className="absolute -top-2 -left-2 w-8 h-8 border-t-2 border-l-2 border-yellow-500"></div>
            <div className="absolute -top-2 -right-2 w-8 h-8 border-t-2 border-r-2 border-yellow-500"></div>
            <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-2 border-l-2 border-yellow-500"></div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-2 border-r-2 border-yellow-500"></div>
            
            <img 
                src={activeImage} 
                alt="Memory" 
                className="max-h-[60vh] max-w-[80vw] object-cover rounded shadow-2xl"
            />
            <p className="text-center text-yellow-500 font-cinzel mt-4 text-xl tracking-widest text-shadow-glow">
                Merry Christmas
            </p>
        </div>
    </div>
  );
};

export default PhotoModal;