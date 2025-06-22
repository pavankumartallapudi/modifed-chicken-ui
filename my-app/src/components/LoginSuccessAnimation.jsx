import React, { useEffect, useMemo } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import './LoginSuccessAnimation.css';

const baseFoodIcons = [
  '🍩', '🍕', '🍔', '🍟', '🍜', '🍣', '🍦', '🍰', '🍪', '🍿', '🌮', '🥗'
];

// Repeat the base array to get enough icons for 150 items
const foodIcons = Array.from({ length: 13 }).flatMap(() => baseFoodIcons).slice(0, 150);

const LoginSuccessAnimation = ({ onAnimationEnd }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onAnimationEnd();
    }, 5000); // Increased duration to 5 seconds
    return () => clearTimeout(timer);
  }, [onAnimationEnd]);

  const items = useMemo(() => Array.from({ length: 150 }).map((_, index) => ({
    icon: foodIcons[index],
    style: {
      '--x': `${(Math.random() - 0.5) * 2 * 100}vw`,
      '--y': `${(Math.random() - 0.5) * 2 * 100}vh`,
      '--rotate': `${(Math.random() - 0.5) * 720}deg`,
      '--delay': `${Math.random() * 0.2}s`
    }
  })), []);

  return (
    <div className="animation-container">
      {/* Lottie animation in the center */}
      <div className="lottie-wrapper">
        <DotLottieReact
          src="/animations/blast.lottie"
          loop={false}
          autoplay
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Food items blasting from behind */}
      {items.map((item, index) => (
        <div key={index} className="food-item" style={item.style}>
          {item.icon}
        </div>
      ))}
    </div>
  );
};

export default LoginSuccessAnimation; 