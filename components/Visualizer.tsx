
import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  isPlaying: boolean;
  color: string;
}

const Visualizer: React.FC<VisualizerProps> = ({ isPlaying, color }) => {
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
      if (particles.length < 50 && isPlaying) {
        particles.push({
          x: canvas.width / 2,
          y: canvas.height / 2,
          r: 10 + Math.random() * 20,
          a: 1,
          s: 0.5 + Math.random() * 2
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
        ctx.lineWidth = 2;
        ctx.stroke();
        
        p.r += p.s * 2;
        p.a -= 0.005;
      });

      // Central glow
      const grad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, 150);
      grad.addColorStop(0, color.replace(')', ', 0.3)').replace('rgb', 'rgba'));
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
  }, [isPlaying, color]);

  return <canvas ref={canvasRef} className="w-full h-64 md:h-80 rounded-3xl" />;
};

export default Visualizer;
