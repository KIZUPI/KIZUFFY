import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart } from 'lucide-react';

interface Spark {
  id: number;
  x: number;
  y: number;
  delay: number;
}

interface SparkleEffectProps {
  heartColor?: string;
  count?: number;
  children?: React.ReactNode;
}

export function SparkleEffect({ heartColor = '#f43f5e', count = 15, children }: SparkleEffectProps) {
  const [sparks, setSparks] = useState<Spark[]>([]);

  const trigger = useCallback(() => {
    const newSparks = Array.from({ length: count }, (_, i) => ({
      id: Math.random() + i,
      x: (Math.random() - 0.5) * 200,
      y: (Math.random() - 0.5) * 200 - 50,
      delay: Math.random() * 0.2,
    }));
    setSparks(newSparks);
  }, [count]);

  return React.createElement('div', { className: 'relative' },
    React.createElement('div', { onClick: trigger, className: 'cursor-pointer' }, children),
    React.createElement(AnimatePresence, null,
      ...sparks.map(spark =>
        React.createElement(motion.div, {
          key: spark.id,
          initial: { x: 0, y: 0, opacity: 1, scale: 1 },
          animate: { x: spark.x, y: spark.y, opacity: 0, scale: 0.3 },
          transition: { delay: spark.delay, duration: 1.2, ease: 'easeOut' },
          className: 'absolute z-30 pointer-events-none',
          style: { top: '35%', left: '50%' },
        },
          React.createElement(Heart, {
            className: 'w-3 h-3',
            style: { color: heartColor, fill: heartColor },
          })
        )
      )
    )
  );
}
