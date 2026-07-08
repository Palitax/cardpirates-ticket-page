import { useRef, useState, useEffect } from 'react';

interface WaterLogoImageProps {
  src: string;
  alt: string;
  className?: string;
}

export default function WaterLogoImage({ src, alt, className }: WaterLogoImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const turbulenceRef = useRef<SVGFETurbulenceElement>(null);
  const displacementRef = useRef<SVGFEDisplacementMapElement>(null);
  
  const [isHovered, setIsHovered] = useState(false);
  const mousePosRef = useRef({ x: 0.5, y: 0.5 });
  const targetMousePosRef = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    let animationFrameId: number;
    let currentScale = 0;
    let targetScale = 0;
    let phase = 0;

    const animate = () => {
      if (!displacementRef.current || !turbulenceRef.current) return;

      // Smoothly interpolate scale based on hover status
      targetScale = isHovered ? 20 : 0;
      currentScale += (targetScale - currentScale) * 0.15;

      displacementRef.current.setAttribute('scale', currentScale.toFixed(2));

      // Smoothly interpolate mouse coordinates for organic movement (water inertia)
      mousePosRef.current.x += (targetMousePosRef.current.x - mousePosRef.current.x) * 0.1;
      mousePosRef.current.y += (targetMousePosRef.current.y - mousePosRef.current.y) * 0.1;

      if (isHovered || currentScale > 0.05) {
        // Increment phase for wave animation
        phase += 0.04;

        // Modulate base frequencies based on time (phase) and mouse coordinates
        const baseFreqX = 0.012 + Math.sin(phase + mousePosRef.current.x * Math.PI) * 0.004;
        const baseFreqY = 0.045 + Math.cos(phase * 1.3 + mousePosRef.current.y * Math.PI) * 0.012;

        turbulenceRef.current.setAttribute('baseFrequency', `${baseFreqX.toFixed(5)} ${baseFreqY.toFixed(5)}`);

        // Request next frame
        animationFrameId = requestAnimationFrame(animate);
      } else {
        // Reset properties to default when hover is off and scale has decayed
        displacementRef.current.setAttribute('scale', '0');
        turbulenceRef.current.setAttribute('baseFrequency', '0.015 0.06');
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isHovered]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    // Update target mouse positions
    targetMousePosRef.current = { x, y };
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // Reset target mouse position to center
    targetMousePosRef.current = { x: 0.5, y: 0.5 };
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      className="relative cursor-pointer select-none flex justify-center items-center w-full"
      style={{
        filter: isHovered ? 'url(#water-ripple-image-filter) blur(0.4px)' : 'none',
        transition: 'filter 0.3s ease-out',
      }}
    >
      <img
        src={src}
        alt={alt}
        className={className}
      />

      {/* SVG Filter for Water Distortion Effect on Image */}
      <svg
        style={{
          position: 'absolute',
          width: 0,
          height: 0,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        <defs>
          <filter id="water-ripple-image-filter">
            <feTurbulence
              ref={turbulenceRef}
              type="fractalNoise"
              baseFrequency="0.015 0.06"
              numOctaves="2"
              result="noise"
            />
            <feDisplacementMap
              ref={displacementRef}
              in="SourceGraphic"
              in2="noise"
              scale="0"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>
    </div>
  );
}
