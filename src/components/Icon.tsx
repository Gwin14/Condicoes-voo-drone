import { SymbolView, type SymbolWeight } from 'expo-symbols';
import type { ColorValue } from 'react-native';

/**
 * Família única de ícones: SF Symbols no iOS, Material Symbols no Android/web.
 * Cada chave semântica mapeia para o par nativo correspondente.
 */
const MAP = {
  wind: { ios: 'wind', md: 'air' },
  gust: { ios: 'tornado', md: 'storm' },
  rain: { ios: 'cloud.rain.fill', md: 'rainy' },
  drop: { ios: 'drop.fill', md: 'water_drop' },
  visibility: { ios: 'eye.fill', md: 'visibility' },
  cloud: { ios: 'cloud.fill', md: 'cloud' },
  cloudSun: { ios: 'cloud.sun.fill', md: 'partly_cloudy_day' },
  cloudMoon: { ios: 'cloud.moon.fill', md: 'partly_cloudy_night' },
  sun: { ios: 'sun.max.fill', md: 'sunny' },
  moon: { ios: 'moon.stars.fill', md: 'bedtime' },
  fog: { ios: 'cloud.fog.fill', md: 'foggy' },
  storm: { ios: 'cloud.bolt.rain.fill', md: 'thunderstorm' },
  snow: { ios: 'snowflake', md: 'ac_unit' },
  thermometer: { ios: 'thermometer.medium', md: 'device_thermostat' },
  humidity: { ios: 'humidity.fill', md: 'water_drop' },
  gauge: { ios: 'gauge.with.dots.needle.33percent', md: 'speed' },
  satellite: { ios: 'antenna.radiowaves.left.and.right', md: 'satellite_alt' },
  sunrise: { ios: 'sunrise.fill', md: 'wb_twilight' },
  sunset: { ios: 'sunset.fill', md: 'wb_twilight' },
  camera: { ios: 'camera.aperture', md: 'photo_camera' },
  location: { ios: 'location.fill', md: 'my_location' },
  pin: { ios: 'mappin.and.ellipse', md: 'location_on' },
  map: { ios: 'map.fill', md: 'map' },
  forecast: { ios: 'calendar', md: 'calendar_month' },
  now: { ios: 'scope', md: 'radar' },
  flight: { ios: 'airplane.departure', md: 'flight_takeoff' },
  landing: { ios: 'airplane.arrival', md: 'flight_land' },
  airport: { ios: 'airplane.circle.fill', md: 'local_airport' },
  settings: { ios: 'gearshape.fill', md: 'settings' },
  compass: { ios: 'location.north.line.fill', md: 'explore' },
  arrowUp: { ios: 'location.north.fill', md: 'navigation' },
  battery: { ios: 'battery.75percent', md: 'battery_5_bar' },
  timer: { ios: 'timer', md: 'timer' },
  checklist: { ios: 'checklist', md: 'checklist' },
  check: { ios: 'checkmark.circle.fill', md: 'check_circle' },
  circle: { ios: 'circle', md: 'radio_button_unchecked' },
  warning: { ios: 'exclamationmark.triangle.fill', md: 'warning' },
  stop: { ios: 'xmark.octagon.fill', md: 'block' },
  info: { ios: 'info.circle', md: 'info' },
  bell: { ios: 'bell.badge.fill', md: 'notifications_active' },
  bellAdd: { ios: 'bell', md: 'notification_add' },
  search: { ios: 'magnifyingglass', md: 'search' },
  close: { ios: 'xmark', md: 'close' },
  chevronRight: { ios: 'chevron.right', md: 'chevron_right' },
  chevronDown: { ios: 'chevron.down', md: 'expand_more' },
  plus: { ios: 'plus', md: 'add' },
  bookmark: { ios: 'bookmark.fill', md: 'bookmark' },
  bookmarkAdd: { ios: 'bookmark', md: 'bookmark_add' },
  trash: { ios: 'trash', md: 'delete' },
  share: { ios: 'square.and.arrow.up', md: 'share' },
  widgets: { ios: 'square.grid.2x2.fill', md: 'widgets' },
  law: { ios: 'building.columns.fill', md: 'gavel' },
  drone: { ios: 'dot.radiowaves.up.forward', md: 'toys_fan' },
  altitude: { ios: 'arrow.up.and.down', md: 'height' },
  ruler: { ios: 'ruler', md: 'straighten' },
  home: { ios: 'house.fill', md: 'home' },
  bolt: { ios: 'bolt.fill', md: 'bolt' },
  layers: { ios: 'square.3.layers.3d', md: 'layers' },
  history: { ios: 'clock.arrow.circlepath', md: 'history' },
  play: { ios: 'play.fill', md: 'play_arrow' },
  sparkle: { ios: 'star.fill', md: 'star' },
  link: { ios: 'arrow.up.right', md: 'open_in_new' },
  pressure: { ios: 'barometer', md: 'compress' },
  mountain: { ios: 'mountain.2.fill', md: 'landscape' },
  uv: { ios: 'sun.max.trianglebadge.exclamationmark', md: 'wb_sunny' },
  lock: { ios: 'lock.fill', md: 'lock' },
  island: { ios: 'capsule.fill', md: 'pill' },
  edit: { ios: 'slider.horizontal.3', md: 'tune' },
  route: { ios: 'point.topleft.down.to.point.bottomright.curvepath.fill', md: 'route' },
  people: { ios: 'person.2.fill', md: 'group' },
  radio: { ios: 'dot.radiowaves.left.and.right', md: 'cell_tower' },
  globe: { ios: 'globe.americas.fill', md: 'public' },
  sunStorm: { ios: 'sun.max.trianglebadge.exclamationmark', md: 'flare' },
  wifi: { ios: 'wifi.exclamationmark', md: 'wifi_off' },
  powerline: { ios: 'bolt.horizontal.fill', md: 'electric_bolt' },
} as const;

export type IconName = keyof typeof MAP;

export function Icon({
  name,
  size = 20,
  color,
  weight,
}: {
  name: IconName;
  size?: number;
  color: ColorValue;
  weight?: SymbolWeight;
}) {
  const m = MAP[name];
  return (
    <SymbolView
      name={{ ios: m.ios as any, android: m.md as any, web: m.md as any }}
      size={size}
      tintColor={color}
      weight={process.env.EXPO_OS === 'ios' ? weight : undefined}
      resizeMode="scaleAspectFit"
      style={{ width: size, height: size }}
    />
  );
}

export const iconPairs = MAP;
