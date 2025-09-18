import { useEffect, useState } from "react";

export default function LocationFinder() {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          console.log("User location coordinates:", pos.coords.latitude, pos.coords.longitude);
          setLocation({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            accuracy: `${pos.coords.accuracy} meters`,
            source: "Geolocation API",
          });
        },
        async (err) => {
          console.warn("Geolocation error:", err.message);
          setError("User denied or unavailable — falling back to IP lookup.");
          // Fallback to IP-based API
          try {
            const res = await fetch("https://ipapi.co/json/");
            const data = await res.json();
            console.log("User location from IP lookup:", data);
            setLocation({
              lat: data.latitude,
              lon: data.longitude,
              city: data.city,
              region: data.region,
              country: data.country_name,
              source: "IP-based lookup",
            });
          } catch (e) {
            setError("IP lookup failed.");
            console.error("IP lookup error:", e);
          }
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setError("Geolocation not supported in this browser.");
    }
  }, []);

  return (
    <div className="max-w-md mx-auto mt-10 p-5 rounded-2xl shadow-lg bg-white">
      <h2 className="text-xl font-bold mb-3">User Location</h2>
      {location ? (
        <div className="space-y-2">
          <p><strong>Latitude:</strong> {location.lat}</p>
          <p><strong>Longitude:</strong> {location.lon}</p>
          {location.accuracy && <p><strong>Accuracy:</strong> {location.accuracy}</p>}
          {location.city && (
            <p>
              <strong>City:</strong> {location.city}, {location.region},{" "}
              {location.country}
            </p>
          )}
          <p className="text-sm text-gray-500">
            Source: {location.source}
          </p>
        </div>
      ) : (
        <p className="text-gray-600">{error || "Fetching location..."}</p>
      )}
    </div>
  );
}
