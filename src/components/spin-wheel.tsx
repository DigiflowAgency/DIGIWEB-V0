'use client';

import { useEffect, useRef, useState } from 'react';

interface User {
  id: string;
  firstName: string;
  lastName: string;
}

interface SpinWheelProps {
  users: User[];
  selectedIndex: number;
  isSpinning: boolean;
  onSpinEnd: () => void;
}

// Couleurs pour les segments de la roue
const SEGMENT_COLORS = [
  '#3B82F6', // blue
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#F59E0B', // amber
  '#10B981', // emerald
  '#06B6D4', // cyan
  '#EF4444', // red
  '#84CC16', // lime
];

export default function SpinWheel({ users, selectedIndex, isSpinning, onSpinEnd }: SpinWheelProps) {
  const [rotation, setRotation] = useState(0);
  const prevSpinningRef = useRef(false);
  const rotationRef = useRef(0);
  const onSpinEndRef = useRef(onSpinEnd);

  // Mettre à jour la ref du callback
  onSpinEndRef.current = onSpinEnd;

  useEffect(() => {
    // Seulement déclencher quand isSpinning passe de false à true
    if (isSpinning && !prevSpinningRef.current) {
      // Calculer l'angle pour s'arrêter sur l'utilisateur sélectionné
      const segmentAngle = 360 / users.length;
      // Position de l'utilisateur (en haut = 0°)
      const targetAngle = segmentAngle * selectedIndex;
      // Ajouter plusieurs tours (3-5 tours) + l'angle cible
      const spins = 1 + Math.random(); // 1-2 tours (plus rapide)
      const newRotation = rotationRef.current + (360 * spins) + (360 - targetAngle) - (segmentAngle / 2);

      rotationRef.current = newRotation;
      setRotation(newRotation);

      // Callback après la fin de l'animation
      const timer = setTimeout(() => {
        onSpinEndRef.current();
      }, 450); // Durée de l'animation + marge

      prevSpinningRef.current = true;
      return () => clearTimeout(timer);
    }

    if (!isSpinning) {
      prevSpinningRef.current = false;
    }
  }, [isSpinning, selectedIndex, users.length]);

  const segmentAngle = 360 / users.length;

  return (
    <div className="relative w-64 h-64 mx-auto">
      {/* Indicateur (flèche en haut) */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-20">
        <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-gray-800" />
      </div>

      {/* Roue */}
      <div
        className="w-full h-full rounded-full relative overflow-hidden shadow-xl border-4 border-gray-800"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: isSpinning ? 'transform 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)' : 'none',
        }}
      >
        {/* Segments */}
        {users.map((user, index) => {
          const startAngle = index * segmentAngle;
          const color = SEGMENT_COLORS[index % SEGMENT_COLORS.length];

          return (
            <div
              key={user.id}
              className="absolute w-full h-full"
              style={{
                transform: `rotate(${startAngle}deg)`,
              }}
            >
              {/* Segment coloré */}
              <div
                className="absolute top-0 left-1/2 origin-bottom h-1/2 w-1/2"
                style={{
                  transform: `rotate(${-segmentAngle / 2}deg)`,
                  clipPath: `polygon(0 0, 100% 0, 50% 100%)`,
                  backgroundColor: color,
                }}
              />
              <div
                className="absolute top-0 left-1/2 origin-bottom h-1/2 w-1/2"
                style={{
                  transform: `rotate(${segmentAngle / 2}deg) scaleX(-1)`,
                  clipPath: `polygon(0 0, 100% 0, 50% 100%)`,
                  backgroundColor: color,
                }}
              />

              {/* Texte du segment */}
              <div
                className="absolute top-[15%] left-1/2 transform -translate-x-1/2 text-white font-bold text-xs text-center whitespace-nowrap"
                style={{
                  textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                  maxWidth: '80px',
                }}
              >
                {user.firstName}
              </div>
            </div>
          );
        })}

        {/* Centre de la roue */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-gray-800 shadow-lg flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500" />
        </div>
      </div>
    </div>
  );
}
