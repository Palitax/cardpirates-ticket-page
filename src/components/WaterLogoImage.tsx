import { useRef, useState, useEffect } from 'react';

interface WaterLogoImageProps {
  src: string;
  alt: string;
}

interface TrailPoint {
  x: number;
  y: number;
}

export default function WaterLogoImage({ src, alt }: WaterLogoImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const topImageRef = useRef<HTMLImageElement>(null);
  const turbulenceRef = useRef<SVGFETurbulenceElement>(null);
  const displacementRef = useRef<SVGFEDisplacementMapElement>(null);

  const [isHovered, setIsHovered] = useState(false);
  
  // Track target coordinates (relative to the container)
  const targetPosRef = useRef({ x: 0, y: 0 });
  // Track smooth interpolated coordinates
  const currentPosRef = useRef({ x: 0, y: 0 });
  // Track history of positions to draw the trailing wake
  const trailRef = useRef<TrailPoint[]>([]);
  // Track movement energy/activity (1.0 = moving, decays to 0 when stationary)
  const activityRef = useRef(0);
  // Track interpolated scale
  const currentScaleRef = useRef(0);

  useEffect(() => {
    let animationFrameId: number;
    let phase = 0;

    const animate = () => {
      if (!topImageRef.current || !displacementRef.current || !turbulenceRef.current) return;

      // Interpolate current position towards target position (faster responsive tracking)
      currentPosRef.current.x += (targetPosRef.current.x - currentPosRef.current.x) * 0.14;
      currentPosRef.current.y += (targetPosRef.current.y - currentPosRef.current.y) * 0.14;

      // Add current position to the trail history
      const trail = trailRef.current;
      trail.unshift({ x: currentPosRef.current.x, y: currentPosRef.current.y });
      
      // Limit trail length to 8 points for an elegant wake trail
      if (trail.length > 8) {
        trail.pop();
      }

      // Decay activity/movement energy slowly (3% decay per frame for a lingering echo effect)
      activityRef.current += (0 - activityRef.current) * 0.03;
      if (activityRef.current < 0.01) activityRef.current = 0;

      // Calculate target displacement scale based on activity
      const targetScale = activityRef.current * 25;
      currentScaleRef.current += (targetScale - currentScaleRef.current) * 0.1;
      
      displacementRef.current.setAttribute('scale', currentScaleRef.current.toFixed(2));

      // Build CSS mask gradient string from trail history (combining soft radial gradients)
      if (trail.length > 0) {
        const maskGradients = trail.map((point, index) => {
          // Calculate factor (1.0 at front, decreases towards the back of the trail)
          const factor = 1 - index / trail.length;
          
          // Radius shrinks along the trail to create a tapered teardrop/wake shape
          const baseRadius = 60 * factor;
          const radius = baseRadius * (isHovered ? 1 : Math.min(1, currentScaleRef.current * 2));
          
          // Opacity decreases along the trail
          const opacity = activityRef.current * factor;

          // Soft radial gradient: solid alpha at center, feathered edges fading to transparent
          return `radial-gradient(circle ${radius.toFixed(1)}px at ${point.x.toFixed(1)}px ${point.y.toFixed(1)}px, rgba(0,0,0,${opacity.toFixed(2)}) 0%, rgba(0,0,0,0) 100%)`;
        }).join(', ');

        topImageRef.current.style.maskImage = maskGradients;
        topImageRef.current.style.webkitMaskImage = maskGradients;
      } else {
        topImageRef.current.style.maskImage = 'none';
        topImageRef.current.style.webkitMaskImage = 'none';
      }

      // Keep running the animation loop if hovered OR if scale/activity haven't fully settled yet
      if (isHovered || currentScaleRef.current > 0.05 || activityRef.current > 0.01) {
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
        topImageRef.current.style.maskImage = 'none';
        topImageRef.current.style.webkitMaskImage = 'none';
        trailRef.current = [];
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
      // Initialize starting coordinates immediately
      targetPosRef.current = { x, y };
      currentPosRef.current = { x, y };
      // Seed initial trail points to start exactly at entrance point
      trailRef.current = Array(5).fill(null).map(() => ({ x, y }));
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

        {/* 2. Top Layer: Distorted image, clipped to trailing mask, with 3D Bevel Filter */}
        <img
          ref={topImageRef}
          src={src}
          alt={alt}
          className="w-full h-auto object-contain select-none pointer-events-none absolute top-0 left-0"
          style={{
            filter: `url(#water-ripple-image-filter) blur(0.3px) ${logo3DFilter}`,
            willChange: 'mask-image, webkit-mask-image',
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
