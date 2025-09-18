import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { updateUserLocation } from '../../services/profile';

const reverseGeocode = async (lat, lon) => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
    const data = await res.json();
    return {
      city: data.address?.city || data.address?.town || data.address?.village || 'Unknown',
      region: data.address?.state || '',
      country: data.address?.country || 'Unknown',
    };
  } catch {
    return { city: 'Unknown', region: '', country: 'Unknown' };
  }
};

const TinderProfileCard = ({ profile, onLike, onDislike }) => {
  const { userId } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [userLocation, setUserLocation] = useState({ lat: null, lon: null, city: null, region: null, country: null, source: null });
  const [locationError, setLocationError] = useState('');

  const handleLike = () => {
    setIsLiked(true);
    setIsDisliked(false);
    if (onLike) onLike(profile);
  };

  const handleDislike = () => {
    setIsDisliked(true);
    setIsLiked(false);
    if (onDislike) onDislike(profile);
  };

  const getDisplayLocation = () => {
    if (profile.id === userId) {
      if (userLocation.city && userLocation.country) {
        return `${userLocation.city}, ${userLocation.country}`;
      } else if (locationError) {
        return locationError;
      } else {
        return 'Fetching location...';
      }
    } else {
      try {
        const loc = JSON.parse(profile.location);
        if (loc.city && loc.country) {
          return `${loc.city}, ${loc.country}`;
        } else {
          return profile.location;
        }
      } catch {
        return profile.location;
      }
    }
  };

  useEffect(() => {
    if (profile.id !== userId) return; // Only fetch and save for own profile

    const fetchLocation = async () => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { city, region, country } = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
            setUserLocation({
              lat: pos.coords.latitude,
              lon: pos.coords.longitude,
              city,
              region,
              country,
              source: "Geolocation API",
            });
            await updateUserLocation({ city, region, country, latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          },
          async (err) => {
            console.warn("Geolocation error:", err.message);
            // Fallback to IP lookup
            try {
              const res = await fetch("https://ipapi.co/json/");
              const data = await res.json();
              setUserLocation({
                lat: data.latitude,
                lon: data.longitude,
                city: data.city,
                region: data.region,
                country: data.country_name,
                source: "IP-based lookup",
              });
              await updateUserLocation({ city: data.city, region: data.region, country: data.country_name, latitude: data.latitude, longitude: data.longitude });
            } catch (e) {
              setLocationError("Failed to get location");
            }
          },
          { enableHighAccuracy: true, timeout: 8000 }
        );
      } else {
        setLocationError("Geolocation not supported");
      }
    };
    fetchLocation();
  }, [profile.id, userId]);

  return (
    <div className="relative bg-black flex flex-col lg:h-screen">
      {/* Background Image */}
      <div
        className="h-96 lg:absolute lg:inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: profile.image && profile.image.trim() !== ''
            ? `url(${profile.image})`
            : `url(https://placehold.co/400x700/1a1a1a/ffffff?text=No+Image)`,
        }}
      ></div>

      {/* Overlay - only on lg */}
      <div className="hidden lg:block absolute inset-0 bg-black bg-opacity-60"></div>

      {/* Profile Info */}
      <div className="lg:relative lg:z-10 lg:flex lg:flex-col lg:justify-end p-6 text-white lg:p-6">
        {/* Premium Badge */}
        {profile.isPremium && (
          <div className="flex items-center space-x-1 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.12a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.12a1 1 0 00-1.175 0l-3.976 2.12c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.12c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <span className="text-xs text-yellow-400 font-medium">PREMIUM</span>
          </div>
        )}

        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold">{profile.name}</h1>
            <p className="text-xl text-gray-300">{profile.age}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          <span className="text-gray-300">
            {getDisplayLocation()}
          </span>
        </div>

        <div className="flex space-x-2 mb-4">
          <div className="flex items-center space-x-1 bg-gray-800 bg-opacity-80 px-3 py-1 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-pink-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.414L11 9.586V7z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-gray-300">{profile.distance}</span>
          </div>
          <div className="flex items-center space-x-1 bg-gray-800 bg-opacity-80 px-3 py-1 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.414L11 9.586V7z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-gray-300">{profile.weight}</span>
          </div>
          <div className="flex items-center space-x-1 bg-gray-800 bg-opacity-80 px-3 py-1 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.414L11 9.586V7z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-gray-300">{profile.height}</span>
          </div>
        </div>

        {/* About Section */}
        <div className="bg-black bg-opacity-50 backdrop-blur-sm rounded-2xl p-4 mb-4 max-h-32 overflow-y-auto text-gray-300 text-sm leading-relaxed">
          {profile.about}
        </div>

        {/* Interests */}
        <div className="flex flex-wrap gap-2 mb-6">
          {profile.interests.map((interest, index) => (
            <div
              key={index}
              className="flex items-center space-x-1 bg-gray-800 bg-opacity-80 px-3 py-1 rounded-full text-xs"
            >
              <span className="text-lg">{interest.icon}</span>
              <span className="text-gray-300">{interest.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="relative z-10 flex items-center justify-between p-4 mt-auto">
        <button
          onClick={handleDislike}
          className={`w-16 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
            isDisliked ? 'bg-red-500 text-white' : 'bg-white text-gray-800'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
  <path d="M12.1 8.64l-.1.1-.1-.1A5.34 5.34 0 006 7a5.5 5.5 0 000 11h.28l5.82 5.82 5.82-5.82H18a5.5 5.5 0 000-11 5.34 5.34 0 00-5.9 1.64zm-1.6 4.36l1.5-2 1.5 2-2 2.5 2 2.5-1.5 2-3.5-4.5 3.5-4.5z"/>
</svg>
        </button>

        <button
          onClick={handleLike}
          className={`w-16 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
            isLiked ? 'bg-pink-500 text-white' : 'bg-pink-500 text-white'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
  <path fillRule="evenodd" d="M3.172 5.172a7 7 0 119.9 9.9L10 18.9l-6.828-6.829a7 7 0 010-9.9z" clipRule="evenodd" />
</svg>

        </button>
      </div>
    </div>
  );
};

export default TinderProfileCard;
