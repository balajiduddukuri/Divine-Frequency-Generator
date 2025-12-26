
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
    let particles: Array<{ x: number, y: number, r: number, a: number, s: number, angle: number }> = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    const createParticles = () => {
      const maxParticles = 30 * settings.density;
      if (particles.length < maxParticles && isPlaying) {
        particles.push({
          x: canvas.offsetWidth / 2,
          y: canvas.offsetHeight / 2,
          r: (2 + Math.random() * 8) * settings.particleSize,
          a: settings.opacity,
          s: (0.2 + Math.random() * 1) * settings.growthSpeed,
          angle: Math.random() * Math.PI * 2
        });
      }
    };

    const render = () => {
      // Artistic trail effect
      ctx.fillStyle = 'rgba(0,0,0,0.05)';
      ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      
      if (isPlaying) {
        createParticles();
      }

      particles = particles.filter(p => p.a > 0.01);
      
      particles.forEach(p => {
        ctx.beginPath();
        // Swirl effect inspired by Starry Night
        const swirlX = p.x + Math.cos(p.angle) * p.r;
        const swirlY = p.y + Math.sin(p.angle) * p.r;
        
        ctx.arc(swirlX, swirlY, p.r * 0.5, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.globalAlpha = p.a;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        p.r += p.s * 1.5;
        p.a -= 0.003;
        p.angle += 0.02; // Rotate for swirl
      });

      // Atmospheric Glow
      const grad = ctx.createRadialGradient(
        canvas.offsetWidth/2, canvas.offsetHeight/2, 0, 
        canvas.offsetWidth/2, canvas.offsetHeight/2, 200 * settings.particleSize
      );
      
      grad.addColorStop(0, `${color}22`);
      grad.addColorStop(1, 'transparent');
      
      ctx.fillStyle = grad;
      ctx.globalAlpha = 1;
      ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, [isPlaying, color, settings]);

  return (
    <div className="relative w-full h-64 md:h-96 rounded-[4rem] overflow-hidden border border-white/10 shadow-inner">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full" 
        style={{ width: '100%', height: '100%' }}
        aria-label="Artistic sound visualizer reflecting active chanting and frequency resonance"
      />
    </div>
  );
};

export default Visualizer;
