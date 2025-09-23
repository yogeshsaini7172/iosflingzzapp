import React from "react";
import flingzzLogo from "@/assets/flingzz-logo.jpg";

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-pulse">
          <img 
            src={flingzzLogo} 
            alt="FLINGZZ Logo" 
            className="w-16 h-16 rounded-xl"
          />
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
        </div>
        <p className="text-muted-foreground text-sm">Loading FLINGZZ...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;