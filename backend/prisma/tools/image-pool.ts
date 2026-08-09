/**
 * Curated catalogue photography.
 *
 * Every entry below was verified twice: the URL was fetched to confirm it
 * resolves (a wrong Unsplash id returns 404, so this is a real check), and the
 * image itself was viewed to confirm it shows a single garment clearly. Group
 * shots and stock photos that turned out not to feature a dress were dropped
 * rather than left in to pad the list.
 *
 * `colors` are the catalogue colour names the photo genuinely reads as, so the
 * assigner in `assign-images.ts` can put a burgundy photo on a burgundy dress
 * instead of pairing garments with unrelated pictures.
 */

export interface PoolImage {
  id: string;
  /** Catalogue colour names this photo plausibly represents. */
  colors: string[];
  /** Rough formality, used to keep gowns off casual listings and vice versa. */
  formality: 'formal' | 'party' | 'casual';
  note: string;
}

export const IMAGE_POOL: PoolImage[] = [
  // ── Formal / evening ────────────────────────────────────
  { id: '1568251188392-ae32f898cb3b', colors: ['Black'], formality: 'formal', note: 'Black tiered high-low ball gown' },
  { id: '1623580674393-edf6eb7090f8', colors: ['Black'], formality: 'formal', note: 'Black satin column gown with slit' },
  { id: '1617258856138-402b60da4e2a', colors: ['Navy'], formality: 'formal', note: 'Navy beaded off-shoulder gown' },
  { id: '1610048616025-11a3dcc9fd0b', colors: ['Lavender', 'White'], formality: 'formal', note: 'Powder-blue appliqué gown' },
  { id: '1562645361-c88442d7bc58', colors: ['Blush Pink'], formality: 'formal', note: 'Blush tulle gown' },
  { id: '1583039949165-96ee24b0d8de', colors: ['Burgundy'], formality: 'formal', note: 'Burgundy mermaid gown' },
  { id: '1568252542512-9fe8fe9c87bb', colors: ['Burgundy', 'Blush Pink'], formality: 'formal', note: 'Wine floral tulle gown' },
  { id: '1610209740880-6ecc4b20ea78', colors: ['Champagne', 'Mustard'], formality: 'formal', note: 'Gold brocade ball gown' },
  { id: '1623609163859-ca93c959b98a', colors: ['Champagne', 'White'], formality: 'formal', note: 'Ivory lace tea dress' },
  { id: '1586693231040-e89840e7d805', colors: ['Red'], formality: 'formal', note: 'Red plunge maxi' },
  { id: '1622080159549-11537bf939e6', colors: ['Red'], formality: 'formal', note: 'Scarlet long-sleeve column maxi' },

  // ── Party / cocktail ────────────────────────────────────
  { id: '1622079400125-5b6679552976', colors: ['Navy'], formality: 'party', note: 'Royal blue ruffle mini' },
  { id: '1534534734151-83bc15801803', colors: ['Blush Pink', 'Champagne'], formality: 'party', note: 'Blush tulle midi' },

  // ── Casual / day ────────────────────────────────────────
  { id: '1609357605129-26f69add5d6e', colors: ['Emerald'], formality: 'casual', note: 'Emerald wrap maxi' },
  { id: '1585487000160-6ebcfceb0d03', colors: ['Burgundy'], formality: 'casual', note: 'Burgundy corduroy shirt dress' },
  { id: '1613966570650-add3cf83aa83', colors: ['White'], formality: 'casual', note: 'White tiered maxi' },
  { id: '1509755512670-9e7af886e7e9', colors: ['Mustard'], formality: 'casual', note: 'Terracotta wrap midi' },
  { id: '1496217590455-aa63a8350eea', colors: ['White', 'Lavender'], formality: 'casual', note: 'Pale off-shoulder shift mini' },
  { id: '1520026582657-4daf5bb60adb', colors: ['White', 'Blush Pink'], formality: 'casual', note: 'White floral sundress' },
  { id: '1502868354157-ec2edd2a1651', colors: ['White', 'Red'], formality: 'casual', note: 'Floral wrap mini' },
  { id: '1571513721963-d855fd8df4c2', colors: ['Champagne', 'White'], formality: 'casual', note: 'Cream floral shirt dress' },

  // ── Pre-existing catalogue photography (kept, still resolving) ──
  { id: '1595777457583-95e059d581b8', colors: ['Emerald', 'Black'], formality: 'party', note: 'Original catalogue shot' },
  { id: '1539109136881-3be0616acf4b', colors: ['Blush Pink', 'Lavender'], formality: 'party', note: 'Original catalogue shot' },
  { id: '1518049362265-d5b2a6467637', colors: ['Black', 'Navy'], formality: 'formal', note: 'Original catalogue shot' },
  { id: '1502716119720-b23a93e5fe1b', colors: ['Burgundy', 'Champagne'], formality: 'formal', note: 'Original catalogue shot' },
  { id: '1606760227091-3dd870d97f1d', colors: ['Red', 'Black'], formality: 'party', note: 'Original catalogue shot' },
  { id: '1485968579580-b6d095142e6e', colors: ['Navy', 'Champagne'], formality: 'casual', note: 'Original catalogue shot' },
  { id: '1515372039744-b8f02a3ae446', colors: ['Mustard', 'Emerald'], formality: 'casual', note: 'Original catalogue shot' },
  { id: '1469334031218-e382a71b716b', colors: ['White', 'Champagne'], formality: 'casual', note: 'Original catalogue shot' },
  { id: '1487412720507-e7ab37603c6f', colors: ['Navy', 'White'], formality: 'casual', note: 'Original catalogue shot' },
  { id: '1490481651871-ab68de25d43d', colors: ['Lavender', 'Navy'], formality: 'party', note: 'Original catalogue shot' },
  { id: '1539008835657-9e8e9680c956', colors: ['Mustard', 'White'], formality: 'casual', note: 'Original catalogue shot' },
  { id: '1566174053879-31528523f8ae', colors: ['White', 'Champagne'], formality: 'party', note: 'Original catalogue shot' },
  { id: '1572804013309-59a88b7e92f1', colors: ['Emerald', 'Burgundy'], formality: 'party', note: 'Original catalogue shot' },
];

/** Categories mapped onto the pool's formality bands. */
export const CATEGORY_FORMALITY: Record<string, PoolImage['formality']> = {
  'Evening Gown': 'formal',
  Formal: 'formal',
  Cocktail: 'party',
  Party: 'party',
  Office: 'casual',
  Casual: 'casual',
  Summer: 'casual',
};
