import React from 'react';

const FloatingParticles: React.FC = () => {
    const particleCount = 25;
    const particles = Array.from({ length: particleCount });

    return (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
            {particles.map((_, i) => {
                const size = Math.random() * 5 + 2; // size between 2px and 7px
                const style = {
                    width: `${size}px`,
                    height: `${size}px`,
                    left: `${Math.random() * 100}%`,
                    animationDuration: `${Math.random() * 30 + 20}s`, // duration between 20s and 50s
                    animationDelay: `${Math.random() * -40}s`, // start at various points in the animation
                    backgroundColor: 'var(--particle-color)',
                };
                return (
                    <div
                        key={i}
                        className="particle absolute bottom-0 rounded-full"
                        style={style}
                    />
                );
            })}
        </div>
    );
};

export default FloatingParticles;