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
import { RefreshCw, MapPin, Clock, AlertTriangle, CircleOff } from 'lucide-react';

interface UserLocation {
  id: string;
  full_name: string;
  role: string;
  department: string | null;
  latitude: number;
  longitude: number;
  location_updated_at: string | null;
  last_active_at: string | null;
  is_online: boolean;
}

interface UserOnlineNoGps {
  id: string;
  full_name: string;
  role: string;
  department: string | null;
  last_active_at: string | null;
}

interface UserOffline {
  id: string;
  full_name: string;
  role: string;
  department: string | null;
  last_active_at: string | null;
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

  if (diffMin < 1) return 'upravo sada';
  if (diffMin < 60) return `prije ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `prije ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `prije ${diffDays}d`;
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

  const { data, isLoading, refetch } = useQuery<{ locations: UserLocation[]; onlineNoGps: UserOnlineNoGps[]; offline: UserOffline[] }>({
    queryKey: ['/api/users/locations'],
    queryFn: getQueryFn({ on401: 'throw' }),
    refetchInterval: 30000,
    enabled: isAdmin,
  });

  if (!isAdmin) {
    return <Redirect to="/" />;
  }

  const locations = data?.locations || [];
  const onlineNoGps = data?.onlineNoGps || [];
  const offline = data?.offline || [];

  const onlineCount = locations.filter(l => l.is_online).length + onlineNoGps.length;
  const totalOnMap = locations.length;

  // Load Google Maps
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setMapError('Google Maps API ključ nije konfigurisan (VITE_GOOGLE_MAPS_API_KEY)');
      return;
    }
    if (mapLoaded || googleMapRef.current) return;

    setOptions({ apiKey, version: 'weekly' });

    importLibrary('maps').then(() => {
      if (mapRef.current && !googleMapRef.current) {
        googleMapRef.current = new google.maps.Map(mapRef.current, {
          center: { lat: 42.29, lng: 18.84 },
          zoom: 14,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
        });
        infoWindowRef.current = new google.maps.InfoWindow();
        setMapLoaded(true);
      }
    }).catch((err: any) => {
      setMapError(`Greška pri učitavanju mape: ${err.message}`);
    });
  }, []);

  // Update markers when locations change
  const updateMarkers = useCallback(() => {
    if (!googleMapRef.current || !mapLoaded) return;

    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    if (locations.length === 0) return;

    const bounds = new google.maps.LatLngBounds();

    locations.forEach((loc) => {
      const position = { lat: loc.latitude, lng: loc.longitude };
      bounds.extend(position);

      const color = ROLE_COLORS[loc.role] || '#6b7280';
      // Dim the marker if user is offline (location is old)
      const opacity = loc.is_online ? 1 : 0.5;

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
          fillOpacity: opacity,
          strokeColor: loc.is_online ? '#22c55e' : '#9ca3af',
          strokeWeight: 3,
        },
      });

      marker.addListener('click', () => {
        setSelectedUser(loc);
        if (infoWindowRef.current) {
          const onlineHtml = loc.is_online
            ? '<span style="color: #16a34a; font-weight: 600;">● Online</span>'
            : '<span style="color: #9ca3af;">● Offline</span>';
          infoWindowRef.current.setContent(`
            <div style="padding: 8px; min-width: 150px;">
              <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${loc.full_name}</div>
              <div style="font-size: 12px; margin-bottom: 2px;">${onlineHtml}</div>
              <div style="color: #666; font-size: 12px;">${t(loc.role)}</div>
              ${loc.department ? `<div style="color: #666; font-size: 12px;">${t(loc.department)}</div>` : ''}
              <div style="color: #999; font-size: 11px; margin-top: 4px;">GPS: ${formatTimeAgo(loc.location_updated_at)}</div>
              <div style="color: #999; font-size: 11px;">Aktivan: ${formatTimeAgo(loc.last_active_at)}</div>
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
            Lokacije i status osoblja
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-1 border-green-300 text-green-700">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            {onlineCount} online
          </Badge>
          <Badge variant="outline" className="gap-1 border-blue-300 text-blue-700">
            <MapPin className="h-3 w-3" />
            {totalOnMap} na mapi
          </Badge>
          <Badge variant="outline" className="gap-1 border-gray-300 text-gray-500">
            <CircleOff className="h-3 w-3" />
            {offline.length} offline
          </Badge>
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

        {/* Sidebar */}
        <div className="space-y-3">
          {/* Users on map (with GPS) */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                Na mapi ({locations.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {locations.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nema korisnika sa lokacijom.
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
                    {/* Online indicator */}
                    <div className="relative shrink-0">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: ROLE_COLORS[loc.role] || '#6b7280', opacity: loc.is_online ? 1 : 0.5 }}
                      >
                        {loc.full_name.charAt(0)}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                        loc.is_online ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                    </div>
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

          {/* Online but no GPS */}
          {onlineNoGps.length > 0 && (
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-1 text-green-700">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Online - bez GPS ({onlineNoGps.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {onlineNoGps.map((u) => (
                  <div key={u.id} className="flex items-center gap-2 p-1.5 rounded-md">
                    <div className="relative shrink-0">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: ROLE_COLORS[u.role] || '#6b7280' }}
                      >
                        {u.full_name.charAt(0)}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white bg-green-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{u.full_name}</p>
                      <p className="text-xs text-muted-foreground">{formatTimeAgo(u.last_active_at)}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0 border-green-300 text-green-600">
                      {t(u.role)}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Offline users */}
          {offline.length > 0 && (
            <Card className="border-gray-200 bg-gray-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-1 text-gray-500">
                  <CircleOff className="h-4 w-4" />
                  Offline ({offline.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {offline.map((u) => (
                  <div key={u.id} className="flex items-center gap-2 p-1.5 rounded-md">
                    <div className="relative shrink-0">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold opacity-40"
                        style={{ backgroundColor: ROLE_COLORS[u.role] || '#6b7280' }}
                      >
                        {u.full_name.charAt(0)}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white bg-gray-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate text-gray-400">{u.full_name}</p>
                      {u.last_active_at && (
                        <p className="text-xs text-gray-400">{formatTimeAgo(u.last_active_at)}</p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0 border-gray-200 text-gray-400">
                      {t(u.role)}
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
                  {selectedUser.is_online ? (
                    <span className="text-green-600 text-xs ml-1">● Online</span>
                  ) : (
                    <span className="text-gray-400 text-xs ml-1">● Offline</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Rola:</span> {t(selectedUser.role)}</p>
                {selectedUser.department && (
                  <p><span className="text-muted-foreground">Odjeljenje:</span> {t(selectedUser.department)}</p>
                )}
                <p><span className="text-muted-foreground">Koordinate:</span> {selectedUser.latitude.toFixed(5)}, {selectedUser.longitude.toFixed(5)}</p>
                <p><span className="text-muted-foreground">GPS ažuriran:</span> {formatTimeAgo(selectedUser.location_updated_at)}</p>
                <p><span className="text-muted-foreground">Poslednja aktivnost:</span> {formatTimeAgo(selectedUser.last_active_at)}</p>
              </CardContent>
            </Card>
          )}

          {/* Legend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Legenda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>Online (aktivan)</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-gray-400" />
                <span>Offline</span>
              </div>
              <div className="border-t pt-1.5 mt-1.5">
                {Object.entries(ROLE_COLORS).map(([role, color]) => (
                  <div key={role} className="flex items-center gap-2 text-xs py-0.5">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                    <span>{t(role)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
