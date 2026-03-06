export const STORY_LEVEL_OPTIONS = [
    { id: 'easy', label: 'Kolay (2 kelime)' },
    { id: 'standard', label: 'Standart' }
];
export const STORY_PACK_OPTIONS = [
    { id: 'core', label: 'Temel Paket' },
    { id: 'animals', label: 'Hayvanlar' },
    { id: 'daily', label: 'Gunluk Yasam' }
];
export const STORIES_BY_LEVEL_AND_PACK = {
    easy: {
        core: [
            {
                id: 'ilk-cumleler-1',
                title: 'İlk Cümleler 1',
                emoji: '🌟',
                sentences: ['Su iç', 'Top at', 'Anne gel', 'Abla al']
            },
            {
                id: 'ilk-cumleler-2',
                title: 'İlk Cümleler 2',
                emoji: '🧩',
                sentences: ['Süt iç', 'Kitap aç', 'Ekmek al', 'Baba gel']
            }
        ],
        animals: [
            {
                id: 'hayvan-kolay-1',
                title: 'Hayvan Cümleleri 1',
                emoji: '🐶',
                sentences: ['Kedi gel', 'Kopek bak', 'Kus uc', 'Balik yuz']
            },
            {
                id: 'hayvan-kolay-2',
                title: 'Hayvan Cümleleri 2',
                emoji: '🐥',
                sentences: ['Kedi uyu', 'Kopek kos', 'Kus kon', 'Tavuk gez']
            }
        ],
        daily: [
            {
                id: 'gunluk-kolay-1',
                title: 'Gunluk Yasam 1',
                emoji: '☀️',
                sentences: ['Yuz yika', 'Dis fircala', 'Masa kur', 'Oyuna basla']
            },
            {
                id: 'gunluk-kolay-2',
                title: 'Gunluk Yasam 2',
                emoji: '🏠',
                sentences: ['Ayakkabi giy', 'Kapi ac', 'Eve gel', 'Uyku saati']
            }
        ]
    },
    standard: {
        core: [
            {
                id: 'top-oyunu',
                title: 'Top Oyunu',
                emoji: '⚽',
                sentences: ['Baba topu aldı.', 'Top yuvarlandı.', 'Çocuk top dedi.']
            },
            {
                id: 'kitap-saati',
                title: 'Kitap Saati',
                emoji: '📘',
                sentences: ['Anne kitabı açtı.', 'Kitapta elma resmi var.', 'Çocuk kitap dedi.']
            },
            {
                id: 'araba-yolu',
                title: 'Araba Yolu',
                emoji: '🚗',
                sentences: ['Baba arabaya bindi.', 'Araba yolda gidiyor.', 'Çocuk araba dedi.']
            }
        ],
        animals: [
            {
                id: 'hayvan-standart-1',
                title: 'Ormanda Gezi',
                emoji: '🌳',
                sentences: ['Küçük çocuk ormanda yürüdü.', 'Kuş ağacın dalına kondu.', 'Kedi sessizce çocuğu izledi.']
            },
            {
                id: 'hayvan-standart-2',
                title: 'Bahce Hikayesi',
                emoji: '🌼',
                sentences: ['Köpek topu bahçeye getirdi.', 'Kedi çitin üstüne çıktı.', 'Çocuk hayvanlara su verdi.']
            }
        ],
        daily: [
            {
                id: 'gunluk-standart-1',
                title: 'Sabah Rutini',
                emoji: '🪥',
                sentences: ['Çocuk sabah yüzünü yıkadı.', 'Anne kahvaltı masasını hazırladı.', 'Baba çocuğa süt verdi.']
            },
            {
                id: 'gunluk-standart-2',
                title: 'Aksam Zamani',
                emoji: '🌙',
                sentences: ['Aile akşam yemeği yedi.', 'Çocuk hikaye kitabını seçti.', 'Uyumadan önce herkes sarıldı.']
            }
        ]
    }
};
//# sourceMappingURL=data.js.map