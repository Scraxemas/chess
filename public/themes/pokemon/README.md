# Pokémon theme assets

This theme maps chess pieces to Fire (White) vs Water (Black) species.
The repo ships **original placeholder SVGs** only — no Nintendo / The Pokémon Company artwork.

## Roster

| Side | Role | Species | File key |
|------|------|---------|----------|
| White (Fire) | K | Charizard | `wK` |
| White (Fire) | Q | Delphox | `wQ` |
| White (Fire) | R | Magcargo | `wR` |
| White (Fire) | B | Chandelure | `wB` |
| White (Fire) | N | Rapidash | `wN` |
| White (Fire) | P | Fennekin | `wP` |
| Black (Water) | K | Blastoise | `bK` |
| Black (Water) | Q | Milotic | `bQ` |
| Black (Water) | R | Carracosta | `bR` |
| Black (Water) | B | Samurott | `bB` |
| Black (Water) | N | Kingdra | `bN` |
| Black (Water) | P | Froakie | `bP` |

## Drop-in Trozei-style PNGs (local only)

Place your own Trozei-style PNGs here (filenames must match):

```
public/themes/pokemon/trozei/wK.png
public/themes/pokemon/trozei/wQ.png
public/themes/pokemon/trozei/wR.png
public/themes/pokemon/trozei/wB.png
public/themes/pokemon/trozei/wN.png
public/themes/pokemon/trozei/wP.png
public/themes/pokemon/trozei/bK.png
public/themes/pokemon/trozei/bQ.png
public/themes/pokemon/trozei/bR.png
public/themes/pokemon/trozei/bB.png
public/themes/pokemon/trozei/bN.png
public/themes/pokemon/trozei/bP.png
```

The `trozei/` directory is **gitignored**. Do **not** commit official Pokémon Trozei / Nintendo / TPC sprites.

Resolver order in the UI:

1. `/themes/pokemon/trozei/{key}.png` (if present / loads)
2. else `/themes/pokemon/placeholders/{key}.svg` (shipped originals)

## Placeholders

Original SVGs in `placeholders/` — type-colored tokens with short labels. Safe to commit.
