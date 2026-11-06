import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { airspaceAt, nearbyAirports } from '@/lib/airports';
import { findDrone } from '@/lib/drones';
import { fmtSpeed } from '@/lib/format';
import { densityAltitude, findWindows, scoreHour, usableFlightMinutes } from '@/lib/scoring';
import { fetchAllConstellations, snapshot } from '@/lib/gnss';
import { fetchSpaceWeather, scintillationRisk } from '@/lib/spaceWeather';
import { fetchForecast, fetchKp, fetchMetar, kpAt } from '@/lib/weather';
import { useApp } from '@/store/app';

export function useForecast(lat?: number, lon?: number) {
  return useQuery({
    queryKey: ['forecast', lat?.toFixed(3), lon?.toFixed(3)],
    queryFn: ({ signal }) => fetchForecast(lat!, lon!, signal),
    enabled: lat != null && lon != null,
    staleTime: 10 * 60_000,
    refetchInterval: 15 * 60_000,
  });
}

export function useKp() {
  return useQuery({
    queryKey: ['kp'],
    queryFn: ({ signal }) => fetchKp(signal),
    staleTime: 30 * 60_000,
    retry: 1,
  });
}

export function useMetar(icaos: string[]) {
  return useQuery({
    queryKey: ['metar', icaos.join(',')],
    queryFn: ({ signal }) => fetchMetar(icaos, signal),
    enabled: icaos.length > 0,
    staleTime: 10 * 60_000,
    retry: 1,
  });
}

/** Elementos orbitais GNSS (CelesTrak). Mudam devagar: cache longo. */
export function useConstellations() {
  return useQuery({
    queryKey: ['gnss-elements'],
    queryFn: ({ signal }) => fetchAllConstellations(signal),
    staleTime: 6 * 3600_000,
    gcTime: 24 * 3600_000,
    retry: 1,
  });
}

export function useSpaceWeather() {
  return useQuery({
    queryKey: ['space-weather'],
    queryFn: ({ signal }) => fetchSpaceWeather(signal),
    staleTime: 30 * 60_000,
    retry: 1,
  });
}

export function useDrone() {
  const droneId = useApp((s) => s.droneId);
  const custom = useApp((s) => s.customDrone);
  return findDrone(droneId, custom);
}

/** Combina previsão + Kp + perfil de drone + altitude planejada em um quadro completo. */
export function useConditions(lat?: number, lon?: number) {
  const forecast = useForecast(lat, lon);
  const kp = useKp();
  const sats = useConstellations();
  const space = useSpaceWeather();
  const mask = useApp((s) => s.gnssMask);
  const drone = useDrone();
  const altitude = useApp((s) => s.altitude);
  const unit = useApp((s) => s.speedUnit);

  const data = useMemo(() => {
    const f = forecast.data;
    if (!f) return null;
    const fmt = (v: number) => fmtSpeed(v, unit);
    const airspace = airspaceAt(f.lat, f.lon);
    const air = { status: airspace.status, icao: airspace.nearest?.icao, distanceM: airspace.nearest?.distance };
    const elements = sats.data?.sats;
    const sw = space.data;
    // Satélites e ionosfera por hora. Elementos orbitais valem bem por ~3 dias.
    const ref = f.fetchedAt;
    const compute = (t: Date, kpv: number) => {
      const ms = t.getTime();
      let gnss;
      if (elements && Math.abs(ms - ref) < 72 * 3600_000) {
        const snap = snapshot(elements, f.lat, f.lon, f.elevation + altitude, ms, mask);
        gnss = { visible: snap.visible.length, gps: snap.byConstellation.gps, pdop: snap.pdop };
      }
      const day = sw ? [sw.now, ...sw.forecast].find((d) => d.date.toDateString() === t.toDateString()) ?? sw.now : null;
      const risk = scintillationRisk(t, f.lat, f.lon, sw?.f107 ?? null, kpv);
      const spaceIn = { scint: risk.level, scintReason: risk.reason, r: day?.r ?? 0, s: day?.s ?? 0 };
      return { gnss, space: spaceIn };
    };
    const cache = new Map<number, ReturnType<typeof compute>>();
    const extraAt = (t: Date, kpv: number) => {
      const key = t.getTime();
      if (!cache.has(key)) cache.set(key, compute(t, kpv));
      return cache.get(key)!;
    };
    const hours = f.hours.map((h) => {
      const kpv = kpAt(kp.data, h.time);
      return scoreHour(h, drone, altitude, kpv, fmt, { airspace: air, ...extraAt(h.time, kpv) });
    });
    const nowKp = kp.data?.now ?? 0;
    const now = scoreHour(f.current, drone, altitude, nowKp, fmt, { airspace: air, ...extraAt(f.current.time, nowKp) });
    // Janelas consideram só o tempo: a restrição de espaço aéreo vale para o dia todo.
    const weatherOnly = f.hours.map((h) => {
      const kpv = kpAt(kp.data, h.time);
      return scoreHour(h, drone, altitude, kpv, fmt, extraAt(h.time, kpv));
    });
    const windows = findWindows(weatherOnly);
    const airports = nearbyAirports(f.lat, f.lon, 60).slice(0, 5);
    const usable = usableFlightMinutes(drone, now.windAlt, f.current.temp);
    const da = densityAltitude(f.current.pressure, f.current.temp, f.elevation);
    return { forecast: f, now, hours, windows, airspace, airports, usable, densityAlt: da };
  }, [forecast.data, kp.data, sats.data, space.data, mask, drone, altitude, unit]);

  return {
    data,
    drone,
    altitude,
    isLoading: forecast.isLoading,
    isFetching: forecast.isFetching || kp.isFetching,
    error: forecast.error as Error | null,
    kpError: kp.error as Error | null,
    refetch: async () => {
      await Promise.all([forecast.refetch(), kp.refetch()]);
    },
  };
}

export type Conditions = NonNullable<ReturnType<typeof useConditions>['data']>;
