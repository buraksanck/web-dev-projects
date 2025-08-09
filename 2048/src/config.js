export const DEFAULT_SIZE = 4;
export const TARGET_VALUE = 2048;
export const START_TILES = 2;
export const PROBABILITY_FOUR = 0.1;

export const VALUE_TO_CLASS = (value) => {
  if (value <= 2048) return `bg-${value}`;
  return 'bg-super';
};


