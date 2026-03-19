import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, MapPin, Clock, Users, AlertTriangle, WifiOff } from 'lucide-react';

interface UserLocation {
  id: string;
  full_name: string;
  role: string;
  department: string | null;
  latitude: number;
  longitude: number;
  location_updated_at: string | null;
}

interface UserNoGps {
  id: string;
  full_name: string;
  role: string;
  department: string | null;
}

const ROLE_COLORS: Record<string, string> = {
  admin: '#ef4444',
  operater: '#f97316',
  sef: '#8b5cf6',
  radnik: '#3b82f6',
  serviser: '#06b6d4',
  recepcioner: '#10b981',
  sobarica: '#ec4899',
  sef_domacinstva: '#a855f7',
  menadzer: '#f59e0b',
};

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return 'N/A';
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Upravo sada';
  if (diffMin < 60) return `${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}

export default function StaffLocationsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserLocation | null>(null);

  const isAdmin = user?.role === 'admin';

  const { data, isLoading, refetch } = useQuery<{ locations: UserLocation[]; noGps: UserNoGps[] }>({
    queryKey: ['/api/users/locations'],
    queryFn: getQueryFn({ on401: 'throw' }),
    refetchInterval: 30000,
    enabled: isAdmin,
  });

  if (!isAdmin) {
    return <Redirect to="/" />;
  }

  const locations = data?.locations || [];
  const noGps = data?.noGps || [];

  // Load Google Maps
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setMapError('Google Maps API ključ nije konfigurisan (VITE_GOOGLE_MAPS_API_KEY)');
      return;
    }
    if (mapLoaded || googleMapRef.current) return;

    console.log('[MAP] Loading Google Maps with key:', apiKey.substring(0, 10) + '...');

    setOptions({ apiKey, version: 'weekly' });

    importLibrary('maps').then(() => {
      if (mapRef.current && !googleMapRef.current) {
        googleMapRef.current = new google.maps.Map(mapRef.current, {
          center: { lat: 42.29, lng: 18.84 }, // Montenegro default
          zoom: 14,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
        });
        infoWindowRef.current = new google.maps.InfoWindow();
        setMapLoaded(true);
        console.log('[MAP] Google Maps loaded successfully');
      }
    }).catch((err: any) => {
      console.error('[MAP] Failed to load Google Maps:', err);
      setMapError(`Greška pri učitavanju mape: ${err.message}`);
    });
  }, []);

  // Update markers when locations change
  const updateMarkers = useCallback(() => {
    if (!googleMapRef.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      marker.setMap(null);
    });
    markersRef.current = [];

    if (locations.length === 0) return;

    const bounds = new google.maps.LatLngBounds();

    locations.forEach((loc) => {
      const position = { lat: loc.latitude, lng: loc.longitude };
      bounds.extend(position);

      const color = ROLE_COLORS[loc.role] || '#6b7280';

      const marker = new google.maps.Marker({
        map: googleMapRef.current!,
        position,
        title: loc.full_name,
        label: {
          text: loc.full_name.charAt(0),
          color: 'white',
          fontWeight: 'bold',
          fontSize: '12px',
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 14,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 3,
        },
      });

      marker.addListener('click', () => {
        setSelectedUser(loc);
        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(`
            <div style="padding: 8px; min-width: 150px;">
              <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${loc.full_name}</div>
              <div style="color: #666; font-size: 12px;">${t(loc.role)}</div>
              ${loc.department ? `<div style="color: #666; font-size: 12px;">${t(loc.department)}</div>` : ''}
              <div style="color: #999; font-size: 11px; margin-top: 4px;">Ažurirano: ${formatTimeAgo(loc.location_updated_at)}</div>
            </div>
          `);
          infoWindowRef.current.open(googleMapRef.current!, marker);
        }
      });

      markersRef.current.push(marker);
    });

    if (locations.length > 1) {
      googleMapRef.current.fitBounds(bounds, 80);
    } else if (locations.length === 1) {
      googleMapRef.current.setCenter({ lat: locations[0].latitude, lng: locations[0].longitude });
      googleMapRef.current.setZoom(16);
    }
  }, [locations, mapLoaded, t]);

  useEffect(() => {
    updateMarkers();
  }, [updateMarkers]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('staffLocations')}</h1>
          <p className="text-muted-foreground text-sm">
            GPS lokacije aktivnih korisnika u realnom vremenu
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-1">
            <Users className="h-3 w-3" />
            {locations.length} online
          </Badge>
          {noGps.length > 0 && (
            <Badge variant="outline" className="gap-1 border-red-300 text-red-600">
              <WifiOff className="h-3 w-3" />
              {noGps.length} bez GPS
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Osvježi
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Map */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-0 relative">
              {mapError ? (
                <div className="w-full h-[600px] rounded-lg flex items-center justify-center bg-gray-50">
                  <div className="text-center p-6">
                    <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">{mapError}</p>
                  </div>
                </div>
              ) : (
                <div ref={mapRef} className="w-full h-[600px] rounded-lg" />
              )}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - User list */}
        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Osoblje na mapi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {locations.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nema korisnika sa aktivnom lokacijom. Korisnici moraju dozvoliti GPS u browseru.
                </p>
              ) : (
                locations.map((loc) => (
                  <div
                    key={loc.id}
                    className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors hover:bg-muted ${
                      selectedUser?.id === loc.id ? 'bg-muted ring-1 ring-primary' : ''
                    }`}
                    onClick={() => {
                      setSelectedUser(loc);
                      if (googleMapRef.current) {
                        googleMapRef.current.panTo({ lat: loc.latitude, lng: loc.longitude });
                        googleMapRef.current.setZoom(17);
                      }
                    }}
                  >
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: ROLE_COLORS[loc.role] || '#6b7280' }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{loc.full_name}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(loc.location_updated_at)}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {t(loc.role)}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Users without GPS */}
          {noGps.length > 0 && (
            <Card className="border-red-200 bg-red-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-1 text-red-700">
                  <WifiOff className="h-4 w-4" />
                  GPS isključen ({noGps.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {noGps.map((user) => (
                  <div key={user.id} className="flex items-center gap-2 p-1.5 rounded-md">
                    <div
                      className="w-3 h-3 rounded-full shrink-0 opacity-40"
                      style={{ backgroundColor: ROLE_COLORS[user.role] || '#6b7280' }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate text-red-800">{user.full_name}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0 border-red-300 text-red-600">
                      {t(user.role)}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Selected user info */}
          {selectedUser && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {selectedUser.full_name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Rola:</span> {t(selectedUser.role)}</p>
                {selectedUser.department && (
                  <p><span className="text-muted-foreground">Odjeljenje:</span> {t(selectedUser.department)}</p>
                )}
                <p><span className="text-muted-foreground">Koordinate:</span> {selectedUser.latitude.toFixed(5)}, {selectedUser.longitude.toFixed(5)}</p>
                <p><span className="text-muted-foreground">Ažurirano:</span> {formatTimeAgo(selectedUser.location_updated_at)}</p>
              </CardContent>
            </Card>
          )}

          {/* Legend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Legenda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {Object.entries(ROLE_COLORS).map(([role, color]) => (
                <div key={role} className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                  <span>{t(role)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
