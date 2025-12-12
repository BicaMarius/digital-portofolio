import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps {
  value?: number[];
  defaultValue?: number[];
  onValueChange?: (value: number[]) => void;
  onValueCommit?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ 
    value, 
    defaultValue = [0], 
    onValueChange, 
    onValueCommit,
    min = 0, 
    max = 100, 
    step = 1, 
    disabled = false,
    className 
  }, ref) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue[0]);
    const [isHovered, setIsHovered] = React.useState(false);
    const [isDragging, setIsDragging] = React.useState(false);
    const trackRef = React.useRef<HTMLDivElement>(null);
    
    const currentValue = value !== undefined ? value[0] : internalValue;
    const percentage = Math.max(0, Math.min(100, ((currentValue - min) / (max - min)) * 100));

    const getValueFromClientX = (clientX: number) => {
      if (!trackRef.current) return currentValue;
      
      const rect = trackRef.current.getBoundingClientRect();
      const position = (clientX - rect.left) / rect.width;
      const clampedPosition = Math.max(0, Math.min(1, position));
      let newValue = min + clampedPosition * (max - min);
      
      // Round to step
      newValue = Math.round(newValue / step) * step;
      return Math.max(min, Math.min(max, newValue));
    };

    const updateValue = (newValue: number) => {
      if (value === undefined) {
        setInternalValue(newValue);
      }
      onValueChange?.([newValue]);
    };

    // Unified pointer handlers that work for both mouse and touch
    React.useEffect(() => {
      if (!isDragging) return;

      const handlePointerMove = (e: PointerEvent) => {
        e.preventDefault();
        const newValue = getValueFromClientX(e.clientX);
        updateValue(newValue);
      };

      const handlePointerUp = () => {
        setIsDragging(false);
        onValueCommit?.([currentValue]);
      };

      // Use pointer events for unified mouse/touch handling
      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
      document.addEventListener('pointercancel', handlePointerUp);

      return () => {
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);
        document.removeEventListener('pointercancel', handlePointerUp);
      };
    }, [isDragging, currentValue, min, max, step]);

    const handlePointerDown = (e: React.PointerEvent) => {
      if (disabled) return;
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setIsDragging(true);
      setIsHovered(true);
      const newValue = getValueFromClientX(e.clientX);
      updateValue(newValue);
    };

    const showThumb = isHovered || isDragging;

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex w-full select-none items-center touch-none",
          disabled && "opacity-50 pointer-events-none",
          className
        )}
        style={{ height: '16px', cursor: 'pointer' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => !isDragging && setIsHovered(false)}
      >
        {/* Track container - full height for easier clicking */}
        <div
          ref={trackRef}
          className="relative w-full h-full flex items-center"
          onPointerDown={handlePointerDown}
        >
          {/* Visual track */}
          <div
            className={cn(
              "absolute w-full rounded-full bg-secondary/50 transition-all duration-100",
              showThumb ? "h-[6px]" : "h-1"
            )}
          >
            {/* Filled range */}
            <div
              className="absolute h-full rounded-full bg-primary"
              style={{ width: `${percentage}%` }}
            />
          </div>
          
          {/* Thumb */}
          <div
            className={cn(
              "absolute rounded-full bg-white shadow-lg pointer-events-none",
              "transition-[width,height,opacity] duration-100",
              showThumb ? "w-3 h-3 opacity-100" : "w-0 h-0 opacity-0",
              isDragging && "scale-110"
            )}
            style={{ 
              left: `${percentage}%`,
              top: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          />
        </div>
      </div>
    );
  }
);
Slider.displayName = "Slider";

export { Slider };
