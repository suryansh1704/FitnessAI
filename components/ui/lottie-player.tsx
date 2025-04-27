"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import type { IPlayerProps } from "@lottiefiles/react-lottie-player";

// Dynamically import the Player component with SSR disabled
const Player = dynamic(
  () => import("@lottiefiles/react-lottie-player").then(mod => mod.Player),
  { ssr: false }
);

export function LottiePlayer(props: IPlayerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder with the same dimensions until client-side rendering is complete
    return (
      <div 
        style={{ 
          height: props.style?.height || "100%", 
          width: props.style?.width || "100%"
        }}
        className="bg-purple-100/30 dark:bg-purple-900/20 rounded-lg animate-pulse"
      />
    );
  }

  return <Player {...props} />;
} 