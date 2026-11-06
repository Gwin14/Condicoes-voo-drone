import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { airspaceAt, nearbyAirports } from '@/lib/airports';
import { findDrone } from '@/lib/drones';
import { fmtSpeed } from '@/lib/format';
import { densityAltitude, findWindows, scoreHour, usableFlightMinutes } from '@/lib/scoring';
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

export function useDrone() {
  const droneId = useApp((s) => s.droneId);
  const custom = useApp((s) => s.customDrone);
  return findDrone(droneId, custom);
}

/** Combina previsão + Kp + perfil de drone + altitude planejada em um quadro completo. */
export function useConditions(lat?: number, lon?: number) {
  const forecast = useForecast(lat, lon);
  const kp = useKp();
  const drone = useDrone();
  const altitude = useApp((s) => s.altitude);
  const unit = useApp((s) => s.speedUnit);

  const data = useMemo(() => {
    const f = forecast.data;
    if (!f) return null;
    const fmt = (v: number) => fmtSpeed(v, unit);
    const airspace = airspaceAt(f.lat, f.lon);
    const air = { status: airspace.status, icao: airspace.nearest?.icao, distanceM: airspace.nearest?.distance };
    const hours = f.hours.map((h) => scoreHour(h, drone, altitude, kpAt(kp.data, h.time), fmt, air));
    const now = scoreHour(f.current, drone, altitude, kp.data?.now ?? 0, fmt, air);
    // Janelas consideram só o tempo: a restrição de espaço aéreo vale para o dia todo.
    const weatherOnly = f.hours.map((h) => scoreHour(h, drone, altitude, kpAt(kp.data, h.time), fmt));
    const windows = findWindows(weatherOnly);
    const airports = nearbyAirports(f.lat, f.lon, 60).slice(0, 5);
    const usable = usableFlightMinutes(drone, now.windAlt, f.current.temp);
    const da = densityAltitude(f.current.pressure, f.current.temp, f.elevation);
    return { forecast: f, now, hours, windows, airspace, airports, usable, densityAlt: da };
  }, [forecast.data, kp.data, drone, altitude, unit]);

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
