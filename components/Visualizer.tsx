
import React, { useEffect, useRef } from 'react';
import { VisualizerSettings } from '../types';

interface VisualizerProps {
  isPlaying: boolean;
  color: string;
  settings: VisualizerSettings;
}

const Visualizer: React.FC<VisualizerProps> = ({ isPlaying, color, settings }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Array<{ x: number, y: number, r: number, a: number, s: number }> = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const createParticles = () => {
      const maxParticles = 20 * settings.density;
      if (particles.length < maxParticles && isPlaying) {
        particles.push({
          x: canvas.width / 2,
          y: canvas.height / 2,
          r: (5 + Math.random() * 15) * settings.particleSize,
          a: settings.opacity,
          s: (0.5 + Math.random() * 2) * settings.growthSpeed
        });
      }
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (isPlaying) {
        createParticles();
      }

      particles = particles.filter(p => p.a > 0.01);
      
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.globalAlpha = p.a;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        p.r += p.s * 2;
        p.a -= 0.005;
      });

      // Central glow
      const grad = ctx.createRadialGradient(
        canvas.width/2, canvas.height/2, 0, 
        canvas.width/2, canvas.height/2, 150 * settings.particleSize
      );
      
      // Convert hex to rgba for better glow control
      const glowColor = color.startsWith('#') ? color : '#f59e0b';
      grad.addColorStop(0, `${glowColor}44`);
      grad.addColorStop(1, 'transparent');
      
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, [isPlaying, color, settings]);

  return <canvas ref={canvasRef} className="w-full h-64 md:h-80 rounded-[3rem] transition-all duration-700" />;
};

export default Visualizer;
