// Single source of truth for every brand-specific value on the site.
// To onboard a new restaurant client, this is the only file that should
// need to change (plus swapping image assets in /public).

// Optional sections. Flip a flag to false to remove that section from the
// navbar + footer (the new-project tool sets these per client). The route
// still exists, it is simply not linked.
const FEATURES = {
  catering: true,
  giftCard: false,
  rewards: true,
  blog: false,
};

type FeatureKey = keyof typeof FEATURES;
type NavLink = { label: string; href: string; feature?: FeatureKey };

const ALL_NAV_LINKS: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Menu", href: "/Menu" },
  { label: "Catering", href: "/catering", feature: "catering" },
  { label: "Gift Card", href: "/GiftCard", feature: "giftCard" },
  { label: "Rewards", href: "/rewards", feature: "rewards" },
  { label: "Press", href: "/Blog", feature: "blog" },
  { label: "Our Story", href: "/story" },
];

const ALL_FOOTER_LINKS: NavLink[] = [
  { label: "Menu", href: "/Menu" },
  { label: "Catering", href: "/catering", feature: "catering" },
  { label: "Gift Cards", href: "/GiftCard", feature: "giftCard" },
  { label: "Terms", href: "/terms" },
];

const enabled = (l: NavLink) => !l.feature || FEATURES[l.feature];
const pickLink = ({ label, href }: NavLink) => ({ label, href });

export const SITE_CONFIG = {
  // Brand
  name: "Tin Tin Persian Food Truck",
  tagline: "Persian Street Food | Kabobs & Late-Night Bites",
  subTagline:
    "wraps, and bowls cooked fresh daily in Houston, TX.",
  legalName: "Tin Tin Persian Food Truck LLC",
  trademark: "Tin Tin",

  // Admin intro animation: "burger" (fast food) | "coffee" (café) | "pizza" (pizzeria)
  loaderStyle: "burger",

  // Main call-to-action button label, used on every "menu" button across the
  // site. Set it to whatever fits: "Order now", "View our menu", "See the menu"…
  menuCtaLabel: "Order now",

  // Contact & Location
  address: "1325 Westheimer Rd, Houston, TX 77006",
  street: "1325 Westheimer Rd",
  city: "Houston",
  state: "TX",
  zip: "77006",
  phone: "832-752-7383",
  email: "hello@tintinhtx.com",
  cateringEmail: "catering@tintinhtx.com",
  timezone: "America/Chicago",
  lat: 29.7431,
  lng: -95.3975,
  googleMapsUrl:
    "https://www.google.com/maps/search/?api=1&query=1325%20Westheimer%20Rd%2C%20Houston%2C%20TX%2077006",

  // Social
  instagram: "tintinhtx",
  instagramUrl: "https://www.instagram.com/tintinhtx/",
  facebookUrl: "",
  tiktokUrl: "",
  beholdFeedId: "",

  // SEO
  siteUrl: "https://tintinhtx.com",
  seoTitle: "Tin Tin Persian Food Truck | Authentic Persian Food in Houston, TX",
  seoDescription:
    "Tin Tin Persian Food Truck in Montrose, Houston. Serving fresh saffron kabobs, steak and chicken wraps, bowls, and late-night Persian street food.",
  seoKeywords: [
    "Tin Tin Persian Food Truck",
    "Persian Food Truck Houston",
    "Persian Food Houston",
    "Kabobs Houston TX",
    "Late Night Food Montrose Houston",
    "Halal Food Truck Houston",
    "Saffron Lemonade Houston",
    "Beef Tenderloin Kabob Houston",
  ],
  ogImage: "/general/generalPages/mainImage.jpg",

  // Structured-data / business info (used in JSON-LD)
  cuisines: ["Persian", "Middle Eastern", "Halal", "Grill"],
  priceRange: "$$",

  // Colors (Tailwind hex values - vibrant yellow & charcoal inspired by logo)
  primaryColor: "#eab308",
  secondaryColor: "#1f2937",
  accentColor: "#d97706",

  // Hours (used for open/closed status) - hour values are 24h local time
  // Daily 11 AM - 12 AM | Fri & Sat till 2 AM
  hours: [
    { day: "Sunday", open: 11, close: 24 },
    { day: "Monday", open: 11, close: 24 },
    { day: "Tuesday", open: 11, close: 24 },
    { day: "Wednesday", open: 11, close: 24 },
    { day: "Thursday", open: 11, close: 24 },
    { day: "Friday", open: 11, close: 2 },
    { day: "Saturday", open: 11, close: 2 },
  ] as { day: string; open: number | null; close: number | null }[],

  // Home page text sections
  home: {
    heroHeadline: "Houston's Premier Persian Street Food",
    heroSubHeadline: "Saffron-marinated kabobs, fresh wraps, bowls & late-night bites",
    galleryTitle: "Tin Tin Persian Food Truck",
    gallerySubtitle: "1325 Westheimer Rd, Houston, TX",
    distinctiveFeatures: [
      {
        title: "Cooked Fresh Daily, Never Frozen",
        description:
          "Traditional family recipes using saffron-marinated chicken, beef tenderloin, ground beef, and fresh veggies grilled low and fast over open heat.",
        image: "/general/generalPages/enjoy.jpg",
      },
      {
        title: "Persian Street Food Experience",
        description:
          "Enjoy signature sandwiches, hearty rice & salad bowls, house-made sauces (Hermez, Sari, Kashk), and our famous Saffron Lemonade (The Nasrin).",
        image: "/general/generalPages/vibe.jpg",
      },
    ],
    featuring: [
      { name: "Takeaway", icon: "PiPackageFill" },
      { name: "100% Halal", icon: "MdOutlineVerified" },
      { name: "Catering", icon: "BsBagCheckFill" },
      { name: "Late Night", icon: "IoMoonOutline" },
    ],
    faq: [
      {
        question: "Where is Tin Tin Persian Food Truck located?",
        answer:
          "We are located at 1325 Westheimer Rd, Houston, TX 77006 in the heart of Montrose.",
      },
      {
        question: "Is your menu Halal?",
        answer:
          "Yes! We offer 100% Halal options across our kabob wraps, bowls, and specialties.",
      },
      {
        question: "What are your most popular menu items?",
        answer:
          "Our fan favorites include the Tehran (Saffron Chicken Wrap), Isfahan (Ground Beef Wrap), Tabriz (Steak Wrap), Steak & Fries Bowl, and our signature Saffron Lemonade (The Nasrin).",
      },
      {
        question: "Do you offer catering for private events?",
        answer:
          "Yes, we provide catering services for private parties, corporate events, and special gatherings. Reach out to us directly for inquiries.",
      },
      {
        question: "What are your late-night hours?",
        answer:
          "We are open daily from 11:00 AM to 12:00 AM midnight, and extend late night until 2:00 AM on Fridays and Saturdays.",
      },
    ],
  },

  // Which optional sections are enabled (see FEATURES above)
  features: FEATURES,

  // Navbar links (derived from FEATURES)
  navLinks: ALL_NAV_LINKS.filter(enabled).map(pickLink),

  // Footer
  footer: {
    get copyright() {
      return `© ${new Date().getFullYear()} Tin Tin Persian Food Truck. All rights reserved.`;
    },
    links: ALL_FOOTER_LINKS.filter(enabled).map(pickLink),
  },
};

export type SiteConfig = typeof SITE_CONFIG;
