import React from "react";
import Loader from "@/components/ui/Loader";

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <div className="flex flex-col items-center space-y-4">
        <Loader size={64} />
        <p className="text-muted-foreground text-sm">Loading FLINGZZ...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;