import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import MobileApp from "./MobileApp";
import "../index.css";

console.log("📱 Starting FLINGZZ Mobile App...");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MobileApp />
  </StrictMode>
);