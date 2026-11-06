# Ícone do Teto — camadas para o Icon Composer

Conceito: **o drone subindo até o teto**. A barra superior é o *teto* (o limite de
altitude, 120 m AGL pela ANAC). Os pontos são a trajetória de subida e afinam
conforme chegam perto do limite. A linha das hélices repete a largura da barra,
então o conjunto também se lê como um "T".

Todos os SVGs usam a mesma prancheta de 1024×1024, já posicionados. Arraste para o
Icon Composer **sem mover** e eles se alinham sozinhos.

| Arquivo | Camada | Grupo sugerido | Observações |
|---|---|---|---|
| `0-fundo.svg` | Fundo (céu) | — | Referência. No Icon Composer use o *Fill* em vez deste arquivo: gradiente linear vertical `#113396` → `#5C93EC` (Display P3 no `teto.icon`). |
| `1-teto.svg` | Teto | Fundo (atrás) | Branco. Translucidez ~50%. |
| `2-subida.svg` | Subida | Fundo (atrás) | Branco com opacidade 80%. |
| `3-drone.svg` | Drone | Frente | Branco. Sombra neutra; é o elemento que mais "salta". |
| `4-gimbal.svg` | Gimbal/câmera | Frente (por cima do drone) | Lente em `#2F6BFF` (o acento do app). No modo *Tinted*/*Clear*, deixe a lente sair transparente. |

Sugestões de montagem:
- **Dark:** fill `#0B0C10` → `#14245C`; glifos brancos, lente `#5B8CFF` (acento do tema escuro).
- **Mono/Tinted:** tudo branco, a lente com opacidade 0 (vira um furo).
- Teste em 60 px: a barra, os 3 pontos e a silhueta do drone continuam legíveis.

`preview.svg` mostra a composição final. O ícone final, exportado do Icon Composer, fica em
`../teto.icon` (usado no iOS). Os PNGs de `../images/` são o fallback para Android e web.

## PNG

A pasta `png/` tem as mesmas camadas em PNG 1024×1024 com fundo transparente
(o `0-fundo.png` é opaco) e já posicionadas, mais o `preview.png` com tudo montado.
No Icon Composer, prefira os SVGs: eles continuam nítidos em qualquer tamanho.
