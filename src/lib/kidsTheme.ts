import { SITE_CONFIG } from "./siteConfig";

// Place-type flavor for the KidsZone (floating emojis, "Did You Know?" facts, and
// the memory-game cards) so a coffee shop's kids page doesn't show burgers and
// "50 billion burgers a year". Resolved from SITE_CONFIG.loaderStyle first (the
// existing food-type field: burger | coffee | pizza | bowl), then by scanning
// SITE_CONFIG.cuisines for keywords, then a neutral generic fallback. No
// per-client config needed.

export type KidsTheme = {
  emojis: [string, string, string, string];
  facts: [string, string, string];
  // >= 15 distinct emojis (expert memory grid is 5x6 = 15 pairs).
  cardEmojis: string[];
};

const THEMES: Record<string, KidsTheme> = {
  burger: {
    emojis: ["🍔", "🍟", "🥤", "🌭"],
    facts: [
      "🍔 Americans eat about 50 billion burgers a year!",
      "🍟 The crinkle-cut fry was invented to hold more ketchup!",
      "🥤 A milkshake and fries is a combo older than your grandparents!",
    ],
    cardEmojis: ["🍔", "🍟", "🌭", "🥤", "🍦", "🥪", "🧀", "🥓", "🍅", "🥬", "🧅", "🥒", "🍩", "🍪", "⭐"],
  },
  chicken: {
    emojis: ["🍗", "🍟", "🌶️", "🥤"],
    facts: [
      "🍗 Fried chicken was popularized in the American South!",
      "🌶️ Nashville hot chicken gets its kick from cayenne pepper!",
      "🥤 Pickles on the side help cool down spicy chicken!",
    ],
    cardEmojis: ["🍗", "🍟", "🌶️", "🥤", "🧀", "🥬", "🥒", "🍅", "🍞", "🧈", "🍦", "🍩", "🥟", "🌽", "⭐"],
  },
  pizza: {
    emojis: ["🍕", "🧀", "🍅", "🥤"],
    facts: [
      "🍕 The world's largest pizza was over 13,000 square feet!",
      "🧀 Pepperoni is the most popular pizza topping in the USA!",
      "🍅 Pizza was first made in Naples, Italy!",
    ],
    cardEmojis: ["🍕", "🧀", "🍅", "🥤", "🌶️", "🍄", "🫒", "🧄", "🥖", "🍩", "🍦", "🌿", "🧅", "🥓", "⭐"],
  },
  coffee: {
    emojis: ["☕", "🥐", "🍩", "🍰"],
    facts: [
      "☕ Coffee beans are actually the seeds of a fruit!",
      "🥐 A croissant has over 80 buttery layers!",
      "🍩 The hole in a donut helps it cook evenly!",
    ],
    cardEmojis: ["☕", "🥐", "🍩", "🍰", "🧁", "🍪", "🥧", "🍫", "🍓", "🥛", "🫖", "🧇", "🥞", "🍮", "⭐"],
  },
  bowl: {
    emojis: ["🥗", "🍚", "🥑", "🥤"],
    facts: [
      "🥗 Rainbow-colored plates are the healthiest kind!",
      "🥑 Avocados are a fruit, not a vegetable!",
      "🍚 Rice is eaten by more than half the people on Earth!",
    ],
    cardEmojis: ["🥗", "🍚", "🥑", "🥤", "🍅", "🥕", "🌽", "🥦", "🍋", "🍓", "🫐", "🥒", "🍠", "🌿", "⭐"],
  },
  grill: {
    emojis: ["🍖", "🔥", "🌽", "🥩"],
    facts: [
      "🔥 Grilling over fire is one of the oldest ways to cook!",
      "🌽 Grilled corn on the cob is a summer favorite everywhere!",
      "🍖 'Low and slow' is the secret to great barbecue!",
    ],
    cardEmojis: ["🍖", "🔥", "🌽", "🥩", "🍗", "🌭", "🧅", "🍅", "🌶️", "🥔", "🍢", "🧀", "🥤", "🍞", "⭐"],
  },
  taco: {
    emojis: ["🌮", "🌯", "🌶️", "🥑"],
    facts: [
      "🌮 Tacos are eaten on 'Taco Tuesday' all over the world!",
      "🌶️ Salsa means 'sauce' in Spanish!",
      "🌯 A burrito wrapped up gets its name from a 'little donkey'!",
    ],
    cardEmojis: ["🌮", "🌯", "🌶️", "🥑", "🧀", "🍅", "🌽", "🫑", "🧅", "🍋", "🌿", "🥤", "🍚", "🫘", "⭐"],
  },
  dessert: {
    emojis: ["🍦", "🍩", "🍪", "🧁"],
    facts: [
      "🍦 The average person eats about 23 lbs of ice cream a year!",
      "🍪 Chocolate chip cookies were invented by accident!",
      "🧁 The word 'cupcake' comes from baking them in cups!",
    ],
    cardEmojis: ["🍦", "🍩", "🍪", "🧁", "🍰", "🍫", "🍬", "🍭", "🍮", "🍓", "🍒", "🥧", "🎂", "🍯", "⭐"],
  },
};

const GENERIC: KidsTheme = {
  emojis: ["🍽️", "😋", "🥤", "⭐"],
  facts: [
    "🍽️ Eating together with family is a tradition all over the world!",
    "😋 Your sense of taste is strongest when food is warm!",
    "⭐ Trying one new food a week makes you a food explorer!",
  ],
  cardEmojis: ["🍕", "🍔", "🌮", "🍜", "🍩", "🍦", "🍪", "🧁", "🥐", "☕", "🥤", "🍓", "🍎", "🧀", "⭐"],
};

// Keyword → theme key, scanned against the restaurant's cuisines list.
const CUISINE_KEYWORDS: [RegExp, string][] = [
  [/pizza|italian|pasta/i, "pizza"],
  [/coffee|caf[eé]|espresso|bakery|pastr/i, "coffee"],
  [/chicken|wing|nashville/i, "chicken"],
  [/burger|fast food|diner/i, "burger"],
  [/bbq|barbe|grill|steak|smokehouse/i, "grill"],
  [/taco|mexican|burrito|tex-?mex/i, "taco"],
  [/bowl|salad|poke|healthy|vegan|vegetarian/i, "bowl"],
  [/ice cream|dessert|donut|bakery|sweet|gelato/i, "dessert"],
];

export function kidsTheme(): KidsTheme {
  // 1) explicit food-type field
  const style = (SITE_CONFIG.loaderStyle || "").toLowerCase();
  if (THEMES[style]) return THEMES[style];

  // 2) infer from cuisines
  const cuisines = (SITE_CONFIG.cuisines || []).join(" ");
  for (const [re, key] of CUISINE_KEYWORDS) {
    if (re.test(cuisines) && THEMES[key]) return THEMES[key];
  }

  // 3) neutral fallback
  return GENERIC;
}
