import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_DRONE_ID, type DroneProfile } from '@/lib/drones';
import type { SpeedUnit, TempUnit } from '@/lib/format';
import type { Verdict } from '@/theme/tokens';

export type SavedSpot = {
  id: string;
  name: string;
  detail?: string;
  lat: number;
  lon: number;
  createdAt: number;
};

export type LocationChoice =
  | { kind: 'gps' }
  | { kind: 'place'; name: string; detail?: string; lat: number; lon: number };

export type FlightSession = {
  id: string;
  startedAt: number;
  place: string;
  lat: number;
  lon: number;
  droneId: string;
  droneName: string;
  score: number;
  verdict: Verdict;
  windAlt: number;
  gust: number;
  temp: number;
  usableMinutes: number;
};

export type FlightLog = FlightSession & {
  endedAt: number;
  notes?: string;
};

type State = {
  speedUnit: SpeedUnit;
  tempUnit: TempUnit;
  droneId: string;
  customDrone: DroneProfile | null;
  altitude: number;
  /** Máscara de elevação GNSS (graus acima do horizonte). */
  gnssMask: number;
  location: LocationChoice;
  spots: SavedSpot[];
  showZones: boolean;
  notifyWindows: boolean;
  scheduledWindowAlerts: Record<string, string>;
  session: FlightSession | null;
  flights: FlightLog[];
  checklist: Record<string, boolean>;
};

type Actions = {
  set: <K extends keyof State>(key: K, value: State[K]) => void;
  addSpot: (s: Omit<SavedSpot, 'id' | 'createdAt'>) => SavedSpot;
  removeSpot: (id: string) => void;
  startSession: (s: Omit<FlightSession, 'id' | 'startedAt'>) => FlightSession;
  endSession: (notes?: string) => FlightLog | null;
  removeFlight: (id: string) => void;
  toggleCheck: (id: string) => void;
  resetChecklist: () => void;
};

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export const useApp = create<State & Actions>()(
  persist(
    (set, get) => ({
      speedUnit: 'kmh',
      tempUnit: 'c',
      droneId: DEFAULT_DRONE_ID,
      customDrone: null,
      altitude: 100,
      gnssMask: 10,
      location: { kind: 'gps' },
      spots: [],
      showZones: true,
      notifyWindows: false,
      scheduledWindowAlerts: {},
      session: null,
      flights: [],
      checklist: {},

      set: (key, value) => set({ [key]: value } as Partial<State>),
      addSpot: (s) => {
        const spot: SavedSpot = { ...s, id: uid(), createdAt: Date.now() };
        set({ spots: [spot, ...get().spots] });
        return spot;
      },
      removeSpot: (id) => set({ spots: get().spots.filter((s) => s.id !== id) }),
      startSession: (s) => {
        const session: FlightSession = { ...s, id: uid(), startedAt: Date.now() };
        set({ session });
        return session;
      },
      endSession: (notes) => {
        const s = get().session;
        if (!s) return null;
        const log: FlightLog = { ...s, endedAt: Date.now(), notes };
        set({ session: null, flights: [log, ...get().flights], checklist: {} });
        return log;
      },
      removeFlight: (id) => set({ flights: get().flights.filter((f) => f.id !== id) }),
      toggleCheck: (id) => set({ checklist: { ...get().checklist, [id]: !get().checklist[id] } }),
      resetChecklist: () => set({ checklist: {} }),
    }),
    {
      name: 'teto-app-v1',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    }
  )
);
