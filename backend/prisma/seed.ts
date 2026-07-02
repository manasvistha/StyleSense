/**
 * Database seed — reference data, demo accounts and a catalogue of dresses with
 * inventory, so the recommendation engine and analytics dashboard work out of
 * the box for the thesis demo.
 *
 * Run with: npm run seed
 */
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
    { factorKey: 'bodyShape', label: 'Body Shape', weight: 0.3, description: 'How well the dress flatters the detected body shape.' },
    { factorKey: 'measurements', label: 'Measurements / Size', weight: 0.25, description: 'Closeness of bust/waist/hip to an available size.' },
    { factorKey: 'ageGroup', label: 'Age Group', weight: 0.1, description: 'Whether the dress targets the user’s age band.' },
    { factorKey: 'occasion', label: 'Occasion', weight: 0.1, description: 'Overlap with requested/favourite occasions.' },
    { factorKey: 'budget', label: 'Budget', weight: 0.1, description: 'Whether the price fits the user’s budget.' },
    { factorKey: 'color', label: 'Preferred Color', weight: 0.05, description: 'Availability in preferred colours.' },
    { factorKey: 'style', label: 'Style', weight: 0.05, description: 'Match with preferred dress styles.' },
    { factorKey: 'brand', label: 'Brand', weight: 0.03, description: 'Whether it is a favourite brand.' },
    { factorKey: 'popularity', label: 'Popularity', weight: 0.02, description: 'Community rating and review volume.' },
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
      colors: ['Emerald', 'Burgundy', 'Black'], occasions: ['Date Night', 'Party', 'Office'], shapes: ['HOURGLASS', 'PEAR', 'RECTANGLE'],
      sizes: [{ label: 'XS', stock: 4 }, { label: 'S', stock: 8 }, { label: 'M', stock: 10 }, { label: 'L', stock: 6 }],
      images: ['1595777457583-95e059d581b8', '1572804013309-59a88b7e92f1'], tags: ['bestseller', 'waist-defining'],
    },
    {
      name: 'Blush A-Line Tea Dress', description: 'A romantic A-line with a fitted bodice and gently flared skirt that balances fuller hips beautifully.',
      brand: 'Bloom & Co', category: 'Party', style: 'A-Line', season: 'Spring', fabric: 'Chiffon', age: '18–24',
      sleeveType: 'CAP', length: 'KNEE', neckStyle: 'Sweetheart', pattern: 'Floral', material: 'Chiffon',
      basePrice: 3200, discountPct: 0, isFeatured: true, rating: 4.5, ratingCount: 86,
      colors: ['Blush Pink', 'Lavender'], occasions: ['Wedding', 'Graduation', 'Party'], shapes: ['PEAR', 'HOURGLASS', 'RECTANGLE'],
      sizes: [{ label: 'S', stock: 7 }, { label: 'M', stock: 9 }, { label: 'L', stock: 5 }, { label: 'XL', stock: 3 }],
      images: ['1539109136881-3be0616acf4b'], tags: ['romantic', 'wedding-guest'],
    },
    {
      name: 'Midnight Bodycon Gown', description: 'A sculpting evening gown in stretch satin with a floor-sweeping hem for show-stopping formal moments.',
      brand: 'Velvet Rose', category: 'Evening Gown', style: 'Bodycon', season: 'Winter', fabric: 'Satin', age: '25–29',
      sleeveType: 'SLEEVELESS', length: 'FLOOR', neckStyle: 'Halter', pattern: 'Solid', material: 'Stretch satin',
      basePrice: 8900, discountPct: 15, isFeatured: true, rating: 4.8, ratingCount: 64,
      colors: ['Black', 'Navy', 'Burgundy'], occasions: ['Wedding', 'Party'], shapes: ['HOURGLASS', 'INVERTED_TRIANGLE'],
      sizes: [{ label: 'XS', stock: 2 }, { label: 'S', stock: 5 }, { label: 'M', stock: 4 }],
      images: ['1485968579580-b6d095142e6e'], tags: ['formal', 'statement'],
    },
    {
      name: 'Linen Shift Sundress', description: 'A breezy, unstructured linen shift that skims the body — ideal for warm days and relaxed weekends.',
      brand: 'Nordic Thread', category: 'Summer', style: 'Shift', season: 'Summer', fabric: 'Linen', age: '25–29',
      sleeveType: 'SHORT', length: 'KNEE', neckStyle: 'Round', pattern: 'Solid', material: 'Pure linen',
      basePrice: 2400, discountPct: 0, isFeatured: false, rating: 4.3, ratingCount: 52,
      colors: ['White', 'Mustard', 'Champagne'], occasions: ['Casual Outing', 'Festival'], shapes: ['APPLE', 'RECTANGLE', 'INVERTED_TRIANGLE'],
      sizes: [{ label: 'S', stock: 10 }, { label: 'M', stock: 12 }, { label: 'L', stock: 8 }, { label: 'XL', stock: 6 }, { label: 'XXL', stock: 4 }],
      images: ['1515372039744-b8f02a3ae446'], tags: ['breathable', 'everyday'],
    },
    {
      name: 'Empire Waist Maxi', description: 'A flowing empire-line maxi that falls from beneath the bust — comfortable and elegant for any silhouette.',
      brand: 'Saffron', category: 'Formal', style: 'Empire Waist', season: 'All-Season', fabric: 'Chiffon', age: '30–35',
      sleeveType: 'LONG', length: 'MAXI', neckStyle: 'Boat', pattern: 'Solid', material: 'Chiffon overlay',
      basePrice: 4600, discountPct: 5, isFeatured: true, rating: 4.6, ratingCount: 73,
      colors: ['Navy', 'Emerald', 'Burgundy'], occasions: ['Wedding', 'Office', 'Graduation'], shapes: ['APPLE', 'PEAR', 'RECTANGLE'],
      sizes: [{ label: 'M', stock: 6 }, { label: 'L', stock: 7 }, { label: 'XL', stock: 5 }, { label: 'XXL', stock: 3 }],
      images: ['1518049362265-d5b2a6467637'], tags: ['comfortable', 'forgiving'],
    },
    {
      name: 'Ruby Fit & Flare', description: 'A classic fit-and-flare with a nipped waist and twirl-worthy skirt that creates instant curves.',
      brand: 'Aurelia', category: 'Party', style: 'Fit & Flare', season: 'Autumn', fabric: 'Jersey', age: '18–24',
      sleeveType: 'THREE_QUARTER', length: 'KNEE', neckStyle: 'Scoop', pattern: 'Solid', material: 'Ponte jersey',
      basePrice: 3800, discountPct: 20, isFeatured: false, rating: 4.4, ratingCount: 41,
      colors: ['Red', 'Black', 'Navy'], occasions: ['Party', 'Date Night'], shapes: ['RECTANGLE', 'INVERTED_TRIANGLE', 'HOURGLASS'],
      sizes: [{ label: 'XS', stock: 3 }, { label: 'S', stock: 6 }, { label: 'M', stock: 8 }, { label: 'L', stock: 4 }],
      images: ['1539008835657-9e8e9680c956'], tags: ['curve-creating'],
    },
    {
      name: 'Champagne Peplum Cocktail', description: 'A structured peplum that adds definition at the waist — a polished choice for cocktail events.',
      brand: 'Maison Lune', category: 'Cocktail', style: 'Peplum', season: 'All-Season', fabric: 'Satin', age: '25–29',
      sleeveType: 'CAP', length: 'KNEE', neckStyle: 'Square', pattern: 'Solid', material: 'Duchess satin',
      basePrice: 6200, discountPct: 0, isFeatured: false, rating: 4.5, ratingCount: 58,
      colors: ['Champagne', 'Blush Pink', 'Black'], occasions: ['Party', 'Wedding', 'Date Night'], shapes: ['RECTANGLE', 'APPLE'],
      sizes: [{ label: 'S', stock: 5 }, { label: 'M', stock: 6 }, { label: 'L', stock: 4 }],
      images: ['1566174053879-31528523f8ae'], tags: ['structured'],
    },
    {
      name: 'Office Sheath Shift', description: 'A tailored shift in ponte with clean lines — boardroom-ready and endlessly versatile.',
      brand: 'Nordic Thread', category: 'Office', style: 'Shift', season: 'All-Season', fabric: 'Jersey', age: '30–35',
      sleeveType: 'SHORT', length: 'KNEE', neckStyle: 'Round', pattern: 'Solid', material: 'Ponte',
      basePrice: 4200, discountPct: 10, isFeatured: false, rating: 4.2, ratingCount: 39,
      colors: ['Navy', 'Black', 'Burgundy'], occasions: ['Office', 'Casual Outing'], shapes: ['RECTANGLE', 'INVERTED_TRIANGLE', 'APPLE'],
      sizes: [{ label: 'S', stock: 6 }, { label: 'M', stock: 9 }, { label: 'L', stock: 7 }, { label: 'XL', stock: 4 }],
      images: ['1490481651871-ab68de25d43d'], tags: ['workwear', 'versatile'],
    },
    {
      name: 'Lavender Maxi Gown', description: 'An ethereal floor-length gown with a softly draped bodice for unforgettable evenings.',
      brand: 'Velvet Rose', category: 'Evening Gown', style: 'Maxi', season: 'Spring', fabric: 'Chiffon', age: '25–29',
      sleeveType: 'SLEEVELESS', length: 'FLOOR', neckStyle: 'Cowl', pattern: 'Solid', material: 'Silk chiffon',
      basePrice: 7600, discountPct: 5, isFeatured: true, rating: 4.7, ratingCount: 47,
      colors: ['Lavender', 'Champagne', 'Blush Pink'], occasions: ['Wedding', 'Party', 'Graduation'], shapes: ['PEAR', 'HOURGLASS', 'RECTANGLE'],
      sizes: [{ label: 'XS', stock: 2 }, { label: 'S', stock: 4 }, { label: 'M', stock: 5 }, { label: 'L', stock: 3 }],
      images: ['1606760227091-3dd870d97f1d'], tags: ['ethereal', 'black-tie'],
    },
    {
      name: 'Mustard Casual Wrap', description: 'A soft jersey wrap in warm mustard — the easy, flattering everyday hero of any wardrobe.',
      brand: 'Bloom & Co', category: 'Casual', style: 'Wrap', season: 'Autumn', fabric: 'Jersey', age: '18–24',
      sleeveType: 'LONG', length: 'MIDI', neckStyle: 'V-Neck', pattern: 'Solid', material: 'Viscose jersey',
      basePrice: 2900, discountPct: 0, isFeatured: false, rating: 4.4, ratingCount: 95,
      colors: ['Mustard', 'Emerald', 'Navy'], occasions: ['Casual Outing', 'Office', 'Date Night'], shapes: ['HOURGLASS', 'PEAR', 'APPLE', 'RECTANGLE'],
      sizes: [{ label: 'S', stock: 9 }, { label: 'M', stock: 11 }, { label: 'L', stock: 8 }, { label: 'XL', stock: 5 }],
      images: ['1487412720507-e7ab37603c6f'], tags: ['everyday', 'flattering'],
    },
    {
      name: 'Noir Lace Cocktail', description: 'A timeless little black dress in delicate lace with a scalloped hem.',
      brand: 'Maison Lune', category: 'Cocktail', style: 'Bodycon', season: 'Winter', fabric: 'Lace', age: '25–29',
      sleeveType: 'LONG', length: 'MINI', neckStyle: 'High', pattern: 'Lace', material: 'Stretch lace',
      basePrice: 5100, discountPct: 0, isFeatured: false, rating: 4.6, ratingCount: 70,
      colors: ['Black', 'Burgundy'], occasions: ['Party', 'Date Night'], shapes: ['HOURGLASS', 'RECTANGLE', 'INVERTED_TRIANGLE'],
      sizes: [{ label: 'XS', stock: 3 }, { label: 'S', stock: 6 }, { label: 'M', stock: 5 }, { label: 'L', stock: 2 }],
      images: ['1502716119720-b23a93e5fe1b'], tags: ['LBD', 'classic'],
    },
    {
      name: 'Coastal Linen Maxi', description: 'A relaxed linen maxi with side slits and adjustable straps for sun-soaked days.',
      brand: 'Saffron', category: 'Summer', style: 'Maxi', season: 'Summer', fabric: 'Linen', age: '30–35',
      sleeveType: 'SLEEVELESS', length: 'MAXI', neckStyle: 'Square', pattern: 'Solid', material: 'Washed linen',
      basePrice: 3400, discountPct: 10, isFeatured: false, rating: 4.3, ratingCount: 33,
      colors: ['White', 'Champagne', 'Mustard'], occasions: ['Festival', 'Casual Outing'], shapes: ['APPLE', 'RECTANGLE', 'PEAR'],
      sizes: [{ label: 'M', stock: 7 }, { label: 'L', stock: 8 }, { label: 'XL', stock: 6 }, { label: 'XXL', stock: 3 }],
      images: ['1469334031218-e382a71b716b'], tags: ['vacation', 'breathable'],
    },
  ];

  for (const d of dresses) {
    const dressSlug = slug(d.name);
    const existing = await prisma.dress.findUnique({ where: { slug: dressSlug } });
    if (existing) continue;
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
