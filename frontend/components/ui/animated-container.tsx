import React, { useEffect, useRef } from 'react';

interface AnimatedContainerProps {
  children: React.ReactNode;
  className?: string;
  duration?: number; // Duration in milliseconds
}

const AnimatedContainer: React.FC<AnimatedContainerProps> = ({ 
  children, 
  className = '',
  duration = 300 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current || !contentRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const targetHeight = entry.contentRect.height;
        
        // Update container height smoothly
        if (containerRef.current) {
          containerRef.current.style.height = `${targetHeight}px`;
        }
      }
    });
    
    // Observe the content div for size changes
    resizeObserver.observe(contentRef.current);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);
  
  return (
    <div
      ref={containerRef}
      className={`overflow-hidden ${className}`}
      style={{ 
        transition: `height ${duration}ms ease-in-out`,
      }}
    >
      <div ref={contentRef}>
        {children}
      </div>
    </div>
  );
};

export default AnimatedContainer;
