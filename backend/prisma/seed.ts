import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const slug = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

async function main() {
  console.log('🌱 Seeding StyleSense database...');

  // ── Body shapes ────────────────────────────────────────
  const bodyShapeData = [
    { key: 'HOURGLASS', name: 'Hourglass', description: 'Balanced bust and hips with a clearly defined waist.', stylingTips: 'Wrap dresses and belted styles emphasise your natural waistline.' },
    { key: 'PEAR', name: 'Pear', description: 'Hips wider than the bust, with a defined waist.', stylingTips: 'A-line and fit-and-flare dresses balance the silhouette beautifully.' },
    { key: 'APPLE', name: 'Apple', description: 'Fuller midsection with weight carried around the waist.', stylingTips: 'Empire-waist and flowing styles skim the midsection elegantly.' },
    { key: 'RECTANGLE', name: 'Rectangle', description: 'Bust, waist and hips of similar width with little waist definition.', stylingTips: 'Peplum, ruching and belts create curves and waist definition.' },
    { key: 'INVERTED_TRIANGLE', name: 'Inverted Triangle', description: 'Broader shoulders or bust relative to the hips.', stylingTips: 'Full and A-line skirts add volume to the lower half for balance.' },
  ];
  const bodyShapes = await Promise.all(
    bodyShapeData.map((b) =>
      prisma.bodyShape.upsert({ where: { key: b.key }, create: b, update: b }),
    ),
  );
  const shape = (key: string) => bodyShapes.find((b) => b.key === key)!;

  // ── Age groups ─────────────────────────────────────────
  const ageGroupData = [
    { label: '18–24', minAge: 18, maxAge: 24 },
    { label: '25–29', minAge: 25, maxAge: 29 },
    { label: '30–35', minAge: 30, maxAge: 35 },
  ];
  const ageGroups = await Promise.all(
    ageGroupData.map((a) =>
      prisma.ageGroup.upsert({
        where: { slug: slug(a.label) },
        create: { ...a, slug: slug(a.label) },
        update: a,
      }),
    ),
  );
  const age = (label: string) => ageGroups.find((a) => a.label === label)!;

  // ── Sizes (with body-measurement ranges in cm) ─────────
  const sizeData = [
    { label: 'XS', sortOrder: 1, bustMin: 76, bustMax: 82, waistMin: 58, waistMax: 64, hipMin: 84, hipMax: 90 },
    { label: 'S', sortOrder: 2, bustMin: 82, bustMax: 88, waistMin: 64, waistMax: 70, hipMin: 90, hipMax: 96 },
    { label: 'M', sortOrder: 3, bustMin: 88, bustMax: 94, waistMin: 70, waistMax: 76, hipMin: 96, hipMax: 102 },
    { label: 'L', sortOrder: 4, bustMin: 94, bustMax: 102, waistMin: 76, waistMax: 84, hipMin: 102, hipMax: 110 },
    { label: 'XL', sortOrder: 5, bustMin: 102, bustMax: 110, waistMin: 84, waistMax: 94, hipMin: 110, hipMax: 118 },
    { label: 'XXL', sortOrder: 6, bustMin: 110, bustMax: 120, waistMin: 94, waistMax: 104, hipMin: 118, hipMax: 128 },
  ];
  const sizes = await Promise.all(
    sizeData.map((s) => prisma.size.upsert({ where: { label: s.label }, create: s, update: s })),
  );
  const size = (label: string) => sizes.find((s) => s.label === label)!;

  // ── Simple lookups ─────────────────────────────────────
  // Six different Prisma delegates are passed here; their generic `upsert`
  // signatures are mutually incompatible, so no structural type covers them all.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const upsertNamed = async <T extends { name: string }>(model: any, rows: T[], extra?: (r: T) => object) => {
    return Promise.all(
      rows.map((r) =>
        model.upsert({
          where: { name: r.name },
          create: { ...r, ...(extra ? extra(r) : {}) },
          update: {},
        }),
      ),
    );
  };

  const categories = await upsertNamed(
    prisma.dressCategory,
    [
      { name: 'Casual' }, { name: 'Formal' }, { name: 'Party' }, { name: 'Office' },
      { name: 'Evening Gown' }, { name: 'Summer' }, { name: 'Cocktail' },
    ],
    (r) => ({ slug: slug(r.name) }),
  );
  const cat = (name: string) => categories.find((c) => c.name === name)!;

  const styles = await upsertNamed(
    prisma.dressStyle,
    [
      { name: 'A-Line' }, { name: 'Bodycon' }, { name: 'Wrap' }, { name: 'Fit & Flare' },
      { name: 'Shift' }, { name: 'Maxi' }, { name: 'Empire Waist' }, { name: 'Peplum' },
    ],
    (r) => ({ slug: slug(r.name) }),
  );
  const style = (name: string) => styles.find((s) => s.name === name)!;

  const brands = await upsertNamed(
    prisma.brand,
    [
      { name: 'Aurelia', country: 'France' }, { name: 'Maison Lune', country: 'France' },
      { name: 'Bloom & Co', country: 'USA' }, { name: 'Saffron', country: 'India' },
      { name: 'Nordic Thread', country: 'Sweden' }, { name: 'Velvet Rose', country: 'UK' },
    ],
    (r) => ({ slug: slug(r.name) }),
  );
  const brand = (name: string) => brands.find((b) => b.name === name)!;

  const colorData = [
    { name: 'Black', hex: '#111111' }, { name: 'White', hex: '#f8f8f8' },
    { name: 'Red', hex: '#c0392b' }, { name: 'Navy', hex: '#1f2a44' },
    { name: 'Emerald', hex: '#2e8b57' }, { name: 'Blush Pink', hex: '#f4c2c2' },
    { name: 'Burgundy', hex: '#6d1a36' }, { name: 'Mustard', hex: '#d4a017' },
    { name: 'Lavender', hex: '#b497bd' }, { name: 'Champagne', hex: '#e6d3a3' },
  ];
  const colors = await Promise.all(
    colorData.map((c) => prisma.color.upsert({ where: { name: c.name }, create: c, update: c })),
  );
  const color = (name: string) => colors.find((c) => c.name === name)!;

  const occasions = await upsertNamed(
    prisma.occasion,
    [
      { name: 'Wedding' }, { name: 'Party' }, { name: 'Office' }, { name: 'Casual Outing' },
      { name: 'Date Night' }, { name: 'Festival' }, { name: 'Graduation' },
    ],
    (r) => ({ slug: slug(r.name) }),
  );
  const occ = (name: string) => occasions.find((o) => o.name === name)!;

  const seasons = await upsertNamed(
    prisma.season,
    [{ name: 'Spring' }, { name: 'Summer' }, { name: 'Autumn' }, { name: 'Winter' }, { name: 'All-Season' }],
    (r) => ({ slug: slug(r.name) }),
  );
  const season = (name: string) => seasons.find((s) => s.name === name)!;

  const fabrics = await upsertNamed(prisma.fabric, [
    { name: 'Cotton' }, { name: 'Silk' }, { name: 'Chiffon' }, { name: 'Linen' },
    { name: 'Satin' }, { name: 'Velvet' }, { name: 'Jersey' }, { name: 'Lace' },
  ]);
  const fab = (name: string) => fabrics.find((f) => f.name === name)!;

  // ── Recommendation rules ───────────────────────────────
  const ruleData = [
    { factorKey: 'bodyShape', label: 'Body Shape', weight: 0.28, description: 'How well the garment’s cut flatters the detected body shape.' },
    { factorKey: 'measurements', label: 'Measurements / Size', weight: 0.24, description: 'Quality of fit against the best available stocked size.' },
    { factorKey: 'occasion', label: 'Occasion', weight: 0.12, description: 'Overlap with requested/favourite occasions.' },
    { factorKey: 'budget', label: 'Budget', weight: 0.1, description: 'Whether the price fits the user’s budget.' },
    { factorKey: 'ageGroup', label: 'Age Group', weight: 0.08, description: 'Whether the dress targets the user’s age band.' },
    { factorKey: 'style', label: 'Style', weight: 0.05, description: 'Match with preferred dress styles.' },
    { factorKey: 'color', label: 'Preferred Color', weight: 0.05, description: 'Availability in preferred colours.' },
    { factorKey: 'personalization', label: 'Learned Taste', weight: 0.05, description: 'Similarity to dresses previously selected, saved or viewed.' },
    { factorKey: 'brand', label: 'Brand', weight: 0.02, description: 'Whether it is a favourite brand.' },
    { factorKey: 'popularity', label: 'Popularity', weight: 0.01, description: 'Community rating and review volume.' },
  ];
  await Promise.all(
    ruleData.map((r) =>
      prisma.recommendationRule.upsert({ where: { factorKey: r.factorKey }, create: r, update: {} }),
    ),
  );

  // ── Accounts ───────────────────────────────────────────
  const adminPass = await bcrypt.hash('Admin@123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@stylesense.app' },
    update: {},
    create: {
      email: 'admin@stylesense.app',
      passwordHash: adminPass,
      fullName: 'Studio Admin',
      role: 'ADMIN',
      isEmailVerified: true,
    },
  });

  const userPass = await bcrypt.hash('User@123', 12);
  const maya = await prisma.user.upsert({
    where: { email: 'maya@example.com' },
    update: {},
    create: {
      email: 'maya@example.com',
      passwordHash: userPass,
      fullName: 'Maya Sharma',
      phone: '+9779800000000',
      isEmailVerified: true,
      measurements: {
        create: {
          age: 23,
          heightCm: 165,
          weightKg: 58,
          bustCm: 90,
          waistCm: 68,
          hipCm: 96,
          shoulderCm: 39,
          skinTone: 'MEDIUM',
          bodyShapeId: shape('HOURGLASS').id,
          bodyShapeReason:
            'Your bust (90cm) and hips (96cm) are well balanced while your waist is clearly narrower, giving a classic Hourglass silhouette.',
        },
      },
      preferences: {
        create: {
          budgetMin: 1000,
          budgetMax: 8000,
          preferredColors: { connect: [{ id: color('Emerald').id }, { id: color('Burgundy').id }, { id: color('Black').id }] },
          preferredStyles: { connect: [{ id: style('Wrap').id }, { id: style('Fit & Flare').id }] },
          favoriteBrands: { connect: [{ id: brand('Aurelia').id }] },
          favoriteOccasions: { connect: [{ id: occ('Party').id }, { id: occ('Date Night').id }] },
        },
      },
    },
  });

  // Seed a few extra users for analytics variety.
  const extraProfiles = [
    { email: 'aria@example.com', name: 'Aria Thapa', age: 28, bust: 86, waist: 74, hip: 98, shapeKey: 'PEAR' },
    { email: 'noor@example.com', name: 'Noor Ali', age: 32, bust: 98, waist: 84, hip: 100, shapeKey: 'RECTANGLE' },
    { email: 'lily@example.com', name: 'Lily Chen', age: 21, bust: 96, waist: 80, hip: 90, shapeKey: 'INVERTED_TRIANGLE' },
  ];
  for (const p of extraProfiles) {
    await prisma.user.upsert({
      where: { email: p.email },
      update: {},
      create: {
        email: p.email,
        passwordHash: userPass,
        fullName: p.name,
        isEmailVerified: true,
        measurements: {
          create: {
            age: p.age,
            heightCm: 162,
            weightKg: 60,
            bustCm: p.bust,
            waistCm: p.waist,
            hipCm: p.hip,
            shoulderCm: 38,
            bodyShapeId: shape(p.shapeKey).id,
            bodyShapeReason: 'Derived from measurement ratios.',
          },
        },
        preferences: { create: { budgetMin: 0, budgetMax: 10000 } },
      },
    });
  }

  // ── Dresses ────────────────────────────────────────────
  const img = (seed: string, primary = false) => ({
    url: `https://images.unsplash.com/photo-${seed}?auto=format&fit=crop&w=800&q=80`,
    isPrimary: primary,
  });

  interface DressSeed {
    name: string;
    description: string;
    brand: string;
    category: string;
    style: string;
    season: string;
    fabric: string;
    age: string;
    sleeveType: 'SLEEVELESS' | 'CAP' | 'SHORT' | 'THREE_QUARTER' | 'LONG';
    length: 'MINI' | 'KNEE' | 'MIDI' | 'MAXI' | 'FLOOR';
    neckStyle: string;
    pattern: string;
    material: string;
    basePrice: number;
    discountPct: number;
    isFeatured: boolean;
    rating: number;
    ratingCount: number;
    colors: string[];
    occasions: string[];
    shapes: string[];
    sizes: { label: string; stock: number }[];
    images: string[];
    tags: string[];
  }

  const dresses: DressSeed[] = [
    {
      name: 'Emerald Wrap Midi Dress', description: 'A flattering wrap midi in fluid silk with a tie waist that defines the silhouette — effortless from the office to date night.',
      brand: 'Aurelia', category: 'Cocktail', style: 'Wrap', season: 'All-Season', fabric: 'Silk', age: '18–24',
      sleeveType: 'THREE_QUARTER', length: 'MIDI', neckStyle: 'V-Neck', pattern: 'Solid', material: 'Silk blend',
      basePrice: 5400, discountPct: 10, isFeatured: true, rating: 4.7, ratingCount: 128,
      colors: ['Emerald', 'Burgundy', 'Black'], occasions: ['Date Night', 'Party', 'Office'], shapes: ['HOURGLASS'],
      sizes: [{ label: 'XS', stock: 2 }, { label: 'S', stock: 8 }, { label: 'M', stock: 6 }, { label: 'L', stock: 2 }],
      images: ['1595777457583-95e059d581b8', '1572804013309-59a88b7e92f1'], tags: ['bestseller', 'waist-defining'],
    },
    {
      name: 'Blush A-Line Tea Dress', description: 'A romantic A-line with a fitted bodice and gently flared skirt that balances fuller hips beautifully.',
      brand: 'Bloom & Co', category: 'Party', style: 'A-Line', season: 'Spring', fabric: 'Chiffon', age: '18–24',
      sleeveType: 'CAP', length: 'KNEE', neckStyle: 'Sweetheart', pattern: 'Floral', material: 'Chiffon',
      basePrice: 3200, discountPct: 0, isFeatured: true, rating: 4.5, ratingCount: 86,
      colors: ['Blush Pink', 'Lavender'], occasions: ['Wedding', 'Graduation', 'Party'], shapes: ['PEAR'],
      sizes: [{ label: 'XS', stock: 2 }, { label: 'S', stock: 11 }, { label: 'M', stock: 2 }],
      images: ['1539109136881-3be0616acf4b', '1534534734151-83bc15801803'], tags: ['romantic', 'wedding-guest'],
    },
    {
      name: 'Midnight Bodycon Gown', description: 'A sculpting evening gown in stretch satin with a floor-sweeping hem for show-stopping formal moments.',
      brand: 'Velvet Rose', category: 'Evening Gown', style: 'Bodycon', season: 'Winter', fabric: 'Satin', age: '25–29',
      sleeveType: 'SLEEVELESS', length: 'FLOOR', neckStyle: 'Halter', pattern: 'Solid', material: 'Stretch satin',
      basePrice: 8900, discountPct: 15, isFeatured: true, rating: 4.8, ratingCount: 64,
      colors: ['Black', 'Navy', 'Burgundy'], occasions: ['Wedding', 'Party'], shapes: ['HOURGLASS'],
      sizes: [{ label: 'M', stock: 2 }, { label: 'L', stock: 13 }, { label: 'XL', stock: 2 }],
      images: ['1518049362265-d5b2a6467637', '1568251188392-ae32f898cb3b'], tags: ['formal', 'statement'],
    },
    {
      name: 'Linen Shift Sundress', description: 'A breezy, unstructured linen shift that skims the body — ideal for warm days and relaxed weekends.',
      brand: 'Nordic Thread', category: 'Summer', style: 'Shift', season: 'Summer', fabric: 'Linen', age: '25–29',
      sleeveType: 'SHORT', length: 'KNEE', neckStyle: 'Round', pattern: 'Solid', material: 'Pure linen',
      basePrice: 2400, discountPct: 0, isFeatured: false, rating: 4.3, ratingCount: 52,
      colors: ['White', 'Mustard', 'Champagne'], occasions: ['Casual Outing', 'Festival'], shapes: ['APPLE'],
      sizes: [{ label: 'M', stock: 2 }, { label: 'L', stock: 12 }, { label: 'XL', stock: 2 }],
      images: ['1571513721963-d855fd8df4c2', '1469334031218-e382a71b716b'], tags: ['breathable', 'everyday'],
    },
    {
      name: 'Empire Waist Maxi', description: 'A flowing empire-line maxi that falls from beneath the bust — comfortable and elegant for any silhouette.',
      brand: 'Saffron', category: 'Formal', style: 'Empire Waist', season: 'All-Season', fabric: 'Chiffon', age: '30–35',
      sleeveType: 'LONG', length: 'MAXI', neckStyle: 'Boat', pattern: 'Solid', material: 'Chiffon overlay',
      basePrice: 4600, discountPct: 5, isFeatured: true, rating: 4.6, ratingCount: 73,
      colors: ['Navy', 'Emerald', 'Burgundy'], occasions: ['Wedding', 'Office', 'Graduation'], shapes: ['APPLE'],
      sizes: [{ label: 'XS', stock: 2 }, { label: 'S', stock: 14 }, { label: 'M', stock: 2 }],
      images: ['1617258856138-402b60da4e2a', '1518049362265-d5b2a6467637'], tags: ['comfortable', 'forgiving'],
    },
    {
      name: 'Ruby Fit & Flare', description: 'A classic fit-and-flare with a nipped waist and twirl-worthy skirt that creates instant curves.',
      brand: 'Aurelia', category: 'Party', style: 'Fit & Flare', season: 'Autumn', fabric: 'Jersey', age: '18–24',
      sleeveType: 'THREE_QUARTER', length: 'KNEE', neckStyle: 'Scoop', pattern: 'Solid', material: 'Ponte jersey',
      basePrice: 3800, discountPct: 20, isFeatured: false, rating: 4.4, ratingCount: 41,
      colors: ['Red', 'Black', 'Navy'], occasions: ['Party', 'Date Night'], shapes: ['INVERTED_TRIANGLE', 'RECTANGLE'],
      sizes: [{ label: 'M', stock: 2 }, { label: 'L', stock: 15 }, { label: 'XL', stock: 2 }],
      images: ['1606760227091-3dd870d97f1d', '1586693231040-e89840e7d805'], tags: ['curve-creating'],
    },
    {
      name: 'Champagne Peplum Cocktail', description: 'A structured peplum that adds definition at the waist — a polished choice for cocktail events.',
      brand: 'Maison Lune', category: 'Cocktail', style: 'Peplum', season: 'All-Season', fabric: 'Satin', age: '25–29',
      sleeveType: 'CAP', length: 'KNEE', neckStyle: 'Square', pattern: 'Solid', material: 'Duchess satin',
      basePrice: 6200, discountPct: 0, isFeatured: false, rating: 4.5, ratingCount: 58,
      colors: ['Champagne', 'Blush Pink', 'Black'], occasions: ['Party', 'Wedding', 'Date Night'], shapes: ['RECTANGLE'],
      sizes: [{ label: 'XS', stock: 2 }, { label: 'S', stock: 7 }, { label: 'M', stock: 6 }, { label: 'L', stock: 7 }, { label: 'XL', stock: 7 }, { label: 'XXL', stock: 2 }],
      images: ['1534534734151-83bc15801803', '1566174053879-31528523f8ae'], tags: ['structured'],
    },
    {
      name: 'Office Sheath Shift', description: 'A tailored shift in ponte with clean lines — boardroom-ready and endlessly versatile.',
      brand: 'Nordic Thread', category: 'Office', style: 'Shift', season: 'All-Season', fabric: 'Jersey', age: '30–35',
      sleeveType: 'SHORT', length: 'KNEE', neckStyle: 'Round', pattern: 'Solid', material: 'Ponte',
      basePrice: 4200, discountPct: 10, isFeatured: false, rating: 4.2, ratingCount: 39,
      colors: ['Navy', 'Black', 'Burgundy'], occasions: ['Office', 'Casual Outing'], shapes: ['APPLE'],
      sizes: [{ label: 'M', stock: 2 }, { label: 'L', stock: 13 }, { label: 'XL', stock: 2 }],
      images: ['1485968579580-b6d095142e6e', '1487412720507-e7ab37603c6f'], tags: ['workwear', 'versatile'],
    },
    {
      name: 'Lavender Maxi Gown', description: 'An ethereal floor-length gown with a softly draped bodice for unforgettable evenings.',
      brand: 'Velvet Rose', category: 'Evening Gown', style: 'Maxi', season: 'Spring', fabric: 'Chiffon', age: '25–29',
      sleeveType: 'SLEEVELESS', length: 'FLOOR', neckStyle: 'Cowl', pattern: 'Solid', material: 'Silk chiffon',
      basePrice: 7600, discountPct: 5, isFeatured: true, rating: 4.7, ratingCount: 47,
      colors: ['Lavender', 'Champagne', 'Blush Pink'], occasions: ['Wedding', 'Party', 'Graduation'], shapes: ['INVERTED_TRIANGLE'],
      sizes: [{ label: 'XS', stock: 2 }, { label: 'S', stock: 6 }, { label: 'M', stock: 7 }, { label: 'L', stock: 2 }],
      images: ['1610048616025-11a3dcc9fd0b', '1539109136881-3be0616acf4b'], tags: ['ethereal', 'black-tie'],
    },
    {
      name: 'Mustard Casual Wrap', description: 'A soft jersey wrap in warm mustard — the easy, flattering everyday hero of any wardrobe.',
      brand: 'Bloom & Co', category: 'Casual', style: 'Wrap', season: 'Autumn', fabric: 'Jersey', age: '18–24',
      sleeveType: 'LONG', length: 'MIDI', neckStyle: 'V-Neck', pattern: 'Solid', material: 'Viscose jersey',
      basePrice: 2900, discountPct: 0, isFeatured: false, rating: 4.4, ratingCount: 95,
      colors: ['Mustard', 'Emerald', 'Navy'], occasions: ['Casual Outing', 'Office', 'Date Night'], shapes: ['HOURGLASS'],
      sizes: [{ label: 'M', stock: 2 }, { label: 'L', stock: 9 }, { label: 'XL', stock: 2 }],
      images: ['1515372039744-b8f02a3ae446', '1509755512670-9e7af886e7e9'], tags: ['everyday', 'flattering'],
    },
    {
      name: 'Noir Lace Cocktail', description: 'A timeless little black dress in delicate lace with a scalloped hem.',
      brand: 'Maison Lune', category: 'Cocktail', style: 'Bodycon', season: 'Winter', fabric: 'Lace', age: '25–29',
      sleeveType: 'LONG', length: 'MINI', neckStyle: 'High', pattern: 'Lace', material: 'Stretch lace',
      basePrice: 5100, discountPct: 0, isFeatured: false, rating: 4.6, ratingCount: 70,
      colors: ['Black', 'Burgundy'], occasions: ['Party', 'Date Night'], shapes: ['HOURGLASS'],
      sizes: [{ label: 'XS', stock: 2 }, { label: 'S', stock: 6 }, { label: 'M', stock: 10 }, { label: 'L', stock: 11 }, { label: 'XL', stock: 4 }, { label: 'XXL', stock: 2 }],
      images: ['1595777457583-95e059d581b8', '1606760227091-3dd870d97f1d'], tags: ['LBD', 'classic'],
    },
    {
      name: 'Coastal Linen Maxi', description: 'A relaxed linen maxi with side slits and adjustable straps for sun-soaked days.',
      brand: 'Saffron', category: 'Summer', style: 'Maxi', season: 'Summer', fabric: 'Linen', age: '30–35',
      sleeveType: 'SLEEVELESS', length: 'MAXI', neckStyle: 'Square', pattern: 'Solid', material: 'Washed linen',
      basePrice: 3400, discountPct: 10, isFeatured: false, rating: 4.3, ratingCount: 33,
      colors: ['White', 'Champagne', 'Mustard'], occasions: ['Festival', 'Casual Outing'], shapes: ['INVERTED_TRIANGLE', 'APPLE'],
      sizes: [{ label: 'S', stock: 2 }, { label: 'M', stock: 7 }, { label: 'L', stock: 6 }, { label: 'XL', stock: 2 }],
      images: ['1539008835657-9e8e9680c956', '1571513721963-d855fd8df4c2'], tags: ['vacation', 'breathable'],
    },

    // ── Extended catalogue ──────────────────────────────────────────────────
    // Added purely by appending — existing dresses (matched by slug) are left
    // untouched. Broadens coverage so that for every occasion the user can
    // request there are well-suited dresses for every body shape (body shape is
    // a scoring factor, but occasion/category/season are hard filters), and so
    // the engine ranks a genuine selection across styles, colours, sizes and
    // price bands rather than the whole catalogue.
    {
      name: 'Scarlet Satin Bodycon', description: 'A sculpting satin bodycon with a sweetheart neckline that celebrates a defined waist under evening light.',
      brand: 'Velvet Rose', category: 'Party', style: 'Bodycon', season: 'Winter', fabric: 'Satin', age: '30–35',
      sleeveType: 'SLEEVELESS', length: 'KNEE', neckStyle: 'Sweetheart', pattern: 'Solid', material: 'Stretch satin',
      basePrice: 9500, discountPct: 10, isFeatured: true, rating: 4.6, ratingCount: 88,
      colors: ['Red', 'Navy', 'Black'], occasions: ['Party', 'Wedding', 'Date Night'], shapes: ['HOURGLASS'],
      sizes: [{ label: 'XS', stock: 2 }, { label: 'S', stock: 10 }, { label: 'M', stock: 6 }, { label: 'L', stock: 2 }],
      images: ['1606760227091-3dd870d97f1d', '1622080159549-11537bf939e6'], tags: ['statement', 'waist-defining'],
    },
    {
      name: 'Lilac A-Line Day Dress', description: 'A sweet cotton A-line with a flared skirt that skims the hips — an easy pick for graduations and garden days.',
      brand: 'Saffron', category: 'Casual', style: 'A-Line', season: 'Spring', fabric: 'Cotton', age: '18–24',
      sleeveType: 'SHORT', length: 'KNEE', neckStyle: 'Round', pattern: 'Floral', material: 'Cotton poplin',
      basePrice: 2600, discountPct: 0, isFeatured: false, rating: 4.4, ratingCount: 61,
      colors: ['Lavender', 'Blush Pink', 'White'], occasions: ['Graduation', 'Casual Outing', 'Festival'], shapes: ['PEAR', 'INVERTED_TRIANGLE'],
      sizes: [{ label: 'XS', stock: 2 }, { label: 'S', stock: 5 }, { label: 'M', stock: 8 }, { label: 'L', stock: 7 }, { label: 'XL', stock: 6 }, { label: 'XXL', stock: 2 }],
      images: ['1496217590455-aa63a8350eea', '1610048616025-11a3dcc9fd0b'], tags: ['everyday', 'romantic'],
    },
    {
      name: 'Poppy Peplum Party Dress', description: 'A structured peplum in ponte jersey that carves a waist onto a straight silhouette — made to dance in.',
      brand: 'Bloom & Co', category: 'Party', style: 'Peplum', season: 'Autumn', fabric: 'Jersey', age: '18–24',
      sleeveType: 'CAP', length: 'KNEE', neckStyle: 'Square', pattern: 'Solid', material: 'Ponte jersey',
      basePrice: 3300, discountPct: 10, isFeatured: false, rating: 4.3, ratingCount: 47,
      colors: ['Red', 'Mustard', 'Black'], occasions: ['Party', 'Casual Outing', 'Date Night'], shapes: ['RECTANGLE'],
      sizes: [{ label: 'XS', stock: 2 }, { label: 'S', stock: 9 }, { label: 'M', stock: 10 }, { label: 'L', stock: 2 }],
      images: ['1502868354157-ec2edd2a1651', '1606760227091-3dd870d97f1d'], tags: ['curve-creating', 'structured'],
    },
    {
      name: 'Champagne Goddess Maxi', description: 'A floor-sweeping chiffon gown with a halter neck that broadens the shoulders in balance — pure red-carpet ease.',
      brand: 'Velvet Rose', category: 'Evening Gown', style: 'Maxi', season: 'All-Season', fabric: 'Chiffon', age: '25–29',
      sleeveType: 'SLEEVELESS', length: 'FLOOR', neckStyle: 'Halter', pattern: 'Solid', material: 'Silk chiffon',
      basePrice: 10500, discountPct: 10, isFeatured: true, rating: 4.8, ratingCount: 55,
      colors: ['Champagne', 'Red', 'Lavender'], occasions: ['Wedding', 'Date Night', 'Party'], shapes: ['APPLE', 'PEAR'],
      sizes: [{ label: 'S', stock: 2 }, { label: 'M', stock: 9 }, { label: 'L', stock: 2 }],
      images: ['1610209740880-6ecc4b20ea78', '1623609163859-ca93c959b98a'], tags: ['black-tie', 'ethereal'],
    },
    {
      name: 'Emerald Swing A-Line', description: 'A stretch-velvet A-line whose swing skirt adds volume below the waist — flattering fuller shoulders beautifully.',
      brand: 'Aurelia', category: 'Party', style: 'A-Line', season: 'Autumn', fabric: 'Velvet', age: '18–24',
      sleeveType: 'THREE_QUARTER', length: 'KNEE', neckStyle: 'Boat', pattern: 'Solid', material: 'Stretch velvet',
      basePrice: 4700, discountPct: 0, isFeatured: false, rating: 4.5, ratingCount: 72,
      colors: ['Emerald', 'Navy', 'Burgundy'], occasions: ['Party', 'Graduation', 'Date Night'], shapes: ['PEAR'],
      sizes: [{ label: 'XS', stock: 2 }, { label: 'S', stock: 7 }, { label: 'M', stock: 11 }, { label: 'L', stock: 10 }, { label: 'XL', stock: 7 }, { label: 'XXL', stock: 2 }],
      images: ['1572804013309-59a88b7e92f1', '1609357605129-26f69add5d6e'], tags: ['balancing', 'jewel-tone'],
    },
    {
      name: 'Slate Tailored Wrap', description: 'A polished ponte wrap that ties to your own waist — desk-to-dinner tailoring with a forgiving drape.',
      brand: 'Maison Lune', category: 'Office', style: 'Wrap', season: 'All-Season', fabric: 'Jersey', age: '25–29',
      sleeveType: 'THREE_QUARTER', length: 'MIDI', neckStyle: 'V-Neck', pattern: 'Solid', material: 'Ponte jersey',
      basePrice: 4400, discountPct: 5, isFeatured: false, rating: 4.4, ratingCount: 66,
      colors: ['Navy', 'Black', 'Emerald'], occasions: ['Office', 'Casual Outing', 'Date Night'], shapes: ['HOURGLASS'],
      sizes: [{ label: 'M', stock: 2 }, { label: 'L', stock: 13 }, { label: 'XL', stock: 2 }],
      images: ['1485968579580-b6d095142e6e', '1487412720507-e7ab37603c6f'], tags: ['workwear', 'versatile'],
    },
    {
      name: 'Sunlit Linen Wrap Dress', description: 'A breezy washed-linen wrap that ties to flatter any figure — the effortless answer to warm-weather dressing.',
      brand: 'Nordic Thread', category: 'Summer', style: 'Wrap', season: 'Summer', fabric: 'Linen', age: '18–24',
      sleeveType: 'SHORT', length: 'MIDI', neckStyle: 'V-Neck', pattern: 'Solid', material: 'Washed linen',
      basePrice: 2700, discountPct: 0, isFeatured: false, rating: 4.2, ratingCount: 38,
      colors: ['White', 'Mustard', 'Blush Pink'], occasions: ['Casual Outing', 'Festival'], shapes: ['HOURGLASS'],
      sizes: [{ label: 'XS', stock: 2 }, { label: 'S', stock: 10 }, { label: 'M', stock: 9 }, { label: 'L', stock: 2 }],
      images: ['1520026582657-4daf5bb60adb', '1539008835657-9e8e9680c956'], tags: ['breathable', 'vacation'],
    },
    {
      name: 'Onyx Silk Column Gown', description: 'A minimalist silk-crepe column with a high neck and long sleeves — quiet luxury for black-tie evenings.',
      brand: 'Aurelia', category: 'Formal', style: 'Bodycon', season: 'Winter', fabric: 'Silk', age: '30–35',
      sleeveType: 'LONG', length: 'FLOOR', neckStyle: 'High', pattern: 'Solid', material: 'Silk crepe',
      basePrice: 11800, discountPct: 15, isFeatured: true, rating: 4.9, ratingCount: 41,
      colors: ['Black', 'Burgundy', 'Navy'], occasions: ['Wedding', 'Party'], shapes: ['HOURGLASS'],
      sizes: [{ label: 'S', stock: 2 }, { label: 'M', stock: 11 }, { label: 'L', stock: 9 }, { label: 'XL', stock: 2 }],
      images: ['1623580674393-edf6eb7090f8', '1518049362265-d5b2a6467637'], tags: ['luxury', 'minimal'],
    },
    {
      name: 'Blush Lace Cocktail Dress', description: 'A corded-lace fit-and-flare with a sweetheart bodice — the softest romantic choice for weddings and dates.',
      brand: 'Maison Lune', category: 'Cocktail', style: 'Fit & Flare', season: 'Spring', fabric: 'Lace', age: '18–24',
      sleeveType: 'CAP', length: 'KNEE', neckStyle: 'Sweetheart', pattern: 'Lace', material: 'Corded lace',
      basePrice: 5600, discountPct: 0, isFeatured: false, rating: 4.6, ratingCount: 79,
      colors: ['Blush Pink', 'Champagne', 'White'], occasions: ['Wedding', 'Party', 'Date Night'], shapes: ['RECTANGLE', 'PEAR'],
      sizes: [{ label: 'L', stock: 2 }, { label: 'XL', stock: 12 }, { label: 'XXL', stock: 2 }],
      images: ['1534534734151-83bc15801803', '1520026582657-4daf5bb60adb'], tags: ['romantic', 'wedding-guest'],
    },
    {
      name: 'Marigold Empire Sundress', description: 'An airy cotton-voile empire dress that falls from beneath the bust — comfortable, forgiving and sun-ready.',
      brand: 'Bloom & Co', category: 'Summer', style: 'Empire Waist', season: 'Summer', fabric: 'Cotton', age: '25–29',
      sleeveType: 'SLEEVELESS', length: 'MIDI', neckStyle: 'Square', pattern: 'Floral', material: 'Cotton voile',
      basePrice: 3100, discountPct: 10, isFeatured: false, rating: 4.3, ratingCount: 54,
      colors: ['Mustard', 'White', 'Emerald'], occasions: ['Casual Outing', 'Festival', 'Graduation'], shapes: ['APPLE'],
      sizes: [{ label: 'S', stock: 2 }, { label: 'M', stock: 9 }, { label: 'L', stock: 2 }],
      images: ['1515372039744-b8f02a3ae446', '1539008835657-9e8e9680c956'], tags: ['forgiving', 'breathable'],
    },
    {
      name: 'Harbor Shift Dress', description: 'A clean ponte shift with crisp lines — an unfussy, endlessly wearable staple for the working week.',
      brand: 'Nordic Thread', category: 'Office', style: 'Shift', season: 'Autumn', fabric: 'Jersey', age: '30–35',
      sleeveType: 'SHORT', length: 'KNEE', neckStyle: 'Round', pattern: 'Solid', material: 'Ponte',
      basePrice: 3900, discountPct: 0, isFeatured: false, rating: 4.1, ratingCount: 29,
      colors: ['Navy', 'Black', 'Champagne'], occasions: ['Office', 'Casual Outing'], shapes: ['APPLE'],
      sizes: [{ label: 'S', stock: 2 }, { label: 'M', stock: 7 }, { label: 'L', stock: 8 }, { label: 'XL', stock: 2 }],
      images: ['1485968579580-b6d095142e6e', '1622079400125-5b6679552976'], tags: ['workwear', 'minimal'],
    },
    {
      name: 'Burgundy Velvet Fit & Flare', description: 'A rich stretch-velvet fit-and-flare with a nipped waist and twirl-ready skirt — festive without effort.',
      brand: 'Aurelia', category: 'Cocktail', style: 'Fit & Flare', season: 'Winter', fabric: 'Velvet', age: '25–29',
      sleeveType: 'LONG', length: 'KNEE', neckStyle: 'Scoop', pattern: 'Solid', material: 'Stretch velvet',
      basePrice: 6100, discountPct: 5, isFeatured: true, rating: 4.7, ratingCount: 96,
      colors: ['Burgundy', 'Emerald', 'Black'], occasions: ['Party', 'Date Night', 'Wedding'], shapes: ['INVERTED_TRIANGLE', 'RECTANGLE'],
      sizes: [{ label: 'S', stock: 2 }, { label: 'M', stock: 8 }, { label: 'L', stock: 2 }],
      images: ['1572804013309-59a88b7e92f1', '1583039949165-96ee24b0d8de'], tags: ['festive', 'waist-defining'],
    },
    {
      name: 'Forest Empire Maxi', description: 'A flowing chiffon empire maxi that grazes the midsection and falls long — elegant, easy and endlessly comfortable.',
      brand: 'Saffron', category: 'Formal', style: 'Empire Waist', season: 'All-Season', fabric: 'Chiffon', age: '30–35',
      sleeveType: 'THREE_QUARTER', length: 'MAXI', neckStyle: 'Boat', pattern: 'Solid', material: 'Chiffon overlay',
      basePrice: 4900, discountPct: 10, isFeatured: false, rating: 4.5, ratingCount: 63,
      colors: ['Emerald', 'Navy', 'Champagne'], occasions: ['Wedding', 'Office', 'Graduation'], shapes: ['APPLE'],
      sizes: [{ label: 'L', stock: 2 }, { label: 'XL', stock: 7 }, { label: 'XXL', stock: 2 }],
      images: ['1609357605129-26f69add5d6e', '1502716119720-b23a93e5fe1b'], tags: ['comfortable', 'forgiving'],
    },
    {
      name: 'Cherry Jersey Wrap', description: 'A soft viscose-jersey wrap in bright cherry — the flattering, throw-on-and-go hero for almost any day.',
      brand: 'Bloom & Co', category: 'Casual', style: 'Wrap', season: 'All-Season', fabric: 'Jersey', age: '18–24',
      sleeveType: 'THREE_QUARTER', length: 'MIDI', neckStyle: 'V-Neck', pattern: 'Solid', material: 'Viscose jersey',
      basePrice: 2500, discountPct: 0, isFeatured: false, rating: 4.4, ratingCount: 110,
      colors: ['Red', 'Black', 'Navy'], occasions: ['Casual Outing', 'Date Night', 'Party'], shapes: ['HOURGLASS'],
      sizes: [{ label: 'XS', stock: 2 }, { label: 'S', stock: 8 }, { label: 'M', stock: 2 }],
      images: ['1502868354157-ec2edd2a1651', '1586693231040-e89840e7d805'], tags: ['everyday', 'flattering'],
    },
    {
      name: 'Amethyst Bodycon Mini', description: 'A stretch-jersey mini with a halter neck that widens the shoulder line — a playful, leg-lengthening party piece.',
      brand: 'Velvet Rose', category: 'Party', style: 'Bodycon', season: 'Summer', fabric: 'Jersey', age: '18–24',
      sleeveType: 'SLEEVELESS', length: 'MINI', neckStyle: 'Halter', pattern: 'Solid', material: 'Stretch jersey',
      basePrice: 4300, discountPct: 0, isFeatured: false, rating: 4.2, ratingCount: 44,
      colors: ['Lavender', 'Black', 'Blush Pink'], occasions: ['Party', 'Date Night'], shapes: ['HOURGLASS'],
      sizes: [{ label: 'S', stock: 2 }, { label: 'M', stock: 11 }, { label: 'L', stock: 2 }],
      images: ['1490481651871-ab68de25d43d', '1539109136881-3be0616acf4b'], tags: ['playful', 'leg-lengthening'],
    },
    {
      name: 'Pearl A-Line Bridal Guest', description: 'A mikado-satin A-line with a sweetheart bodice and structured skirt — a refined choice for weddings and ceremonies.',
      brand: 'Maison Lune', category: 'Formal', style: 'A-Line', season: 'Spring', fabric: 'Satin', age: '25–29',
      sleeveType: 'CAP', length: 'MIDI', neckStyle: 'Sweetheart', pattern: 'Solid', material: 'Mikado satin',
      basePrice: 7800, discountPct: 5, isFeatured: true, rating: 4.8, ratingCount: 58,
      colors: ['White', 'Champagne', 'Blush Pink'], occasions: ['Wedding', 'Graduation'], shapes: ['PEAR'],
      sizes: [{ label: 'M', stock: 2 }, { label: 'L', stock: 7 }, { label: 'XL', stock: 2 }],
      images: ['1623609163859-ca93c959b98a', '1469334031218-e382a71b716b'], tags: ['wedding-guest', 'structured'],
    },
    {
      name: 'Cobalt Peplum Blazer Dress', description: 'A sharp cotton-twill peplum with a blazer collar that defines the waist — commanding in the boardroom.',
      brand: 'Nordic Thread', category: 'Office', style: 'Peplum', season: 'Autumn', fabric: 'Cotton', age: '30–35',
      sleeveType: 'LONG', length: 'KNEE', neckStyle: 'Round', pattern: 'Solid', material: 'Cotton twill',
      basePrice: 5200, discountPct: 10, isFeatured: false, rating: 4.4, ratingCount: 51,
      colors: ['Navy', 'Black', 'Burgundy'], occasions: ['Office', 'Party', 'Wedding'], shapes: ['RECTANGLE'],
      sizes: [{ label: 'L', stock: 2 }, { label: 'XL', stock: 14 }, { label: 'XXL', stock: 2 }],
      images: ['1487412720507-e7ab37603c6f', '1617258856138-402b60da4e2a'], tags: ['workwear', 'structured'],
    },
    {
      name: 'Amber Cotton Shift', description: 'A pure-cotton shift in warm amber that skims the frame — the budget-friendly, breathable everyday essential.',
      brand: 'Saffron', category: 'Summer', style: 'Shift', season: 'Summer', fabric: 'Cotton', age: '25–29',
      sleeveType: 'SHORT', length: 'KNEE', neckStyle: 'Round', pattern: 'Solid', material: 'Cotton',
      basePrice: 1900, discountPct: 0, isFeatured: false, rating: 4.0, ratingCount: 22,
      colors: ['Mustard', 'White', 'Champagne'], occasions: ['Casual Outing', 'Festival'], shapes: ['APPLE'],
      sizes: [{ label: 'M', stock: 2 }, { label: 'L', stock: 8 }, { label: 'XL', stock: 6 }, { label: 'XXL', stock: 2 }],
      images: ['1610209740880-6ecc4b20ea78', '1509755512670-9e7af886e7e9'], tags: ['everyday', 'budget-friendly'],
    },
    {
      name: 'Sapphire Pleated A-Line', description: 'A pleated-chiffon A-line whose skirt flares from the waist to balance broader shoulders — graceful for graduations.',
      brand: 'Aurelia', category: 'Party', style: 'A-Line', season: 'Autumn', fabric: 'Chiffon', age: '18–24',
      sleeveType: 'SLEEVELESS', length: 'KNEE', neckStyle: 'Halter', pattern: 'Solid', material: 'Pleated chiffon',
      basePrice: 4500, discountPct: 0, isFeatured: false, rating: 4.5, ratingCount: 68,
      colors: ['Navy', 'Emerald', 'Champagne'], occasions: ['Graduation', 'Party', 'Date Night'], shapes: ['PEAR', 'RECTANGLE'],
      sizes: [{ label: 'L', stock: 2 }, { label: 'XL', stock: 13 }, { label: 'XXL', stock: 2 }],
      images: ['1622079400125-5b6679552976', '1490481651871-ab68de25d43d'], tags: ['balancing', 'graceful'],
    },
    {
      name: 'Rosewood Chiffon Fit & Flare', description: 'A romantic chiffon fit-and-flare with a sweetheart bodice and full skirt that adds welcome volume to the hips.',
      brand: 'Velvet Rose', category: 'Cocktail', style: 'Fit & Flare', season: 'All-Season', fabric: 'Chiffon', age: '25–29',
      sleeveType: 'CAP', length: 'KNEE', neckStyle: 'Sweetheart', pattern: 'Solid', material: 'Chiffon',
      basePrice: 6300, discountPct: 5, isFeatured: false, rating: 4.6, ratingCount: 74,
      colors: ['Burgundy', 'Blush Pink', 'Champagne'], occasions: ['Wedding', 'Date Night', 'Party'], shapes: ['RECTANGLE', 'PEAR'],
      sizes: [{ label: 'XS', stock: 2 }, { label: 'S', stock: 5 }, { label: 'M', stock: 6 }, { label: 'L', stock: 2 }],
      images: ['1568252542512-9fe8fe9c87bb', '1502716119720-b23a93e5fe1b'], tags: ['romantic', 'balancing'],
    },
    {
      name: 'Terracotta Tiered Maxi', description: 'A tiered cotton-gauze maxi that builds volume toward the hem — an easy, shoulder-balancing pick for festivals.',
      brand: 'Saffron', category: 'Summer', style: 'Maxi', season: 'Summer', fabric: 'Cotton', age: '25–29',
      sleeveType: 'SHORT', length: 'MAXI', neckStyle: 'Round', pattern: 'Solid', material: 'Cotton gauze',
      basePrice: 3600, discountPct: 10, isFeatured: false, rating: 4.3, ratingCount: 49,
      colors: ['Mustard', 'White', 'Champagne'], occasions: ['Festival', 'Casual Outing', 'Graduation'], shapes: ['INVERTED_TRIANGLE', 'PEAR'],
      sizes: [{ label: 'S', stock: 2 }, { label: 'M', stock: 10 }, { label: 'L', stock: 6 }, { label: 'XL', stock: 2 }],
      images: ['1539008835657-9e8e9680c956', '1610209740880-6ecc4b20ea78'], tags: ['vacation', 'balancing'],
    },
    {
      name: 'Pewter Empire Midi', description: 'A ponte empire midi that releases from beneath the bust — a comfortable, boardroom-ready line that skims the middle.',
      brand: 'Maison Lune', category: 'Office', style: 'Empire Waist', season: 'All-Season', fabric: 'Jersey', age: '30–35',
      sleeveType: 'THREE_QUARTER', length: 'MIDI', neckStyle: 'Boat', pattern: 'Solid', material: 'Ponte jersey',
      basePrice: 4600, discountPct: 5, isFeatured: false, rating: 4.4, ratingCount: 57,
      colors: ['Navy', 'Black', 'Emerald'], occasions: ['Office', 'Wedding', 'Casual Outing'], shapes: ['APPLE'],
      sizes: [{ label: 'M', stock: 2 }, { label: 'L', stock: 9 }, { label: 'XL', stock: 8 }, { label: 'XXL', stock: 2 }],
      images: ['1518049362265-d5b2a6467637', '1485968579580-b6d095142e6e'], tags: ['workwear', 'forgiving'],
    },
    {
      name: 'Plum Faux-Wrap Dress', description: 'A soft jersey faux-wrap that skims the midsection and ties nothing too tight — flattering, forgiving and easy to wear.',
      brand: 'Aurelia', category: 'Casual', style: 'Wrap', season: 'Autumn', fabric: 'Jersey', age: '25–29',
      sleeveType: 'LONG', length: 'MIDI', neckStyle: 'V-Neck', pattern: 'Solid', material: 'Viscose jersey',
      basePrice: 3200, discountPct: 0, isFeatured: false, rating: 4.4, ratingCount: 88,
      colors: ['Burgundy', 'Navy', 'Black'], occasions: ['Casual Outing', 'Office', 'Date Night'], shapes: ['HOURGLASS'],
      sizes: [{ label: 'M', stock: 2 }, { label: 'L', stock: 9 }, { label: 'XL', stock: 5 }, { label: 'XXL', stock: 2 }],
      images: ['1585487000160-6ebcfceb0d03', '1583039949165-96ee24b0d8de'], tags: ['forgiving', 'everyday'],
    },
    {
      name: 'Stone Ponte Shift', description: 'A structured ponte shift with a clean column line that glides over the waist — quietly smart for the office.',
      brand: 'Nordic Thread', category: 'Office', style: 'Shift', season: 'Winter', fabric: 'Jersey', age: '30–35',
      sleeveType: 'LONG', length: 'KNEE', neckStyle: 'Round', pattern: 'Solid', material: 'Ponte',
      basePrice: 4100, discountPct: 0, isFeatured: false, rating: 4.2, ratingCount: 34,
      colors: ['Champagne', 'Navy', 'Black'], occasions: ['Office', 'Casual Outing'], shapes: ['APPLE'],
      sizes: [{ label: 'L', stock: 2 }, { label: 'XL', stock: 11 }, { label: 'XXL', stock: 2 }],
      images: ['1571513721963-d855fd8df4c2', '1469334031218-e382a71b716b'], tags: ['workwear', 'minimal'],
    },
    {
      name: 'Rose Satin Fit & Flare', description: 'A duchess-satin fit-and-flare with a sweetheart bodice and swishy skirt — a polished pick for weddings and parties.',
      brand: 'Maison Lune', category: 'Party', style: 'Fit & Flare', season: 'Spring', fabric: 'Satin', age: '18–24',
      sleeveType: 'CAP', length: 'KNEE', neckStyle: 'Sweetheart', pattern: 'Solid', material: 'Duchess satin',
      basePrice: 5400, discountPct: 0, isFeatured: true, rating: 4.7, ratingCount: 91,
      colors: ['Blush Pink', 'Champagne', 'Red'], occasions: ['Wedding', 'Party', 'Graduation'], shapes: ['RECTANGLE', 'PEAR'],
      sizes: [{ label: 'S', stock: 2 }, { label: 'M', stock: 11 }, { label: 'L', stock: 6 }, { label: 'XL', stock: 2 }],
      images: ['1562645361-c88442d7bc58', '1534534734151-83bc15801803'], tags: ['romantic', 'waist-defining'],
    },
    {
      name: 'Sky Cotton A-Line', description: 'A crisp cotton A-line with a fitted bodice and flared skirt — a fresh, breezy staple for daytime celebrations.',
      brand: 'Bloom & Co', category: 'Summer', style: 'A-Line', season: 'Summer', fabric: 'Cotton', age: '18–24',
      sleeveType: 'SHORT', length: 'KNEE', neckStyle: 'Round', pattern: 'Floral', material: 'Cotton poplin',
      basePrice: 2400, discountPct: 0, isFeatured: false, rating: 4.2, ratingCount: 43,
      colors: ['White', 'Lavender', 'Blush Pink'], occasions: ['Festival', 'Casual Outing', 'Graduation'], shapes: ['PEAR', 'INVERTED_TRIANGLE'],
      sizes: [{ label: 'XS', stock: 2 }, { label: 'S', stock: 10 }, { label: 'M', stock: 10 }, { label: 'L', stock: 2 }],
      images: ['1496217590455-aa63a8350eea', '1613966570650-add3cf83aa83'], tags: ['everyday', 'fresh'],
    },
    {
      name: 'Ink Peplum Sheath', description: 'A tailored ponte peplum with a defined waist and structured flare over the hips — sharp for work and beyond.',
      brand: 'Aurelia', category: 'Office', style: 'Peplum', season: 'Autumn', fabric: 'Jersey', age: '30–35',
      sleeveType: 'THREE_QUARTER', length: 'KNEE', neckStyle: 'Round', pattern: 'Solid', material: 'Ponte jersey',
      basePrice: 5000, discountPct: 10, isFeatured: false, rating: 4.4, ratingCount: 52,
      colors: ['Navy', 'Black', 'Burgundy'], occasions: ['Office', 'Party', 'Wedding'], shapes: ['RECTANGLE'],
      sizes: [{ label: 'S', stock: 2 }, { label: 'M', stock: 8 }, { label: 'L', stock: 7 }, { label: 'XL', stock: 2 }],
      images: ['1487412720507-e7ab37603c6f', '1617258856138-402b60da4e2a'], tags: ['workwear', 'structured'],
    },
    {
      name: 'Olive Empire Gown', description: 'A floor-length chiffon empire gown that flows from beneath the bust — forgiving, elegant and balancing for the shoulders.',
      brand: 'Saffron', category: 'Formal', style: 'Empire Waist', season: 'All-Season', fabric: 'Chiffon', age: '30–35',
      sleeveType: 'LONG', length: 'FLOOR', neckStyle: 'Boat', pattern: 'Solid', material: 'Chiffon overlay',
      basePrice: 6800, discountPct: 5, isFeatured: true, rating: 4.6, ratingCount: 47,
      colors: ['Emerald', 'Navy', 'Champagne'], occasions: ['Wedding', 'Graduation', 'Party'], shapes: ['APPLE'],
      sizes: [{ label: 'S', stock: 2 }, { label: 'M', stock: 8 }, { label: 'L', stock: 2 }],
      images: ['1609357605129-26f69add5d6e', '1595777457583-95e059d581b8'], tags: ['forgiving', 'ethereal'],
    },
    {
      name: 'Crimson Ribbed Bodycon', description: 'A ribbed-jersey mini that hugs a defined waist with a high neckline — a bold, easy statement for a night out.',
      brand: 'Velvet Rose', category: 'Party', style: 'Bodycon', season: 'Winter', fabric: 'Jersey', age: '18–24',
      sleeveType: 'LONG', length: 'MINI', neckStyle: 'High', pattern: 'Solid', material: 'Ribbed jersey',
      basePrice: 3900, discountPct: 0, isFeatured: false, rating: 4.3, ratingCount: 61,
      colors: ['Red', 'Black', 'Burgundy'], occasions: ['Party', 'Date Night'], shapes: ['HOURGLASS'],
      sizes: [{ label: 'XS', stock: 2 }, { label: 'S', stock: 6 }, { label: 'M', stock: 11 }, { label: 'L', stock: 2 }],
      images: ['1622080159549-11537bf939e6', '1606760227091-3dd870d97f1d'], tags: ['statement', 'playful'],
    },
    {
      name: 'Sand Linen Maxi', description: 'A relaxed washed-linen maxi with a square neck and easy drape — the breathable answer to warm-weather ease.',
      brand: 'Nordic Thread', category: 'Summer', style: 'Maxi', season: 'Summer', fabric: 'Linen', age: '25–29',
      sleeveType: 'SLEEVELESS', length: 'MAXI', neckStyle: 'Square', pattern: 'Solid', material: 'Washed linen',
      basePrice: 3300, discountPct: 10, isFeatured: false, rating: 4.3, ratingCount: 39,
      colors: ['White', 'Champagne', 'Mustard'], occasions: ['Festival', 'Casual Outing'], shapes: ['INVERTED_TRIANGLE', 'APPLE'],
      sizes: [{ label: 'XS', stock: 2 }, { label: 'S', stock: 10 }, { label: 'M', stock: 6 }, { label: 'L', stock: 2 }],
      images: ['1566174053879-31528523f8ae', '1613966570650-add3cf83aa83'], tags: ['vacation', 'breathable'],
    },
    {
      name: 'Teal Velvet Fit & Flare', description: 'A jewel-toned stretch-velvet fit-and-flare with a nipped waist and full skirt — festive and figure-flattering.',
      brand: 'Aurelia', category: 'Cocktail', style: 'Fit & Flare', season: 'Winter', fabric: 'Velvet', age: '25–29',
      sleeveType: 'LONG', length: 'KNEE', neckStyle: 'Scoop', pattern: 'Solid', material: 'Stretch velvet',
      basePrice: 6000, discountPct: 5, isFeatured: false, rating: 4.6, ratingCount: 83,
      colors: ['Emerald', 'Navy', 'Black'], occasions: ['Party', 'Graduation', 'Date Night'], shapes: ['INVERTED_TRIANGLE', 'RECTANGLE'],
      sizes: [{ label: 'XS', stock: 2 }, { label: 'S', stock: 7 }, { label: 'M', stock: 10 }, { label: 'L', stock: 11 }, { label: 'XL', stock: 5 }, { label: 'XXL', stock: 2 }],
      images: ['1595777457583-95e059d581b8', '1572804013309-59a88b7e92f1'], tags: ['festive', 'balancing'],
    },
    {
      name: 'Mocha Jersey Wrap', description: 'A warm-toned viscose-jersey wrap that ties to the waist and drapes softly — a flattering, everyday all-rounder.',
      brand: 'Bloom & Co', category: 'Casual', style: 'Wrap', season: 'All-Season', fabric: 'Jersey', age: '30–35',
      sleeveType: 'THREE_QUARTER', length: 'MIDI', neckStyle: 'V-Neck', pattern: 'Solid', material: 'Viscose jersey',
      basePrice: 2800, discountPct: 0, isFeatured: false, rating: 4.4, ratingCount: 97,
      colors: ['Mustard', 'Navy', 'Champagne'], occasions: ['Casual Outing', 'Office', 'Date Night'], shapes: ['HOURGLASS'],
      sizes: [{ label: 'M', stock: 2 }, { label: 'L', stock: 10 }, { label: 'XL', stock: 9 }, { label: 'XXL', stock: 2 }],
      images: ['1509755512670-9e7af886e7e9', '1515372039744-b8f02a3ae446'], tags: ['everyday', 'flattering'],
    },
    {
      name: 'Dune Cotton Shift', description: 'A lightweight pure-cotton shift with an easy round neck — the budget-friendly, breathable staple for warm days.',
      brand: 'Saffron', category: 'Summer', style: 'Shift', season: 'Summer', fabric: 'Cotton', age: '18–24',
      sleeveType: 'SHORT', length: 'KNEE', neckStyle: 'Round', pattern: 'Solid', material: 'Cotton',
      basePrice: 2000, discountPct: 0, isFeatured: false, rating: 4.1, ratingCount: 26,
      colors: ['Champagne', 'White', 'Mustard'], occasions: ['Casual Outing', 'Festival', 'Graduation'], shapes: ['APPLE'],
      sizes: [{ label: 'M', stock: 2 }, { label: 'L', stock: 15 }, { label: 'XL', stock: 2 }],
      images: ['1571513721963-d855fd8df4c2', '1469334031218-e382a71b716b'], tags: ['everyday', 'budget-friendly'],
    },

    // ── Coverage pack ───────────────────────────────────────────────────────
    // Added to close gaps the honest re-tagging exposed. Once shape tags were
    // reduced to the 1–2 shapes each garment genuinely suits, the catalogue
    // turned out to be thin on cuts that flatter Rectangle and Inverted
    // Triangle figures (peplum, fit-and-flare, full A-line skirts, V and scoop
    // necklines), and 39 of 45 dresses were plain solids. These broaden the
    // silhouette, neckline, pattern, price and size-run spread so the engine
    // has genuinely different options to choose between for every shape.
    {
      name: 'Ivory Peplum Cocktail Dress', description: 'A structured peplum that carves a waistline out of a straight silhouette, finished with a soft sweetheart neckline.',
      brand: 'Maison Lune', category: 'Cocktail', style: 'Peplum', season: 'All-Season', fabric: 'Satin', age: '25–29',
      sleeveType: 'CAP', length: 'KNEE', neckStyle: 'Sweetheart', pattern: 'Solid', material: 'Duchess satin',
      basePrice: 6800, discountPct: 5, isFeatured: true, rating: 4.6, ratingCount: 74,
      colors: ['White', 'Champagne', 'Blush Pink'], occasions: ['Wedding', 'Party', 'Graduation'], shapes: ['RECTANGLE'],
      sizes: [{ label: 'L', stock: 2 }, { label: 'XL', stock: 11 }, { label: 'XXL', stock: 2 }], images: ['1566174053879-31528523f8ae', '1623609163859-ca93c959b98a'], tags: ['waist-defining', 'structured'],
    },
    {
      name: 'Poppy Polka Fit & Flare', description: 'A playful polka-dot fit-and-flare with a nipped waist and swing skirt that builds curves where the silhouette runs straight.',
      brand: 'Bloom & Co', category: 'Party', style: 'Fit & Flare', season: 'Spring', fabric: 'Cotton', age: '18–24',
      sleeveType: 'CAP', length: 'KNEE', neckStyle: 'Sweetheart', pattern: 'Polka Dot', material: 'Cotton sateen',
      basePrice: 3400, discountPct: 0, isFeatured: false, rating: 4.4, ratingCount: 52,
      colors: ['Red', 'White', 'Navy'], occasions: ['Party', 'Casual Outing', 'Date Night'], shapes: ['RECTANGLE', 'PEAR'],
      sizes: [{ label: 'XS', stock: 2 }, { label: 'S', stock: 8 }, { label: 'M', stock: 7 }, { label: 'L', stock: 2 }], images: ['1502868354157-ec2edd2a1651', '1586693231040-e89840e7d805'], tags: ['retro', 'playful'],
    },
    {
      name: 'Marigold Ruched Wrap', description: 'A jersey wrap with side ruching that gathers at the waist to create definition and shape.',
      brand: 'Saffron', category: 'Casual', style: 'Wrap', season: 'Summer', fabric: 'Jersey', age: '25–29',
      sleeveType: 'SHORT', length: 'MIDI', neckStyle: 'Scoop', pattern: 'Solid', material: 'Stretch jersey',
      basePrice: 2900, discountPct: 10, isFeatured: false, rating: 4.5, ratingCount: 96,
      colors: ['Mustard', 'Emerald', 'Black'], occasions: ['Casual Outing', 'Office', 'Date Night'], shapes: ['HOURGLASS', 'RECTANGLE'],
      sizes: [{ label: 'XS', stock: 2 }, { label: 'S', stock: 14 }, { label: 'M', stock: 2 }], images: ['1515372039744-b8f02a3ae446', '1509755512670-9e7af886e7e9'], tags: ['ruched', 'easy-wear'],
    },
    {
      name: 'Chantilly Lace Peplum', description: 'Delicate lace over a structured peplum bodice — decorative volume at the hip and a clearly marked waist.',
      brand: 'Velvet Rose', category: 'Formal', style: 'Peplum', season: 'Autumn', fabric: 'Lace', age: '25–29',
      sleeveType: 'THREE_QUARTER', length: 'KNEE', neckStyle: 'Scoop', pattern: 'Lace', material: 'Corded lace',
      basePrice: 8900, discountPct: 15, isFeatured: true, rating: 4.7, ratingCount: 63,
      colors: ['Burgundy', 'Black', 'Champagne'], occasions: ['Wedding', 'Party', 'Graduation'], shapes: ['RECTANGLE'],
      sizes: [{ label: 'XS', stock: 2 }, { label: 'S', stock: 10 }, { label: 'M', stock: 2 }], images: ['1502716119720-b23a93e5fe1b', '1568252542512-9fe8fe9c87bb'], tags: ['lace', 'occasion-wear'],
    },
    {
      name: 'Juniper Belted Shirt Dress', description: 'A crisp cotton wrap-front shirt dress with a wide tie belt that draws in the middle.',
      brand: 'Nordic Thread', category: 'Office', style: 'Wrap', season: 'All-Season', fabric: 'Cotton', age: '30–35',
      sleeveType: 'THREE_QUARTER', length: 'MIDI', neckStyle: 'V-Neck', pattern: 'Striped', material: 'Cotton poplin',
      basePrice: 4200, discountPct: 0, isFeatured: false, rating: 4.3, ratingCount: 41,
      colors: ['Navy', 'White', 'Black'], occasions: ['Office', 'Casual Outing'], shapes: ['HOURGLASS'],
      sizes: [{ label: 'S', stock: 2 }, { label: 'M', stock: 7 }, { label: 'L', stock: 6 }, { label: 'XL', stock: 2 }], images: ['1487412720507-e7ab37603c6f', '1622079400125-5b6679552976'], tags: ['workwear', 'belted'],
    },
    {
      name: 'Azure Swing A-Line Midi', description: 'A full-skirted A-line in fluid chiffon that adds sweep below the waist and softens the shoulder line.',
      brand: 'Aurelia', category: 'Party', style: 'A-Line', season: 'Summer', fabric: 'Chiffon', age: '18–24',
      sleeveType: 'SLEEVELESS', length: 'MIDI', neckStyle: 'V-Neck', pattern: 'Solid', material: 'Silk chiffon',
      basePrice: 5600, discountPct: 0, isFeatured: true, rating: 4.6, ratingCount: 88,
      colors: ['Navy', 'Emerald', 'Lavender'], occasions: ['Party', 'Wedding', 'Graduation'], shapes: ['INVERTED_TRIANGLE'],
      sizes: [{ label: 'S', stock: 2 }, { label: 'M', stock: 7 }, { label: 'L', stock: 2 }], images: ['1490481651871-ab68de25d43d', '1622079400125-5b6679552976'], tags: ['flowy', 'balancing'],
    },
    {
      name: 'Slate Godet Maxi', description: 'A column maxi with godet panels that release into movement at the hem, balancing a broader upper body.',
      brand: 'Maison Lune', category: 'Evening Gown', style: 'Maxi', season: 'Winter', fabric: 'Velvet', age: '30–35',
      sleeveType: 'LONG', length: 'FLOOR', neckStyle: 'V-Neck', pattern: 'Solid', material: 'Stretch velvet',
      basePrice: 12500, discountPct: 20, isFeatured: true, rating: 4.8, ratingCount: 57,
      colors: ['Navy', 'Burgundy', 'Emerald'], occasions: ['Wedding', 'Party'], shapes: ['INVERTED_TRIANGLE', 'APPLE'],
      sizes: [{ label: 'M', stock: 2 }, { label: 'L', stock: 12 }, { label: 'XL', stock: 2 }], images: ['1617258856138-402b60da4e2a', '1518049362265-d5b2a6467637'], tags: ['black-tie', 'dramatic'],
    },
    {
      name: 'Willow Tiered A-Line', description: 'Soft tiers build gentle volume through the skirt while a deep V opens up the neckline.',
      brand: 'Bloom & Co', category: 'Summer', style: 'A-Line', season: 'Summer', fabric: 'Linen', age: '18–24',
      sleeveType: 'SLEEVELESS', length: 'MAXI', neckStyle: 'V-Neck', pattern: 'Floral', material: 'Washed linen',
      basePrice: 3800, discountPct: 5, isFeatured: false, rating: 4.4, ratingCount: 70,
      colors: ['White', 'Blush Pink', 'Mustard'], occasions: ['Festival', 'Casual Outing', 'Graduation'], shapes: ['INVERTED_TRIANGLE'],
      sizes: [{ label: 'S', stock: 2 }, { label: 'M', stock: 10 }, { label: 'L', stock: 5 }, { label: 'XL', stock: 2 }], images: ['1520026582657-4daf5bb60adb', '1613966570650-add3cf83aa83'], tags: ['tiered', 'holiday'],
    },
    {
      name: 'Cobalt Pleated Midi', description: 'Knife pleats fall from a fitted waist, adding measured fullness to the lower half.',
      brand: 'Nordic Thread', category: 'Office', style: 'A-Line', season: 'Autumn', fabric: 'Chiffon', age: '25–29',
      sleeveType: 'THREE_QUARTER', length: 'MIDI', neckStyle: 'Scoop', pattern: 'Solid', material: 'Pleated chiffon',
      basePrice: 5100, discountPct: 0, isFeatured: false, rating: 4.5, ratingCount: 64,
      colors: ['Navy', 'Champagne', 'Black'], occasions: ['Office', 'Graduation', 'Party'], shapes: ['INVERTED_TRIANGLE'],
      sizes: [{ label: 'L', stock: 2 }, { label: 'XL', stock: 15 }, { label: 'XXL', stock: 2 }], images: ['1485968579580-b6d095142e6e', '1490481651871-ab68de25d43d'], tags: ['pleated', 'polished'],
    },
    {
      name: 'Garnet Wrap Midi', description: 'A true wrap in weighty jersey that ties at the waist and follows the curve of the hip.',
      brand: 'Velvet Rose', category: 'Cocktail', style: 'Wrap', season: 'All-Season', fabric: 'Jersey', age: '25–29',
      sleeveType: 'LONG', length: 'MIDI', neckStyle: 'V-Neck', pattern: 'Solid', material: 'Ponte jersey',
      basePrice: 6200, discountPct: 10, isFeatured: true, rating: 4.7, ratingCount: 112,
      colors: ['Burgundy', 'Black', 'Emerald'], occasions: ['Date Night', 'Party', 'Office'], shapes: ['HOURGLASS'],
      sizes: [{ label: 'XS', stock: 2 }, { label: 'S', stock: 6 }, { label: 'M', stock: 9 }, { label: 'L', stock: 2 }], images: ['1585487000160-6ebcfceb0d03', '1572804013309-59a88b7e92f1'], tags: ['bestseller', 'waist-defining'],
    },
    {
      name: 'Onyx Sweetheart Bodycon', description: 'A sculpted bodycon with a sweetheart neckline that traces balanced proportions.',
      brand: 'Aurelia', category: 'Party', style: 'Bodycon', season: 'Winter', fabric: 'Jersey', age: '18–24',
      sleeveType: 'SLEEVELESS', length: 'KNEE', neckStyle: 'Sweetheart', pattern: 'Solid', material: 'Bonded jersey',
      basePrice: 4700, discountPct: 0, isFeatured: false, rating: 4.4, ratingCount: 83,
      colors: ['Black', 'Red', 'Burgundy'], occasions: ['Party', 'Date Night'], shapes: ['HOURGLASS'],
      sizes: [{ label: 'M', stock: 2 }, { label: 'L', stock: 8 }, { label: 'XL', stock: 7 }, { label: 'XXL', stock: 2 }], images: ['1568251188392-ae32f898cb3b', '1623580674393-edf6eb7090f8'], tags: ['bodycon', 'evening'],
    },
    {
      name: 'Rosalind Belted Fit & Flare', description: 'A fitted bodice, contrast belt and flared skirt — classic proportions for a balanced figure.',
      brand: 'Bloom & Co', category: 'Formal', style: 'Fit & Flare', season: 'Spring', fabric: 'Satin', age: '25–29',
      sleeveType: 'CAP', length: 'MIDI', neckStyle: 'V-Neck', pattern: 'Floral', material: 'Satin twill',
      basePrice: 7300, discountPct: 15, isFeatured: true, rating: 4.6, ratingCount: 91,
      colors: ['Blush Pink', 'Champagne', 'Lavender'], occasions: ['Wedding', 'Graduation', 'Party'], shapes: ['PEAR', 'RECTANGLE'],
      sizes: [{ label: 'S', stock: 2 }, { label: 'M', stock: 7 }, { label: 'L', stock: 9 }, { label: 'XL', stock: 2 }], images: ['1562645361-c88442d7bc58', '1568252542512-9fe8fe9c87bb'], tags: ['classic', 'belted'],
    },
    {
      name: 'Sable Cowl Slip Dress', description: 'A bias-cut slip with a soft cowl that skims the body and follows its natural line.',
      brand: 'Maison Lune', category: 'Evening Gown', style: 'Maxi', season: 'Summer', fabric: 'Silk', age: '25–29',
      sleeveType: 'SLEEVELESS', length: 'FLOOR', neckStyle: 'Cowl', pattern: 'Solid', material: 'Sandwashed silk',
      basePrice: 11200, discountPct: 10, isFeatured: true, rating: 4.8, ratingCount: 47,
      colors: ['Champagne', 'Black', 'Emerald'], occasions: ['Wedding', 'Date Night', 'Party'], shapes: ['INVERTED_TRIANGLE'],
      sizes: [{ label: 'S', stock: 2 }, { label: 'M', stock: 8 }, { label: 'L', stock: 2 }], images: ['1610209740880-6ecc4b20ea78', '1623609163859-ca93c959b98a'], tags: ['bias-cut', 'luxe'],
    },
    {
      name: 'Meadow Empire Chiffon Maxi', description: 'An empire seam sits just under the bust and the chiffon falls loose from there, skimming everything below.',
      brand: 'Saffron', category: 'Summer', style: 'Empire Waist', season: 'Summer', fabric: 'Chiffon', age: '30–35',
      sleeveType: 'THREE_QUARTER', length: 'MAXI', neckStyle: 'V-Neck', pattern: 'Floral', material: 'Printed chiffon',
      basePrice: 4400, discountPct: 5, isFeatured: false, rating: 4.5, ratingCount: 78,
      colors: ['Lavender', 'White', 'Emerald'], occasions: ['Festival', 'Casual Outing', 'Wedding'], shapes: ['APPLE'],
      sizes: [{ label: 'XS', stock: 2 }, { label: 'S', stock: 9 }, { label: 'M', stock: 10 }, { label: 'L', stock: 2 }], images: ['1496217590455-aa63a8350eea', '1610048616025-11a3dcc9fd0b'], tags: ['floaty', 'forgiving'],
    },
    {
      name: 'Harbour Vertical Stripe Shift', description: 'A clean shift in a fine vertical stripe that lengthens the line through the body.',
      brand: 'Nordic Thread', category: 'Office', style: 'Shift', season: 'All-Season', fabric: 'Cotton', age: '30–35',
      sleeveType: 'SHORT', length: 'KNEE', neckStyle: 'V-Neck', pattern: 'Striped', material: 'Cotton twill',
      basePrice: 3600, discountPct: 0, isFeatured: false, rating: 4.2, ratingCount: 55,
      colors: ['Navy', 'White', 'Black'], occasions: ['Office', 'Casual Outing'], shapes: ['APPLE'],
      sizes: [{ label: 'XS', stock: 2 }, { label: 'S', stock: 10 }, { label: 'M', stock: 9 }, { label: 'L', stock: 2 }], images: ['1487412720507-e7ab37603c6f', '1518049362265-d5b2a6467637'], tags: ['workwear', 'lengthening'],
    },
    {
      name: 'Amber Kaftan Maxi', description: 'A loose kaftan-cut maxi in washed linen that moves away from the body entirely.',
      brand: 'Saffron', category: 'Casual', style: 'Shift', season: 'Summer', fabric: 'Linen', age: '30–35',
      sleeveType: 'SHORT', length: 'MAXI', neckStyle: 'V-Neck', pattern: 'Solid', material: 'Washed linen',
      basePrice: 3100, discountPct: 10, isFeatured: false, rating: 4.3, ratingCount: 66,
      colors: ['Mustard', 'White', 'Champagne'], occasions: ['Festival', 'Casual Outing'], shapes: ['APPLE'],
      sizes: [{ label: 'XS', stock: 2 }, { label: 'S', stock: 13 }, { label: 'M', stock: 2 }], images: ['1539008835657-9e8e9680c956', '1610209740880-6ecc4b20ea78'], tags: ['relaxed', 'breathable'],
    },
    {
      name: 'Verona Empire Gown', description: 'A floor-length empire gown with a deep V and a skirt that falls straight from the bust.',
      brand: 'Velvet Rose', category: 'Evening Gown', style: 'Empire Waist', season: 'Winter', fabric: 'Satin', age: '30–35',
      sleeveType: 'LONG', length: 'FLOOR', neckStyle: 'V-Neck', pattern: 'Solid', material: 'Heavy satin',
      basePrice: 13800, discountPct: 20, isFeatured: true, rating: 4.7, ratingCount: 39,
      colors: ['Navy', 'Burgundy', 'Black'], occasions: ['Wedding', 'Party'], shapes: ['APPLE'],
      sizes: [{ label: 'M', stock: 2 }, { label: 'L', stock: 8 }, { label: 'XL', stock: 10 }, { label: 'XXL', stock: 2 }], images: ['1617258856138-402b60da4e2a', '1518049362265-d5b2a6467637'], tags: ['gown', 'formal'],
    },
    {
      name: 'Petal A-Line Sundress', description: 'A cotton A-line with a fitted bodice and a skirt that flares clean away from the hip.',
      brand: 'Bloom & Co', category: 'Summer', style: 'A-Line', season: 'Spring', fabric: 'Cotton', age: '18–24',
      sleeveType: 'CAP', length: 'KNEE', neckStyle: 'Square', pattern: 'Floral', material: 'Cotton lawn',
      basePrice: 2400, discountPct: 0, isFeatured: false, rating: 4.3, ratingCount: 74,
      colors: ['Blush Pink', 'White', 'Lavender'], occasions: ['Casual Outing', 'Festival', 'Graduation'], shapes: ['PEAR'],
      sizes: [{ label: 'M', stock: 2 }, { label: 'L', stock: 13 }, { label: 'XL', stock: 2 }], images: ['1520026582657-4daf5bb60adb', '1539109136881-3be0616acf4b'], tags: ['sundress', 'everyday'],
    },
    {
      name: 'Bellini Boat-Neck Flare', description: 'A wide boat neck broadens the shoulder line while the flared skirt sweeps past the hip.',
      brand: 'Aurelia', category: 'Cocktail', style: 'Fit & Flare', season: 'Autumn', fabric: 'Velvet', age: '25–29',
      sleeveType: 'SHORT', length: 'KNEE', neckStyle: 'Boat', pattern: 'Solid', material: 'Cotton velvet',
      basePrice: 6600, discountPct: 5, isFeatured: false, rating: 4.5, ratingCount: 58,
      colors: ['Emerald', 'Burgundy', 'Navy'], occasions: ['Party', 'Date Night', 'Wedding'], shapes: ['PEAR', 'RECTANGLE'],
      sizes: [{ label: 'XS', stock: 2 }, { label: 'S', stock: 14 }, { label: 'M', stock: 2 }], images: ['1572804013309-59a88b7e92f1', '1595777457583-95e059d581b8'], tags: ['balancing', 'velvet'],
    },
    {
      name: 'Saffron Cap-Sleeve A-Line', description: 'Cap sleeves add width at the shoulder and the A-line skirt glides over the hips.',
      brand: 'Saffron', category: 'Party', style: 'A-Line', season: 'All-Season', fabric: 'Jersey', age: '25–29',
      sleeveType: 'CAP', length: 'MIDI', neckStyle: 'Boat', pattern: 'Solid', material: 'Textured jersey',
      basePrice: 3900, discountPct: 10, isFeatured: false, rating: 4.4, ratingCount: 87,
      colors: ['Mustard', 'Emerald', 'Black'], occasions: ['Party', 'Office', 'Casual Outing'], shapes: ['PEAR'],
      sizes: [{ label: 'S', stock: 2 }, { label: 'M', stock: 8 }, { label: 'L', stock: 6 }, { label: 'XL', stock: 2 }], images: ['1515372039744-b8f02a3ae446', '1509755512670-9e7af886e7e9'], tags: ['balancing', 'easy-wear'],
    },
    {
      name: 'Coral Halter Swing Dress', description: 'A halter bodice draws the eye up while the swing skirt keeps the lower half unfussy.',
      brand: 'Bloom & Co', category: 'Summer', style: 'Fit & Flare', season: 'Summer', fabric: 'Cotton', age: '18–24',
      sleeveType: 'SLEEVELESS', length: 'KNEE', neckStyle: 'Halter', pattern: 'Polka Dot', material: 'Cotton poplin',
      basePrice: 2800, discountPct: 0, isFeatured: false, rating: 4.2, ratingCount: 49,
      colors: ['Red', 'White', 'Navy'], occasions: ['Casual Outing', 'Festival', 'Date Night'], shapes: ['RECTANGLE', 'HOURGLASS'],
      sizes: [{ label: 'M', stock: 2 }, { label: 'L', stock: 5 }, { label: 'XL', stock: 6 }, { label: 'XXL', stock: 2 }], images: ['1502868354157-ec2edd2a1651', '1622080159549-11537bf939e6'], tags: ['halter', 'summer'],
    },
    {
      name: 'Indigo Square-Neck Midi', description: 'A square neckline and softly gathered skirt in a mid-weight jersey that wears every day.',
      brand: 'Nordic Thread', category: 'Casual', style: 'Fit & Flare', season: 'All-Season', fabric: 'Jersey', age: '25–29',
      sleeveType: 'SHORT', length: 'MIDI', neckStyle: 'Square', pattern: 'Solid', material: 'Cotton jersey',
      basePrice: 2200, discountPct: 5, isFeatured: false, rating: 4.1, ratingCount: 103,
      colors: ['Navy', 'Black', 'Mustard'], occasions: ['Casual Outing', 'Office'], shapes: ['PEAR', 'RECTANGLE'],
      sizes: [{ label: 'M', stock: 2 }, { label: 'L', stock: 14 }, { label: 'XL', stock: 2 }], images: ['1485968579580-b6d095142e6e', '1622079400125-5b6679552976'], tags: ['budget-friendly', 'everyday'],
    },
    {
      name: 'Noir Lace Overlay Sheath', description: 'A lace overlay softens a clean sheath, with a scooped neck that opens the décolletage.',
      brand: 'Velvet Rose', category: 'Formal', style: 'Shift', season: 'Winter', fabric: 'Lace', age: '30–35',
      sleeveType: 'THREE_QUARTER', length: 'MIDI', neckStyle: 'Scoop', pattern: 'Lace', material: 'Lace over crepe',
      basePrice: 9800, discountPct: 10, isFeatured: false, rating: 4.6, ratingCount: 44,
      colors: ['Black', 'Burgundy', 'Navy'], occasions: ['Wedding', 'Party', 'Office'], shapes: ['APPLE'],
      sizes: [{ label: 'M', stock: 2 }, { label: 'L', stock: 5 }, { label: 'XL', stock: 7 }, { label: 'XXL', stock: 2 }], images: ['1568251188392-ae32f898cb3b', '1623580674393-edf6eb7090f8'], tags: ['lace', 'refined'],
    },
    {
      name: 'Dune Linen Shift Mini', description: 'A short, unstructured linen shift for hot days when nothing should touch the waist.',
      brand: 'Saffron', category: 'Summer', style: 'Shift', season: 'Summer', fabric: 'Linen', age: '18–24',
      sleeveType: 'SLEEVELESS', length: 'MINI', neckStyle: 'Round', pattern: 'Solid', material: 'Slub linen',
      basePrice: 1900, discountPct: 0, isFeatured: false, rating: 4.0, ratingCount: 58,
      colors: ['Champagne', 'White', 'Mustard'], occasions: ['Casual Outing', 'Festival'], shapes: ['APPLE'],
      sizes: [{ label: 'S', stock: 2 }, { label: 'M', stock: 10 }, { label: 'L', stock: 6 }, { label: 'XL', stock: 2 }], images: ['1571513721963-d855fd8df4c2', '1469334031218-e382a71b716b'], tags: ['minimal', 'budget-friendly'],
    },
    {
      name: 'Ember Peplum Cocktail', description: 'A sharp peplum in structured crepe that builds a waist and flares over the hip.',
      brand: 'Aurelia', category: 'Cocktail', style: 'Peplum', season: 'Autumn', fabric: 'Satin', age: '18–24',
      sleeveType: 'SLEEVELESS', length: 'MINI', neckStyle: 'Sweetheart', pattern: 'Solid', material: 'Structured crepe',
      basePrice: 5300, discountPct: 0, isFeatured: false, rating: 4.3, ratingCount: 51,
      colors: ['Red', 'Black', 'Champagne'], occasions: ['Party', 'Date Night'], shapes: ['RECTANGLE'],
      sizes: [{ label: 'XS', stock: 2 }, { label: 'S', stock: 9 }, { label: 'M', stock: 5 }, { label: 'L', stock: 2 }], images: ['1606760227091-3dd870d97f1d', '1586693231040-e89840e7d805'], tags: ['peplum', 'party'],
    },

    // ── Photographed collection ─────────────────────────────────────────────
    // Each of these was written around a specific, individually verified
    // catalogue photograph, so the listing shows the garment it describes
    // rather than a stock image reused across a dozen products. Images are
    // filled in by `npm run assign-images`.
    {
      name: 'Obsidian Tiered Ball Gown', description: 'A dramatic tiered ball gown in shimmering black organza, cut high at the front and sweeping into a full train behind.',
      brand: 'Maison Lune', category: 'Evening Gown', style: 'A-Line', season: 'Winter', fabric: 'Satin', age: '25–29',
      sleeveType: 'CAP', length: 'FLOOR', neckStyle: 'Sweetheart', pattern: 'Solid', material: 'Glitter organza',
      basePrice: 18500, discountPct: 15, isFeatured: true, rating: 4.8, ratingCount: 42,
      colors: ['Black'], occasions: ['Wedding', 'Party'], shapes: ['PEAR'],
      sizes: [{ label: 'XS', stock: 2 }, { label: 'S', stock: 13 }, { label: 'M', stock: 2 }], images: ['1568251188392-ae32f898cb3b', '1623580674393-edf6eb7090f8'], tags: ['red-carpet', 'statement'],
    },
    {
      name: 'Onyx Satin Column Gown', description: 'A liquid satin column with a corseted bodice and a high thigh slit — minimal, sharp and unmistakably evening.',
      brand: 'Velvet Rose', category: 'Evening Gown', style: 'Bodycon', season: 'All-Season', fabric: 'Satin', age: '25–29',
      sleeveType: 'SLEEVELESS', length: 'FLOOR', neckStyle: 'Sweetheart', pattern: 'Solid', material: 'Stretch satin',
      basePrice: 14200, discountPct: 10, isFeatured: true, rating: 4.7, ratingCount: 66,
      colors: ['Black'], occasions: ['Party', 'Date Night', 'Wedding'], shapes: ['HOURGLASS'],
      sizes: [{ label: 'S', stock: 2 }, { label: 'M', stock: 6 }, { label: 'L', stock: 11 }, { label: 'XL', stock: 2 }], images: ['1568251188392-ae32f898cb3b', '1623580674393-edf6eb7090f8'], tags: ['sleek', 'evening'],
    },
    {
      name: 'Sapphire Beaded Off-Shoulder Gown', description: 'Hand-beaded navy lace over a full skirt, with an off-shoulder neckline that frames the collarbone.',
      brand: 'Aurelia', category: 'Evening Gown', style: 'A-Line', season: 'Winter', fabric: 'Lace', age: '25–29',
      sleeveType: 'CAP', length: 'FLOOR', neckStyle: 'Boat', pattern: 'Lace', material: 'Beaded lace',
      basePrice: 16800, discountPct: 20, isFeatured: true, rating: 4.9, ratingCount: 38,
      colors: ['Navy'], occasions: ['Wedding', 'Party'], shapes: ['PEAR'],
      sizes: [{ label: 'S', stock: 2 }, { label: 'M', stock: 10 }, { label: 'L', stock: 2 }], images: ['1617258856138-402b60da4e2a', '1490481651871-ab68de25d43d'], tags: ['beaded', 'bridal-party'],
    },
    {
      name: 'Powder Blue Appliqué Gown', description: 'Soft blue tulle scattered with three-dimensional floral appliqué, falling from a fitted illusion bodice.',
      brand: 'Bloom & Co', category: 'Formal', style: 'A-Line', season: 'Spring', fabric: 'Chiffon', age: '18–24',
      sleeveType: 'LONG', length: 'FLOOR', neckStyle: 'Round', pattern: 'Floral', material: 'Appliqué tulle',
      basePrice: 12900, discountPct: 10, isFeatured: false, rating: 4.6, ratingCount: 51,
      colors: ['Lavender', 'White'], occasions: ['Wedding', 'Graduation', 'Party'], shapes: ['INVERTED_TRIANGLE', 'PEAR'],
      sizes: [{ label: 'S', stock: 2 }, { label: 'M', stock: 11 }, { label: 'L', stock: 2 }], images: ['1610048616025-11a3dcc9fd0b', '1496217590455-aa63a8350eea'], tags: ['romantic', 'applique'],
    },
    {
      name: 'Rose Tulle Ball Gown', description: 'Layers of blush tulle over a delicate floral-embroidered bodice, with fine straps and a skirt built for movement.',
      brand: 'Bloom & Co', category: 'Party', style: 'A-Line', season: 'Spring', fabric: 'Chiffon', age: '18–24',
      sleeveType: 'SLEEVELESS', length: 'MAXI', neckStyle: 'Sweetheart', pattern: 'Floral', material: 'Embroidered tulle',
      basePrice: 9600, discountPct: 5, isFeatured: true, rating: 4.7, ratingCount: 73,
      colors: ['Blush Pink'], occasions: ['Party', 'Graduation', 'Wedding'], shapes: ['INVERTED_TRIANGLE'],
      sizes: [{ label: 'L', stock: 2 }, { label: 'XL', stock: 10 }, { label: 'XXL', stock: 2 }], images: ['1562645361-c88442d7bc58', '1534534734151-83bc15801803'], tags: ['tulle', 'romantic'],
    },
    {
      name: 'Merlot Mermaid Gown', description: 'A sculpted mermaid silhouette in deep merlot, fitted through the hip before flaring into a trailing hem.',
      brand: 'Velvet Rose', category: 'Evening Gown', style: 'Bodycon', season: 'Winter', fabric: 'Velvet', age: '30–35',
      sleeveType: 'SLEEVELESS', length: 'FLOOR', neckStyle: 'Sweetheart', pattern: 'Solid', material: 'Stretch velvet',
      basePrice: 17400, discountPct: 15, isFeatured: true, rating: 4.8, ratingCount: 45,
      colors: ['Burgundy'], occasions: ['Wedding', 'Party'], shapes: ['HOURGLASS'],
      sizes: [{ label: 'S', stock: 2 }, { label: 'M', stock: 8 }, { label: 'L', stock: 2 }], images: ['1583039949165-96ee24b0d8de', '1568252542512-9fe8fe9c87bb'], tags: ['mermaid', 'glamour'],
    },
    {
      name: 'Gilded Champagne Ball Gown', description: 'An antique-gold brocade ball gown with sheer beaded sleeves and a skirt that holds its own shape.',
      brand: 'Maison Lune', category: 'Evening Gown', style: 'A-Line', season: 'Autumn', fabric: 'Satin', age: '25–29',
      sleeveType: 'SHORT', length: 'FLOOR', neckStyle: 'Round', pattern: 'Solid', material: 'Metallic brocade',
      basePrice: 21000, discountPct: 20, isFeatured: true, rating: 4.9, ratingCount: 29,
      colors: ['Champagne', 'Mustard'], occasions: ['Wedding', 'Party'], shapes: ['PEAR', 'INVERTED_TRIANGLE'],
      sizes: [{ label: 'S', stock: 2 }, { label: 'M', stock: 11 }, { label: 'L', stock: 2 }], images: ['1502716119720-b23a93e5fe1b', '1610209740880-6ecc4b20ea78'], tags: ['couture', 'metallic'],
    },
    {
      name: 'Ivory Lace Tea Dress', description: 'A vintage-inspired ivory lace tea dress with a nipped waist and a gently gathered midi skirt.',
      brand: 'Aurelia', category: 'Formal', style: 'Fit & Flare', season: 'Spring', fabric: 'Lace', age: '25–29',
      sleeveType: 'SLEEVELESS', length: 'KNEE', neckStyle: 'Halter', pattern: 'Lace', material: 'Corded lace',
      basePrice: 8200, discountPct: 0, isFeatured: false, rating: 4.5, ratingCount: 62,
      colors: ['Champagne', 'White'], occasions: ['Wedding', 'Graduation'], shapes: ['RECTANGLE', 'HOURGLASS'],
      sizes: [{ label: 'S', stock: 2 }, { label: 'M', stock: 11 }, { label: 'L', stock: 2 }], images: ['1623609163859-ca93c959b98a', '1566174053879-31528523f8ae'], tags: ['vintage', 'lace'],
    },
    {
      name: 'Wine Floral Tulle Gown', description: 'Dotted wine tulle strewn with velvet blooms, gathered into a strapless bodice and an enormous sweeping skirt.',
      brand: 'Velvet Rose', category: 'Evening Gown', style: 'A-Line', season: 'Autumn', fabric: 'Chiffon', age: '18–24',
      sleeveType: 'SLEEVELESS', length: 'FLOOR', neckStyle: 'Sweetheart', pattern: 'Floral', material: 'Flocked tulle',
      basePrice: 19800, discountPct: 25, isFeatured: true, rating: 4.8, ratingCount: 34,
      colors: ['Burgundy', 'Blush Pink'], occasions: ['Wedding', 'Party'], shapes: ['INVERTED_TRIANGLE'],
      sizes: [{ label: 'M', stock: 2 }, { label: 'L', stock: 9 }, { label: 'XL', stock: 2 }], images: ['1568252542512-9fe8fe9c87bb', '1583039949165-96ee24b0d8de'], tags: ['couture', 'floral'],
    },
    {
      name: 'Cobalt Ruffle Mini', description: 'A cobalt crepe mini with an embellished collar and one sculptural ruffled shoulder.',
      brand: 'Aurelia', category: 'Cocktail', style: 'Bodycon', season: 'All-Season', fabric: 'Satin', age: '18–24',
      sleeveType: 'SLEEVELESS', length: 'MINI', neckStyle: 'High', pattern: 'Solid', material: 'Stretch crepe',
      basePrice: 7400, discountPct: 10, isFeatured: false, rating: 4.4, ratingCount: 57,
      colors: ['Navy'], occasions: ['Party', 'Date Night'], shapes: ['HOURGLASS'],
      sizes: [{ label: 'S', stock: 2 }, { label: 'M', stock: 7 }, { label: 'L', stock: 6 }, { label: 'XL', stock: 2 }], images: ['1622079400125-5b6679552976', '1490481651871-ab68de25d43d'], tags: ['statement', 'party'],
    },
    {
      name: 'Petal Tulle Midi', description: 'A blush tulle midi with a velvet waist ribbon and hand-stitched feathered appliqué across the skirt.',
      brand: 'Bloom & Co', category: 'Cocktail', style: 'Fit & Flare', season: 'Spring', fabric: 'Chiffon', age: '18–24',
      sleeveType: 'SLEEVELESS', length: 'MIDI', neckStyle: 'Scoop', pattern: 'Floral', material: 'Soft tulle',
      basePrice: 6900, discountPct: 5, isFeatured: false, rating: 4.5, ratingCount: 48,
      colors: ['Blush Pink', 'Champagne'], occasions: ['Party', 'Graduation', 'Date Night'], shapes: ['INVERTED_TRIANGLE', 'RECTANGLE'],
      sizes: [{ label: 'XS', stock: 2 }, { label: 'S', stock: 9 }, { label: 'M', stock: 2 }], images: ['1534534734151-83bc15801803', '1539109136881-3be0616acf4b'], tags: ['whimsical', 'tulle'],
    },
    {
      name: 'Crimson Plunge Maxi', description: 'Featherweight crimson chiffon with a deep plunge and a skirt that catches every breath of air.',
      brand: 'Saffron', category: 'Evening Gown', style: 'Maxi', season: 'Summer', fabric: 'Chiffon', age: '18–24',
      sleeveType: 'SLEEVELESS', length: 'FLOOR', neckStyle: 'V-Neck', pattern: 'Solid', material: 'Silk chiffon',
      basePrice: 8800, discountPct: 10, isFeatured: true, rating: 4.7, ratingCount: 94,
      colors: ['Red'], occasions: ['Party', 'Date Night', 'Wedding'], shapes: ['INVERTED_TRIANGLE'],
      sizes: [{ label: 'L', stock: 2 }, { label: 'XL', stock: 12 }, { label: 'XXL', stock: 2 }], images: ['1622080159549-11537bf939e6', '1586693231040-e89840e7d805'], tags: ['flowy', 'dramatic'],
    },
    {
      name: 'Sunset Column Maxi', description: 'A scarlet column with long fluted sleeves and a draped sash that falls the full length of the skirt.',
      brand: 'Maison Lune', category: 'Formal', style: 'Maxi', season: 'All-Season', fabric: 'Jersey', age: '30–35',
      sleeveType: 'LONG', length: 'FLOOR', neckStyle: 'Boat', pattern: 'Solid', material: 'Matte jersey',
      basePrice: 11600, discountPct: 15, isFeatured: false, rating: 4.6, ratingCount: 41,
      colors: ['Red'], occasions: ['Wedding', 'Party', 'Graduation'], shapes: ['APPLE', 'PEAR'],
      sizes: [{ label: 'XS', stock: 2 }, { label: 'S', stock: 5 }, { label: 'M', stock: 6 }, { label: 'L', stock: 2 }], images: ['1622080159549-11537bf939e6', '1586693231040-e89840e7d805'], tags: ['column', 'elegant'],
    },
    {
      name: 'Jade Wrap Maxi', description: 'A soft jade chiffon wrap maxi with balloon sleeves and a tiered hem that moves as you walk.',
      brand: 'Saffron', category: 'Casual', style: 'Wrap', season: 'Summer', fabric: 'Chiffon', age: '25–29',
      sleeveType: 'LONG', length: 'MAXI', neckStyle: 'V-Neck', pattern: 'Solid', material: 'Crinkle chiffon',
      basePrice: 4600, discountPct: 5, isFeatured: false, rating: 4.5, ratingCount: 118,
      colors: ['Emerald'], occasions: ['Casual Outing', 'Festival', 'Date Night'], shapes: ['HOURGLASS', 'APPLE'],
      sizes: [{ label: 'L', stock: 2 }, { label: 'XL', stock: 13 }, { label: 'XXL', stock: 2 }], images: ['1609357605129-26f69add5d6e', '1515372039744-b8f02a3ae446'], tags: ['boho', 'flowy'],
    },
    {
      name: 'Claret Corduroy Shirt Dress', description: 'A fine-wale corduroy shirt dress in claret, with a button placket and a softly gathered skirt.',
      brand: 'Nordic Thread', category: 'Casual', style: 'Shift', season: 'Autumn', fabric: 'Cotton', age: '25–29',
      sleeveType: 'THREE_QUARTER', length: 'MIDI', neckStyle: 'Round', pattern: 'Solid', material: 'Cotton corduroy',
      basePrice: 3400, discountPct: 0, isFeatured: false, rating: 4.4, ratingCount: 87,
      colors: ['Burgundy'], occasions: ['Casual Outing', 'Office'], shapes: ['APPLE'],
      sizes: [{ label: 'XS', stock: 2 }, { label: 'S', stock: 14 }, { label: 'M', stock: 2 }], images: ['1585487000160-6ebcfceb0d03', '1583039949165-96ee24b0d8de'], tags: ['everyday', 'autumn'],
    },
    {
      name: 'Cloud Tiered Maxi', description: 'A crisp white cotton maxi built from generous tiers, with a cut-out back and adjustable straps.',
      brand: 'Bloom & Co', category: 'Summer', style: 'Maxi', season: 'Summer', fabric: 'Cotton', age: '18–24',
      sleeveType: 'SLEEVELESS', length: 'MAXI', neckStyle: 'Square', pattern: 'Solid', material: 'Cotton voile',
      basePrice: 3900, discountPct: 10, isFeatured: true, rating: 4.6, ratingCount: 132,
      colors: ['White'], occasions: ['Festival', 'Casual Outing', 'Wedding'], shapes: ['INVERTED_TRIANGLE', 'APPLE'],
      sizes: [{ label: 'XS', stock: 2 }, { label: 'S', stock: 14 }, { label: 'M', stock: 2 }], images: ['1613966570650-add3cf83aa83', '1496217590455-aa63a8350eea'], tags: ['vacation', 'tiered'],
    },
    {
      name: 'Clay Wrap Midi', description: 'A terracotta wrap midi in crinkled rayon, tied at the waist with a deep side split.',
      brand: 'Saffron', category: 'Casual', style: 'Wrap', season: 'Summer', fabric: 'Linen', age: '25–29',
      sleeveType: 'SHORT', length: 'MIDI', neckStyle: 'V-Neck', pattern: 'Solid', material: 'Crinkle rayon',
      basePrice: 2900, discountPct: 0, isFeatured: false, rating: 4.3, ratingCount: 76,
      colors: ['Mustard'], occasions: ['Casual Outing', 'Festival', 'Date Night'], shapes: ['HOURGLASS'],
      sizes: [{ label: 'M', stock: 2 }, { label: 'L', stock: 8 }, { label: 'XL', stock: 9 }, { label: 'XXL', stock: 2 }], images: ['1509755512670-9e7af886e7e9', '1539008835657-9e8e9680c956'], tags: ['holiday', 'wrap'],
    },
    {
      name: 'Mist Off-Shoulder Shift', description: 'A breezy striped cotton shift worn off the shoulder, with tie-cuff sleeves and an easy unshaped body.',
      brand: 'Nordic Thread', category: 'Summer', style: 'Shift', season: 'Summer', fabric: 'Cotton', age: '18–24',
      sleeveType: 'SHORT', length: 'MINI', neckStyle: 'Boat', pattern: 'Striped', material: 'Cotton chambray',
      basePrice: 2100, discountPct: 5, isFeatured: false, rating: 4.2, ratingCount: 91,
      colors: ['White', 'Lavender'], occasions: ['Casual Outing', 'Festival'], shapes: ['APPLE'],
      sizes: [{ label: 'XS', stock: 2 }, { label: 'S', stock: 9 }, { label: 'M', stock: 10 }, { label: 'L', stock: 2 }], images: ['1496217590455-aa63a8350eea', '1610048616025-11a3dcc9fd0b'], tags: ['breezy', 'budget-friendly'],
    },
    {
      name: 'Daisy Floral Sundress', description: 'A light floral sundress with a smocked bodice, thin straps and a skirt that flares from the waist.',
      brand: 'Bloom & Co', category: 'Summer', style: 'Fit & Flare', season: 'Summer', fabric: 'Cotton', age: '18–24',
      sleeveType: 'SLEEVELESS', length: 'MINI', neckStyle: 'Sweetheart', pattern: 'Floral', material: 'Cotton lawn',
      basePrice: 2300, discountPct: 0, isFeatured: false, rating: 4.4, ratingCount: 104,
      colors: ['White', 'Blush Pink'], occasions: ['Casual Outing', 'Festival', 'Date Night'], shapes: ['RECTANGLE', 'INVERTED_TRIANGLE'],
      sizes: [{ label: 'S', stock: 2 }, { label: 'M', stock: 13 }, { label: 'L', stock: 2 }], images: ['1520026582657-4daf5bb60adb', '1613966570650-add3cf83aa83'], tags: ['sundress', 'floral'],
    },
    {
      name: 'Meadow Floral Wrap Mini', description: 'A rose-print wrap mini with fluted sleeves and a ruffled hem — a five-second summer outfit.',
      brand: 'Saffron', category: 'Summer', style: 'Wrap', season: 'Summer', fabric: 'Chiffon', age: '18–24',
      sleeveType: 'THREE_QUARTER', length: 'MINI', neckStyle: 'V-Neck', pattern: 'Floral', material: 'Printed chiffon',
      basePrice: 2700, discountPct: 5, isFeatured: false, rating: 4.3, ratingCount: 88,
      colors: ['White', 'Red'], occasions: ['Casual Outing', 'Festival', 'Date Night'], shapes: ['HOURGLASS', 'RECTANGLE'],
      sizes: [{ label: 'S', stock: 2 }, { label: 'M', stock: 10 }, { label: 'L', stock: 2 }], images: ['1502868354157-ec2edd2a1651', '1613966570650-add3cf83aa83'], tags: ['floral', 'holiday'],
    },
    {
      name: 'Vintage Rose Shirt Dress', description: 'A cream shirt dress in a fine rose print, with a drawstring waist and a soft collar.',
      brand: 'Nordic Thread', category: 'Casual', style: 'Shift', season: 'Spring', fabric: 'Cotton', age: '25–29',
      sleeveType: 'SHORT', length: 'MIDI', neckStyle: 'V-Neck', pattern: 'Floral', material: 'Cotton poplin',
      basePrice: 3100, discountPct: 0, isFeatured: false, rating: 4.4, ratingCount: 69,
      colors: ['Champagne', 'White'], occasions: ['Casual Outing', 'Office', 'Graduation'], shapes: ['APPLE'],
      sizes: [{ label: 'S', stock: 2 }, { label: 'M', stock: 8 }, { label: 'L', stock: 7 }, { label: 'XL', stock: 2 }], images: ['1571513721963-d855fd8df4c2', '1469334031218-e382a71b716b'], tags: ['vintage', 'everyday'],
    },
  ];

  for (const d of dresses) {
    const dressSlug = slug(d.name);
    const existing = await prisma.dress.findUnique({ where: { slug: dressSlug } });

    if (existing) {
      // Re-sync the catalogue fields the recommendation engine scores on.
      // Skipping existing rows would leave a previously-seeded database on the
      // old promiscuous body-shape tags and uniform size runs, which is exactly
      // what stopped the ranking discriminating in the first place.
      await prisma.dressInventory.deleteMany({ where: { dressId: existing.id } });
      await prisma.dressImage.deleteMany({ where: { dressId: existing.id } });
      await prisma.dress.update({
        where: { id: existing.id },
        data: {
          images: { create: d.images.map((seed, i) => ({ ...img(seed, i === 0) })) },
          styleId: style(d.style).id,
          fabricId: fab(d.fabric).id,
          ageGroupId: age(d.age).id,
          sleeveType: d.sleeveType,
          length: d.length,
          neckStyle: d.neckStyle,
          pattern: d.pattern,
          basePrice: d.basePrice,
          discountPct: d.discountPct,
          // `set` replaces the relation rather than adding to it, so stale tags
          // are actually removed instead of accumulating.
          occasions: { set: d.occasions.map((o) => ({ id: occ(o).id })) },
          colors: { set: d.colors.map((c) => ({ id: color(c).id })) },
          suitableBodyShapes: { set: d.shapes.map((s) => ({ id: shape(s).id })) },
          inventory: { create: d.sizes.map((s) => ({ sizeId: size(s.label).id, stock: s.stock })) },
        },
      });
      continue;
    }

    await prisma.dress.create({
      data: {
        name: d.name,
        slug: dressSlug,
        description: d.description,
        brandId: brand(d.brand).id,
        categoryId: cat(d.category).id,
        styleId: style(d.style).id,
        seasonId: season(d.season).id,
        fabricId: fab(d.fabric).id,
        ageGroupId: age(d.age).id,
        sleeveType: d.sleeveType,
        length: d.length,
        neckStyle: d.neckStyle,
        pattern: d.pattern,
        material: d.material,
        basePrice: d.basePrice,
        discountPct: d.discountPct,
        isFeatured: d.isFeatured,
        ratingAvg: d.rating,
        ratingCount: d.ratingCount,
        popularityScore: d.ratingCount * d.rating,
        recommendationTags: d.tags,
        colors: { connect: d.colors.map((c) => ({ id: color(c).id })) },
        occasions: { connect: d.occasions.map((o) => ({ id: occ(o).id })) },
        suitableBodyShapes: { connect: d.shapes.map((s) => ({ id: shape(s).id })) },
        images: { create: d.images.map((seed, i) => ({ ...img(seed, i === 0) })) },
        inventory: { create: d.sizes.map((s) => ({ sizeId: size(s.label).id, stock: s.stock })) },
      },
    });
  }

  // A couple of reviews so ratings/popularity look real.
  const firstDress = await prisma.dress.findFirst({ where: { slug: 'emerald-wrap-midi-dress' } });
  if (firstDress) {
    await prisma.review.upsert({
      where: { userId_dressId: { userId: maya.id, dressId: firstDress.id } },
      update: {},
      create: { userId: maya.id, dressId: firstDress.id, rating: 5, title: 'Perfect fit!', comment: 'The wrap defines my waist exactly as the recommendation promised.' },
    });
  }

  console.log('✅ Seed complete.');
  console.log('   Admin: admin@stylesense.app / Admin@123');
  console.log('   User:  maya@example.com / User@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
