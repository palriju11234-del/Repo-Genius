import React, { useEffect, useRef, useState } from 'react';

export const BackgroundVideo: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [opacity, setOpacity] = useState<number>(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let animationFrameId: number;

    const checkTime = () => {
      if (video && video.duration) {
        const currentTime = video.currentTime;
        const duration = video.duration;
        const fadeDuration = 0.5; // 0.5s fade-in / fade-out duration

        let targetOpacity = 1;

        if (currentTime < fadeDuration) {
          // Fade in over 0.5s at the start (opacity 0 to 1)
          targetOpacity = currentTime / fadeDuration;
        } else if (currentTime > duration - fadeDuration) {
          // Fade out over 0.5s before the end (opacity 1 to 0)
          targetOpacity = Math.max(0, (duration - currentTime) / fadeDuration);
        } else {
          // Normal playback in the middle
          targetOpacity = 1;
        }

        setOpacity(targetOpacity);
      }
      animationFrameId = requestAnimationFrame(checkTime);
    };

    // Begin looping checks
    animationFrameId = requestAnimationFrame(checkTime);

    // Make sure it starts playing automatically if possible
    video.play().catch(err => {
      console.warn("Autoplay was prevented, waiting for user interaction.", err);
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleEnded = () => {
    const video = videoRef.current;
    if (!video) return;

    // On ended event: set opacity to 0, wait 100ms, reset currentTime = 0, then play() again
    setOpacity(0);
    
    setTimeout(() => {
      if (video) {
        video.currentTime = 0;
        video.play().catch(err => console.log("Video playback loop error:", err));
      }
    }, 100);
  };

  return (
    <div 
      className="absolute z-0" 
      style={{
        top: '300px',
        inset: 'auto 0 0 0',
      }}
    >
      <div className="relative w-full h-full min-h-[400px] md:min-h-[500px] lg:min-h-[600px] overflow-hidden">
        <video
          ref={videoRef}
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_083109_283f3553-e28f-428b-a723-d639c617eb2b.mp4"
          className="w-full h-full object-cover transition-opacity duration-75"
          style={{ opacity: opacity }}
          muted
          playsInline
          autoPlay
          onEnded={handleEnded}
        />
        
        {/* Gradient overlays: absolute inset-0 bg-gradient-to-b from-white via-transparent to-white */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white pointer-events-none" />
      </div>
    </div>
  );
};
