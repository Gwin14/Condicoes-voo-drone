/**
 * Aeródromos brasileiros (principais públicos e militares com tráfego relevante).
 * As zonas no app são uma ESTIMATIVA conservadora para orientação — a autorização
 * oficial é sempre a do DECEA via SARPAS NG.
 */
export type Airport = { icao: string; name: string; city: string; lat: number; lon: number; major: boolean };

const RAW: [string, string, string, number, number, 0 | 1][] = [
  ['SBGR', 'Guarulhos', 'Guarulhos, SP', -23.4356, -46.4731, 1],
  ['SBSP', 'Congonhas', 'São Paulo, SP', -23.6261, -46.6564, 1],
  ['SBMT', 'Campo de Marte', 'São Paulo, SP', -23.5091, -46.6378, 0],
  ['SBKP', 'Viracopos', 'Campinas, SP', -23.0074, -47.1345, 1],
  ['SBJD', 'Jundiaí', 'Jundiaí, SP', -23.1817, -46.9436, 0],
  ['SBSJ', 'São José dos Campos', 'São José dos Campos, SP', -23.2292, -45.8615, 0],
  ['SBTA', 'Taubaté', 'Taubaté, SP', -23.0401, -45.516, 0],
  ['SBGW', 'Guaratinguetá', 'Guaratinguetá, SP', -22.7916, -45.2048, 0],
  ['SBST', 'Base Aérea de Santos', 'Guarujá, SP', -23.9281, -46.2997, 0],
  ['SBRP', 'Leite Lopes', 'Ribeirão Preto, SP', -21.1364, -47.7767, 0],
  ['SBSR', 'São José do Rio Preto', 'São José do Rio Preto, SP', -20.8166, -49.4065, 0],
  ['SBAE', 'Bauru-Arealva', 'Bauru, SP', -22.1578, -49.0683, 0],
  ['SBAU', 'Araçatuba', 'Araçatuba, SP', -21.1413, -50.4247, 0],
  ['SBDN', 'Presidente Prudente', 'Presidente Prudente, SP', -22.1751, -51.4246, 0],
  ['SBYS', 'Academia da Força Aérea', 'Pirassununga, SP', -21.9846, -47.3348, 0],
  ['SBAQ', 'Araraquara', 'Araraquara, SP', -21.812, -48.133, 0],
  ['SDCO', 'Sorocaba', 'Sorocaba, SP', -23.478, -47.49, 0],
  ['SBRJ', 'Santos Dumont', 'Rio de Janeiro, RJ', -22.9105, -43.1631, 1],
  ['SBGL', 'Galeão', 'Rio de Janeiro, RJ', -22.81, -43.2506, 1],
  ['SBJR', 'Jacarepaguá', 'Rio de Janeiro, RJ', -22.9875, -43.37, 0],
  ['SBAF', 'Campo dos Afonsos', 'Rio de Janeiro, RJ', -22.875, -43.3847, 0],
  ['SBSC', 'Base Aérea de Santa Cruz', 'Rio de Janeiro, RJ', -22.9324, -43.7191, 0],
  ['SBME', 'Macaé', 'Macaé, RJ', -22.343, -41.766, 0],
  ['SBCB', 'Cabo Frio', 'Cabo Frio, RJ', -22.9217, -42.0743, 0],
  ['SBBR', 'Brasília', 'Brasília, DF', -15.8711, -47.9186, 1],
  ['SBCF', 'Confins', 'Belo Horizonte, MG', -19.6244, -43.9719, 1],
  ['SBBH', 'Pampulha', 'Belo Horizonte, MG', -19.8512, -43.9506, 0],
  ['SBPR', 'Carlos Prates', 'Belo Horizonte, MG', -19.9093, -43.9891, 0],
  ['SBUL', 'Uberlândia', 'Uberlândia, MG', -18.8828, -48.2253, 0],
  ['SBUR', 'Uberaba', 'Uberaba, MG', -19.7648, -47.9661, 0],
  ['SBMK', 'Montes Claros', 'Montes Claros, MG', -16.7069, -43.8189, 0],
  ['SBZM', 'Zona da Mata', 'Goianá, MG', -21.5131, -43.1731, 0],
  ['SBGV', 'Governador Valadares', 'Governador Valadares, MG', -18.8952, -41.9822, 0],
  ['SBIP', 'Usiminas', 'Ipatinga, MG', -19.4707, -42.4876, 0],
  ['SBVG', 'Varginha', 'Varginha, MG', -21.5901, -45.4733, 0],
  ['SBCT', 'Afonso Pena', 'Curitiba, PR', -25.5285, -49.1758, 1],
  ['SBBI', 'Bacacheri', 'Curitiba, PR', -25.4051, -49.232, 0],
  ['SBFI', 'Cataratas', 'Foz do Iguaçu, PR', -25.5963, -54.4872, 0],
  ['SBLO', 'Londrina', 'Londrina, PR', -23.3336, -51.1301, 0],
  ['SBMG', 'Maringá', 'Maringá, PR', -23.4794, -52.0122, 0],
  ['SBCA', 'Cascavel', 'Cascavel, PR', -25.0003, -53.5008, 0],
  ['SBPA', 'Salgado Filho', 'Porto Alegre, RS', -29.9944, -51.1714, 1],
  ['SBCX', 'Caxias do Sul', 'Caxias do Sul, RS', -29.1971, -51.1875, 0],
  ['SBPF', 'Passo Fundo', 'Passo Fundo, RS', -28.244, -52.3266, 0],
  ['SBSM', 'Santa Maria', 'Santa Maria, RS', -29.7114, -53.6882, 0],
  ['SBPK', 'Pelotas', 'Pelotas, RS', -31.7184, -52.3277, 0],
  ['SBUG', 'Uruguaiana', 'Uruguaiana, RS', -29.7822, -57.0382, 0],
  ['SBFL', 'Hercílio Luz', 'Florianópolis, SC', -27.6703, -48.5525, 1],
  ['SBNF', 'Navegantes', 'Navegantes, SC', -26.88, -48.6514, 0],
  ['SBJV', 'Joinville', 'Joinville, SC', -26.2245, -48.7974, 0],
  ['SBCH', 'Chapecó', 'Chapecó, SC', -27.1342, -52.6566, 0],
  ['SBJA', 'Jaguaruna', 'Jaguaruna, SC', -28.6753, -49.0596, 0],
  ['SBSV', 'Salvador', 'Salvador, BA', -12.9086, -38.3225, 1],
  ['SBIL', 'Ilhéus', 'Ilhéus, BA', -14.8156, -39.0332, 0],
  ['SBPS', 'Porto Seguro', 'Porto Seguro, BA', -16.4386, -39.0809, 0],
  ['SBLE', 'Chapada Diamantina', 'Lençóis, BA', -12.4823, -41.277, 0],
  ['SBRF', 'Guararapes', 'Recife, PE', -8.1265, -34.9236, 1],
  ['SBPL', 'Petrolina', 'Petrolina, PE', -9.3624, -40.5691, 0],
  ['SBFN', 'Fernando de Noronha', 'Fernando de Noronha, PE', -3.8549, -32.4233, 0],
  ['SBFZ', 'Pinto Martins', 'Fortaleza, CE', -3.7763, -38.5326, 1],
  ['SBJU', 'Juazeiro do Norte', 'Juazeiro do Norte, CE', -7.219, -39.2701, 0],
  ['SBJE', 'Jericoacoara', 'Cruz, CE', -2.9067, -40.3581, 0],
  ['SBSG', 'São Gonçalo do Amarante', 'Natal, RN', -5.7681, -35.3761, 1],
  ['SBMS', 'Mossoró', 'Mossoró, RN', -5.2019, -37.3643, 0],
  ['SBJP', 'Castro Pinto', 'João Pessoa, PB', -7.1484, -34.9486, 0],
  ['SBKG', 'Campina Grande', 'Campina Grande, PB', -7.2699, -35.8964, 0],
  ['SBMO', 'Zumbi dos Palmares', 'Maceió, AL', -9.5108, -35.7917, 0],
  ['SBAR', 'Santa Maria', 'Aracaju, SE', -10.984, -37.0703, 0],
  ['SBTE', 'Teresina', 'Teresina, PI', -5.0599, -42.8235, 0],
  ['SBPB', 'Parnaíba', 'Parnaíba, PI', -2.8937, -41.732, 0],
  ['SBSL', 'Marechal Cunha Machado', 'São Luís, MA', -2.5854, -44.2341, 0],
  ['SBIZ', 'Imperatriz', 'Imperatriz, MA', -5.5313, -47.46, 0],
  ['SBBE', 'Val de Cans', 'Belém, PA', -1.3792, -48.4763, 1],
  ['SBSN', 'Santarém', 'Santarém, PA', -2.4247, -54.7858, 0],
  ['SBMA', 'Marabá', 'Marabá, PA', -5.3686, -49.138, 0],
  ['SBHT', 'Altamira', 'Altamira, PA', -3.2539, -52.254, 0],
  ['SBCJ', 'Carajás', 'Parauapebas, PA', -6.1153, -50.0014, 0],
  ['SBEG', 'Eduardo Gomes', 'Manaus, AM', -3.0386, -60.0497, 1],
  ['SBTT', 'Tabatinga', 'Tabatinga, AM', -4.2557, -69.9358, 0],
  ['SBTF', 'Tefé', 'Tefé, AM', -3.3829, -64.7241, 0],
  ['SBMQ', 'Macapá', 'Macapá, AP', 0.0507, -51.0722, 0],
  ['SBBV', 'Boa Vista', 'Boa Vista, RR', 2.8414, -60.6922, 0],
  ['SBPV', 'Porto Velho', 'Porto Velho, RO', -8.7093, -63.9023, 0],
  ['SBRB', 'Rio Branco', 'Rio Branco, AC', -9.8689, -67.8981, 0],
  ['SBCZ', 'Cruzeiro do Sul', 'Cruzeiro do Sul, AC', -7.5999, -72.7695, 0],
  ['SBPJ', 'Palmas', 'Palmas, TO', -10.2915, -48.357, 0],
  ['SBGO', 'Santa Genoveva', 'Goiânia, GO', -16.632, -49.2207, 1],
  ['SBAN', 'Base Aérea de Anápolis', 'Anápolis, GO', -16.2292, -48.9642, 0],
  ['SBCN', 'Caldas Novas', 'Caldas Novas, GO', -17.7253, -48.6075, 0],
  ['SBCY', 'Marechal Rondon', 'Cuiabá, MT', -15.6529, -56.1167, 1],
  ['SBRD', 'Rondonópolis', 'Rondonópolis, MT', -16.586, -54.7248, 0],
  ['SBSI', 'Sinop', 'Sinop, MT', -11.885, -55.5861, 0],
  ['SBAT', 'Alta Floresta', 'Alta Floresta, MT', -9.8664, -56.105, 0],
  ['SBCG', 'Campo Grande', 'Campo Grande, MS', -20.4687, -54.6725, 1],
  ['SBDO', 'Dourados', 'Dourados, MS', -22.2019, -54.9266, 0],
  ['SBCR', 'Corumbá', 'Corumbá, MS', -19.0119, -57.6714, 0],
  ['SBVT', 'Eurico de Aguiar Salles', 'Vitória, ES', -20.2581, -40.2864, 1],
];

