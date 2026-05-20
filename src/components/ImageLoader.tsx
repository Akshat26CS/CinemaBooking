import { useState, ImgHTMLAttributes } from "react";
import { cn } from "../lib/utils";

interface ImageLoaderProps extends ImgHTMLAttributes<HTMLImageElement> {
  containerClassName?: string;
  fallbackColor?: string;
}

export default function ImageLoader({ 
  src, 
  alt, 
  className, 
  containerClassName,
  fallbackColor = "bg-white/5",
  ...props 
}: ImageLoaderProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={cn("relative overflow-hidden", containerClassName)}>
      {/* Skeleton / Placeholder */}
      <div 
        className={cn(
          "absolute inset-0 transition-opacity duration-500",
          fallbackColor,
          !isLoaded ? "animate-pulse opacity-100" : "opacity-0"
        )} 
      />
      
      {/* Actual Image */}
      <img
        src={src}
        alt={alt}
        className={cn(
          className,
          "transition-opacity duration-700 ease-in-out",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
        onLoad={() => setIsLoaded(true)}
        {...props}
      />
    </div>
  );
}
