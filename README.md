# Teto — condições de voo para drones

App em React Native + Expo (SDK 58, Expo Router) que diz se dá para voar agora, onde e até quando, com base no **seu drone** e na **altitude que você vai voar**.

## Funcionalidades

**Agora**
- Score de voo de 0 a 100 com veredito (Bom / Cautela / Não recomendado) calculado com os limites oficiais do drone escolhido.
- Fatores explicados um a um: vento e rajadas na altitude planejada, chuva, visibilidade (VLOS), base de nuvens estimada, temperatura da bateria, índice Kp (GNSS), luz do dia, instabilidade (CAPE) e espaço aéreo.
- Faixa das próximas 24 h, **janelas de tempo ideal** nas próximas 48 h com alerta 30 min antes, perfil de vento por altitude (10/80/120/180 m interpolados), autonomia útil estimada, altitude-densidade, UV, luz e METAR decodificado dos aeródromos próximos.

**Mapa** — zonas estimadas de aeródromos, pontos de voo salvos e condições de qualquer ponto (mantenha pressionado). Usa `react-native-maps`, que já vem no Expo Go.

**Previsão** — tabela horária no estilo go/no-go (FlashList) e visão de 7 dias com as horas boas de cada dia.

**Voo**
- Checklist pré-voo (SARPAS, SISANT, RETA, hélices, RTH…) que libera a decolagem.
- Sessão ao vivo: cronômetro, bateria útil drenando e lembrete de retorno, com **Live Activity + Dynamic Island** no iOS e mini-player no acessório da tab bar (iOS 26).
- **Bússola de vento**: aponte o celular e veja vento de proa, de cauda e lateral.
- **Retorno seguro**: % de bateria necessária para voltar contra o vento, com reserva.
- **Planejador de luz**: hora dourada e azul, curva do Sol e direção das sombras.
- Diário de bordo.

**Ajustes** — 12 perfis de drone (DJI, Autel, FPV) mais um perfil personalizado, altitude planejada, unidades (km/h, m/s, kt, mph; °C/°F), regras ANAC/DECEA/Anatel com links oficiais e prévias dos widgets.

**Widgets** (via `expo-widgets`)
- iOS: tela inicial (pequeno, médio e grande), com **timeline horária de 12 h**, então o widget continua certo mesmo sem abrir o app.
- iOS: tela bloqueada (circular com gauge, retangular e inline).
- Android: widget de tela inicial (Glance / Jetpack Compose).
- Live Activity "Em voo" (tela bloqueada e Dynamic Island).

## Expo Go × development build

Tudo funciona no **Expo Go**, exceto widgets e Live Activities, que exigem código nativo:

| Recurso | Expo Go | Dev build |
|---|---|---|
| Telas, mapa, GPS, bússola, notificações locais, haptics | ✅ | ✅ |
| Widgets de tela inicial e tela bloqueada | Prévia em Ajustes › Widgets | ✅ |
| Live Activity / Dynamic Island | Prévia na aba Voo | ✅ (iOS) |

O isolamento fica em `src/native/capabilities.ts` e `src/native/widgets.ts`: no Expo Go os módulos de widget nunca são carregados (`require` preguiçoso, protegido por `isRunningInExpoGo()` e `requireOptionalNativeModule`), então nada quebra.

## Rodando

```bash
npm install
npx expo start            # abra no Expo Go
npx expo run:ios          # development build com widgets e Live Activity
npx expo run:android      # development build com widget Android
```

Para o Google Maps numa build Android própria, adicione a chave em `android.config.googleMaps.apiKey` no `app.json` (o Expo Go já traz a dele).

```bash
npm run typecheck
npm run lint
```

## Estrutura

```
src/app/            rotas (Expo Router): abas nativas + modais/sheets
src/components/     UI (cartões, anel de score, mapa, prévias)
src/lib/            score, clima, sol, aeródromos, drones, formatação
src/hooks/          localização ativa e condições (TanStack Query)
src/store/          estado persistido (Zustand + AsyncStorage)
src/native/         pontes nativas com guarda para Expo Go
src/widgets/        widgets e Live Activity (@expo/ui + diretiva 'widget')
```

## Fontes de dados (sem chave de API)

- [Open-Meteo](https://open-meteo.com): previsão horária, vento em altitude e geocodificação
- [NOAA SWPC](https://www.swpc.noaa.gov): índice Kp planetário
- [aviationweather.gov](https://aviationweather.gov): METAR

> As zonas de aeródromo são estimativas por distância. A autorização oficial é sempre a do DECEA, pelo SARPAS NG.