export const AIRPORTS: Airport[] = RAW.map(([icao, name, city, lat, lon, major]) => ({
  icao,
  name,
  city,
  lat,
  lon,
  major: major === 1,
}));

/** Raio crítico (vermelho) e de atenção (âmbar) em metros. */
export function zoneRadii(a: Airport) {
  return a.major ? { critical: 6000, caution: 11000 } : { critical: 4000, caution: 8000 };
}

export function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function bearing(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export type AirspaceStatus = 'clear' | 'caution' | 'critical';

export type NearbyAirport = Airport & { distance: number; bearing: number; zone: AirspaceStatus };

export function nearbyAirports(lat: number, lon: number, maxKm = 80): NearbyAirport[] {
  return AIRPORTS.map((a) => {
    const distance = haversine(lat, lon, a.lat, a.lon);
    const r = zoneRadii(a);
    const zone: AirspaceStatus = distance <= r.critical ? 'critical' : distance <= r.caution ? 'caution' : 'clear';
    return { ...a, distance, bearing: bearing(lat, lon, a.lat, a.lon), zone };
  })
    .filter((a) => a.distance <= maxKm * 1000)
    .sort((a, b) => a.distance - b.distance);
}

export function airspaceAt(lat: number, lon: number): { status: AirspaceStatus; nearest: NearbyAirport | null } {
  const list = nearbyAirports(lat, lon, 300);
  const nearest = list[0] ?? null;
  const worst = list.find((a) => a.zone === 'critical') ?? list.find((a) => a.zone === 'caution');
  return { status: worst?.zone ?? 'clear', nearest: worst ?? nearest };
}
