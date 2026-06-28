import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

const MapPreview = dynamic(() => import('./MapPreview'), { 
  ssr: false,
  loading: () => <div className="h-48 w-full bg-slate-100 animate-pulse rounded-md" />
});

export interface LocationData {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
}

interface LocationCardProps {
  onLocationCapture: (data: LocationData) => void;
  locationStatus: 'NOT_CAPTURED' | 'CAPTURED' | 'DENIED' | 'LOADING';
  setLocationStatus: (status: 'NOT_CAPTURED' | 'CAPTURED' | 'DENIED' | 'LOADING') => void;
  accuracy: number | null;
  latitude: number | null;
  longitude: number | null;
}

export const LocationCard: React.FC<LocationCardProps> = ({ 
  onLocationCapture, 
  locationStatus, 
  setLocationStatus,
  accuracy,
  latitude,
  longitude
}) => {
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const handleGetLocation = () => {
    setLocationStatus('LOADING');
    
    if (!navigator.geolocation) {
      setLocationStatus('DENIED');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        onLocationCapture({ latitude, longitude, accuracy });
        setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        setLocationStatus('CAPTURED');
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocationStatus('DENIED');
        onLocationCapture({ latitude: null, longitude: null, accuracy: null });
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <Card className="glass-card transition-all duration-300">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="h-5 w-5 text-blue-500" />
          Location Verification
        </CardTitle>
        <CardDescription>
          Verify your physical location to authenticate this waste log.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Status</span>
            {locationStatus === 'NOT_CAPTURED' && (
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                <span className="h-2.5 w-2.5 rounded-full border-2 border-slate-400"></span>
                Not Verified
              </div>
            )}
            {locationStatus === 'LOADING' && (
              <div className="flex items-center gap-2 text-blue-600 font-medium">
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying...
              </div>
            )}
            {locationStatus === 'CAPTURED' && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-emerald-600 font-medium">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                  Verified
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-300 mt-1">
                  <div>
                    <span className="block text-xs text-slate-400 dark:text-slate-500">Accuracy</span>
                    ±{accuracy ? Math.round(accuracy) : '-'} m
                  </div>
                  <div>
                    <span className="block text-xs text-slate-400 dark:text-slate-500">Last Updated</span>
                    {lastUpdated || '-'}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 mt-2 font-medium bg-emerald-50 dark:bg-emerald-950/50 p-2 rounded-md">
                  <CheckCircle2 className="h-4 w-4" />
                  Ready to Submit
                </div>
                
                {locationStatus === 'CAPTURED' && latitude !== null && longitude !== null && (
                  <div className="mt-4">
                    <MapPreview latitude={latitude} longitude={longitude} />
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
                      Lat: {latitude.toFixed(6)}, Lng: {longitude.toFixed(6)}
                    </div>
                  </div>
                )}
              </div>
            )}
            {locationStatus === 'DENIED' && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-rose-600 font-medium">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span>
                  Permission Denied
                </div>
                <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-100 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 p-3 rounded-md text-sm flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <p>Location access is required to submit a waste log. Please allow location access in your browser and try again.</p>
                </div>
              </div>
            )}
          </div>

          {(locationStatus === 'NOT_CAPTURED' || locationStatus === 'DENIED') && (
            <Button 
              onClick={handleGetLocation} 
              variant={locationStatus === 'DENIED' ? 'outline' : 'default'}
              className={locationStatus === 'NOT_CAPTURED' ? 'bg-emerald-700 hover:bg-emerald-800 text-white' : ''}
            >
              {locationStatus === 'DENIED' ? 'Retry Location' : 'Get Current Location'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
