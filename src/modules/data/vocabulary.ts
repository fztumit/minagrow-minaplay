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
  repeats: number;
  asset?: string;
  sceneClass?: string;
  featuredOnScene?: boolean;
};

export const VOCABULARY: VocabularyItem[] = [
  {
    word: 'su',
    label: 'su',
    repeats: 3,
    asset: '/assets/water-glass.svg',
    sceneClass: 'scene-water',
    featuredOnScene: true
  },
  { word: 'anne', label: 'anne', repeats: 2 },
  { word: 'baba', label: 'baba', repeats: 2 },
  {
    word: 'top',
    label: 'top',
    repeats: 2,
    asset: '/assets/object-ball.svg',
    sceneClass: 'scene-ball',
    featuredOnScene: true
  },
  {
    word: 'araba',
    label: 'araba',
    repeats: 2,
    asset: '/assets/object-car.svg',
    sceneClass: 'scene-car',
    featuredOnScene: true
  },
  {
    word: 'kitap',
    label: 'kitap',
    repeats: 2,
    asset: '/assets/object-book.svg',
    sceneClass: 'scene-book',
    featuredOnScene: true
  },
  {
    word: 'elma',
    label: 'elma',
    repeats: 2,
    asset: '/assets/object-apple.svg',
    sceneClass: 'scene-apple',
    featuredOnScene: true
  },
  {
    word: 'süt',
    label: 'süt',
    repeats: 2,
    asset: '/assets/object-milk.svg',
    sceneClass: 'scene-milk',
    featuredOnScene: true
  },
  { word: 'ekmek', label: 'ekmek', repeats: 2 }
];
