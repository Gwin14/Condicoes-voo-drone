import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';

import { useApp } from '@/store/app';

export type ResolvedLocation = {
  lat: number;
  lon: number;
  name: string;
  detail?: string;
  source: 'gps' | 'place';
};

type GpsState =
  | { status: 'idle' | 'loading' }
  | { status: 'denied' }
  | { status: 'error'; message: string }
  | { status: 'ready'; lat: number; lon: number; name: string; detail?: string };

let gpsCache: GpsState = { status: 'idle' };
const listeners = new Set<(s: GpsState) => void>();
const emit = (s: GpsState) => {
  gpsCache = s;
  listeners.forEach((l) => l(s));
};

async function reverseName(lat: number, lon: number) {
  if (process.env.EXPO_OS === 'web') return { name: 'Sua localização' };
  try {
    const [r] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
    if (!r) return { name: 'Sua localização' };
    const name = r.district || r.subregion || r.city || r.name || 'Sua localização';
    const detail = [r.city && r.city !== name ? r.city : null, r.region].filter(Boolean).join(', ');
    return { name, detail: detail || undefined };
  } catch {
    return { name: 'Sua localização' };
  }
}

export async function requestGps(ask = true) {
  emit({ status: 'loading' });
  try {
    let perm = await Location.getForegroundPermissionsAsync();
    if (!perm.granted && ask && perm.canAskAgain !== false) {
      perm = await Location.requestForegroundPermissionsAsync();
    }
    if (!perm.granted) {
      emit({ status: 'denied' });
      return;
    }
    const last = await Location.getLastKnownPositionAsync({ maxAge: 10 * 60_000 }).catch(() => null);
    if (last) {
      const n = await reverseName(last.coords.latitude, last.coords.longitude);
      emit({ status: 'ready', lat: last.coords.latitude, lon: last.coords.longitude, ...n });
    }
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const n = await reverseName(pos.coords.latitude, pos.coords.longitude);
    emit({ status: 'ready', lat: pos.coords.latitude, lon: pos.coords.longitude, ...n });
  } catch (e) {
    if (gpsCache.status !== 'ready') {
      emit({ status: 'error', message: e instanceof Error ? e.message : 'Falha ao obter localização' });
    }
  }
}

/** Localização ativa: GPS ou um local escolhido pelo usuário. */
export function useActiveLocation() {
  const choice = useApp((s) => s.location);
  const [gps, setGps] = useState<GpsState>(gpsCache);

  useEffect(() => {
    listeners.add(setGps);
    return () => {
      listeners.delete(setGps);
    };
  }, []);

  useEffect(() => {
    if (choice.kind === 'gps' && gpsCache.status === 'idle') {
      requestGps(true);
    }
  }, [choice.kind]);

  const retry = useCallback(() => requestGps(true), []);

  if (choice.kind === 'place') {
    return {
      location: { lat: choice.lat, lon: choice.lon, name: choice.name, detail: choice.detail, source: 'place' } as ResolvedLocation,
      gps,
      retry,
    };
  }
  return {
    location:
      gps.status === 'ready'
        ? ({ lat: gps.lat, lon: gps.lon, name: gps.name, detail: gps.detail, source: 'gps' } as ResolvedLocation)
        : null,
    gps,
    retry,
  };
}
