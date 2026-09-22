import type { Color, PieceSymbol } from '../chess/game';

export type ThemeId = 'classic' | 'pokemon';

export const THEME_STORAGE_KEY = 'chess-theme';

/** Chess piece letter used in asset filenames (wK, bP, …). */
export function pieceKey(color: Color, type: PieceSymbol): string {
  const prefix = color === 'w' ? 'w' : 'b';
  const map: Record<PieceSymbol, string> = {
    p: 'P',
    n: 'N',
    b: 'B',
    r: 'R',
    q: 'Q',
    k: 'K',
  };
  return `${prefix}${map[type]}`;
}

/** White = Fire (Red), Black = Water (Blue). */
export const POKEMON_SPECIES: Record<string, string> = {
  wK: 'Charizard',
  wQ: 'Delphox',
  wR: 'Coalossal',
  wB: 'Armarouge',
  wN: 'Rapidash',
  wP: 'Charcadet',
  bK: 'Blastoise',
  bQ: 'Primarina',
  bR: 'Drednaw',
  bB: 'Samurott',
  bN: 'Kingdra',
  bP: 'Froakie',
};

export function pokemonSpecies(color: Color, type: PieceSymbol): string {
  return POKEMON_SPECIES[pieceKey(color, type)] ?? 'Pokémon';
}

export function classicPieceUrl(color: Color, type: PieceSymbol): string {
  return `/pieces/${pieceKey(color, type)}.svg`;
}

/** Preferred Trozei-style drop-in (gitignored); may 404 until user adds files. */
export function pokemonTrozeiUrl(color: Color, type: PieceSymbol): string {
  return `/themes/pokemon/trozei/${pieceKey(color, type)}.png`;
}

/** Original placeholder shipped in the repo. */
export function pokemonPlaceholderUrl(color: Color, type: PieceSymbol): string {
  return `/themes/pokemon/placeholders/${pieceKey(color, type)}.svg`;
}

export function pieceAlt(theme: ThemeId, color: Color, type: PieceSymbol): string {
  const side = color === 'w' ? 'White' : 'Black';
  if (theme === 'pokemon') {
    return `${side} ${pokemonSpecies(color, type)}`;
  }
  return `${side} ${type}`;
}

export function loadTheme(): ThemeId {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    if (v === 'pokemon' || v === 'classic') return v;
  } catch {
    /* ignore */
  }
  return 'classic';
}

export function saveTheme(theme: ThemeId): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}

/** Apply board CSS class / theme variables on documentElement + board. */
export function applyThemeChrome(theme: ThemeId, boardEl?: HTMLElement | null): void {
  document.documentElement.dataset.theme = theme;
  if (boardEl) {
    boardEl.classList.toggle('theme-pokemon', theme === 'pokemon');
    boardEl.classList.toggle('theme-classic', theme === 'classic');
  }
}
