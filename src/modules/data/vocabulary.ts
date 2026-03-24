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
  { word: 'anne', label: 'anne', emoji: '👩', repeats: 2 },
  { word: 'baba', label: 'baba', emoji: '👨', repeats: 2 },
  { word: 'top', label: 'top', emoji: '⚽', repeats: 2 },
  { word: 'araba', label: 'araba', emoji: '🚗', repeats: 2 },
  { word: 'kitap', label: 'kitap', emoji: '📘', repeats: 2 },
  { word: 'elma', label: 'elma', emoji: '🍎', repeats: 2 },
  { word: 'süt', label: 'süt', emoji: '🥛', repeats: 2 },
  { word: 'ekmek', label: 'ekmek', emoji: '🍞', repeats: 2 }
];
