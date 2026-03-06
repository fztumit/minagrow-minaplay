export type VocabularyWord =
  | 'su'
  | 'anne'
  | 'baba'
  | 'top'
  | 'araba'
  | 'kitap'
  | 'elma'
  | 'süt'
  | 'ekmek';

export type VocabularyItem = {
  word: VocabularyWord;
  label: string;
  emoji: string;
  repeats: number;
};

export const VOCABULARY: VocabularyItem[] = [
  { word: 'su', label: 'su', emoji: '💧', repeats: 3 },
  { word: 'anne', label: 'anne', emoji: '👩', repeats: 1 },
  { word: 'baba', label: 'baba', emoji: '👨', repeats: 1 },
  { word: 'top', label: 'top', emoji: '⚽', repeats: 1 },
  { word: 'araba', label: 'araba', emoji: '🚗', repeats: 1 },
  { word: 'kitap', label: 'kitap', emoji: '📘', repeats: 1 },
  { word: 'elma', label: 'elma', emoji: '🍎', repeats: 1 },
  { word: 'süt', label: 'süt', emoji: '🥛', repeats: 1 },
  { word: 'ekmek', label: 'ekmek', emoji: '🍞', repeats: 1 }
];
