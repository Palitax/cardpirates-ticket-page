import { useRef, useState, useEffect } from 'react';

interface WaterLogoImageProps {
  src: string;
  alt: string;
}

export default function WaterLogoImage({ src, alt }: WaterLogoImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const topImageRef = useRef<HTMLImageElement>(null);
  const turbulenceRef = useRef<SVGFETurbulenceElement>(null);
  const displacementRef = useRef<SVGFEDisplacementMapElement>(null);

  const [isHovered, setIsHovered] = useState(false);
  
  // Track target coordinates (relative to the container)
  const targetPosRef = useRef({ x: 0, y: 0 });
  // Track interpolated coordinates (for delayed lag/inertia effect)
  const currentPosRef = useRef({ x: 0, y: 0 });
  // Track radius interpolation
  const currentRadiusRef = useRef(0);
  // Track movement energy/activity (1.0 = moving, decays to 0 when stationary)
  const activityRef = useRef(0);
  // Track interpolated scale
  const currentScaleRef = useRef(0);

  useEffect(() => {
    let animationFrameId: number;
    let phase = 0;

    const animate = () => {
      if (!topImageRef.current || !displacementRef.current || !turbulenceRef.current) return;

      const targetRadius = isHovered ? 100 : 0;
      
      // Interpolate radius for smooth expand/shrink
      currentRadiusRef.current += (targetRadius - currentRadiusRef.current) * 0.12;

      // Interpolate position for a delayed lag effect (soft water inertia)
      currentPosRef.current.x += (targetPosRef.current.x - currentPosRef.current.x) * 0.08;
      currentPosRef.current.y += (targetPosRef.current.y - currentPosRef.current.y) * 0.08;

      // Decay activity/movement energy slowly (3% decay per frame for a lingering echo effect)
      activityRef.current += (0 - activityRef.current) * 0.03;
      if (activityRef.current < 0.01) activityRef.current = 0;

      // Calculate target displacement scale based on activity
      const targetScale = activityRef.current * 25;
      currentScaleRef.current += (targetScale - currentScaleRef.current) * 0.1;
      
      displacementRef.current.setAttribute('scale', currentScaleRef.current.toFixed(2));

      // Apply CSS clipPath to the top (distorted) image relative to its bounds
      topImageRef.current.style.clipPath = `circle(${currentRadiusRef.current.toFixed(1)}px at ${currentPosRef.current.x.toFixed(1)}px ${currentPosRef.current.y.toFixed(1)}px)`;

      // Keep running the animation loop if hovered OR if scale/radius haven't fully settled yet
      if (isHovered || currentScaleRef.current > 0.05 || currentRadiusRef.current > 0.1) {
        // Slow and soft wave phase increment
        phase += 0.015;

        // Soft base frequency modulation for gentle waves
        const baseFreqX = 0.012 + Math.sin(phase) * 0.003;
        const baseFreqY = 0.045 + Math.cos(phase * 0.8) * 0.01;

        turbulenceRef.current.setAttribute('baseFrequency', `${baseFreqX.toFixed(5)} ${baseFreqY.toFixed(5)}`);

        animationFrameId = requestAnimationFrame(animate);
      } else {
        // Reset properties to default when completely idle
        displacementRef.current.setAttribute('scale', '0');
        topImageRef.current.style.clipPath = 'circle(0px at 50% 50%)';
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
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    targetPosRef.current = { x, y };
    activityRef.current = 1.0; // Reset movement energy to full strength
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsHovered(true);
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      // Initialize starting position immediately on enter to prevent jumping from previous coordinates
      targetPosRef.current = { x, y };
      currentPosRef.current = { x, y };
      activityRef.current = 1.0; // Reset movement energy on enter
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  // 3D Bevel look via stacked drop-shadows (semi-transparent white to light-gray bevel edges with a deep dark soft backing shadow)
  const logo3DFilter = `
    drop-shadow(0.5px 0.5px 0px rgba(255, 255, 255, 0.7)) 
    drop-shadow(1px 1px 0px rgba(255, 255, 255, 0.4)) 
    drop-shadow(1.5px 1.5px 0.5px rgba(255, 255, 255, 0.2)) 
    drop-shadow(4px 4px 8px rgba(0, 0, 0, 0.95))
  `.trim();

  return (
    <div className="flex justify-center items-center w-full">
      <div
        ref={containerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        className="relative cursor-pointer select-none inline-block w-[70%]"
      >
        {/* 1. Base Layer: Sharp, undistorted image with 3D Bevel Filter */}
        <img
          src={src}
          alt={alt}
          className="w-full h-auto object-contain select-none pointer-events-none"
          style={{ filter: logo3DFilter }}
        />

        {/* 2. Top Layer: Distorted image, clipped to cursor radius, with 3D Bevel Filter */}
        <img
          ref={topImageRef}
          src={src}
          alt={alt}
          className="w-full h-auto object-contain select-none pointer-events-none absolute top-0 left-0"
          style={{
            filter: `url(#water-ripple-image-filter) blur(0.3px) ${logo3DFilter}`,
            clipPath: 'circle(0px at 50% 50%)',
            willChange: 'clip-path',
          }}
        />

        {/* SVG Filter for the top layer */}
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
    </div>
  );
}
