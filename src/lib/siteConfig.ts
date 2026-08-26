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
  name: "Burnin Bird Hot Chicken",
  tagline: "Halal Nashville Hot Chicken | Dupont Circle",
  subTagline:
    "",
  legalName: "Burnin Bird Hot Chicken LLC",
  trademark: "Burnin Bird",

  // Admin intro animation: "burger" (fast food) | "coffee" (café) | "pizza" (pizzeria)
  loaderStyle: "burger",

  // Starting color theme for a first-time visitor: "light" | "dark".
  // The header toggle always lets visitors switch and their choice is
  // remembered - this is only the default before they pick one. Keep it
  // "light" unless a brand is meant to open dark.
  defaultTheme: "light" as "light" | "dark",

  // Main call-to-action button label, used on every "menu" button across the
  // site. Set it to whatever fits: "Order now", "View our menu", "See the menu"…
  menuCtaLabel: "Order now",

  // Contact & Location
  address: "1829 M St NW, Washington, DC 20036",
  street: "1829 M St NW",
  city: "Washington",
  state: "DC",
  zip: "20036",
  phone: "",
  email: "hello@burninbirddc.com",
  cateringEmail: "catering@burninbirddc.com",
  timezone: "America/New_York",
  lat: 38.9054,
  lng: -77.0426,
  googleMapsUrl:
    "https://www.google.com/maps/search/?api=1&query=1829%20M%20St%20NW%2C%20Washington%2C%20DC%2020036",

  // Social
  instagram: "burninbirddc",
  instagramUrl: "https://www.instagram.com/burninbirddc/",
  facebookUrl: "",
  tiktokUrl: "",
  beholdFeedId: "",

  // SEO
  siteUrl: "https://burninbirddc.com",
  seoTitle: "Burnin Bird Hot Chicken | Halal Nashville Hot Chicken in Washington, DC",
  seoDescription:
    "Burnin Bird Hot Chicken in Dupont Circle, Washington DC. Serving 100% Halal, hormone-free Nashville hot chicken sandwiches, tenders, loaded fries, and late-night eats.",
  seoKeywords: [
    "Burnin Bird Hot Chicken",
    "Hot Chicken DC",
    "Halal Hot Chicken Washington DC",
    "Dupont Circle Halal Food",
    "Nashville Hot Chicken Sandwich",
    "Hot Honey Chicken DC",
    "Late Night Food Dupont Circle",
    "Halal Fast Food Washington DC",
  ],
  ogImage: "/general/generalPages/mainImage.jpg",

  // Structured-data / business info (used in JSON-LD)
  cuisines: ["American", "Hot Chicken", "Halal", "Fast Food"],
  priceRange: "$$",

  // Colors (Tailwind hex values - inspired by fiery orange & deep charcoal logo)
  primaryColor: "#f97316",
  secondaryColor: "#111827",
  accentColor: "#ef4444",
  // Outreach conversion layer (trial popup + read-only dashboard preview).
  // Turn `enabled` off once a lead converts / the site goes live. `trialLengthDays`
  // is for MY internal follow-up tracking only - it is never shown to the lead as
  // a countdown or deadline. `savings` drives the estimated-savings math (default
  // formula, override per client with real numbers when known).
  outreach: {
    enabled: true,
    fullPrice: 2600,
    discountedPrice: 399,
    discountReason: "review",
    trialLengthDays: 14,
    calendlyUrl: "https://calendly.com/popdeveloper54/10-minute-meet",
    signalKey: "burnin-bird",
    savings: { estimatedOrdersPerDay: 20, avgOrderValue: 25, commissionPct: 20 },
  },

  // Hours (used for open/closed status) - hour values are 24h local time
  // Open Daily 11 AM - 11 PM / Late Night
  hours: [
    { day: "Sunday", open: 11, close: 23 },
    { day: "Monday", open: 11, close: 23 },
    { day: "Tuesday", open: 11, close: 23 },
    { day: "Wednesday", open: 11, close: 23 },
    { day: "Thursday", open: 11, close: 23 },
    { day: "Friday", open: 11, close: 24 },
    { day: "Saturday", open: 11, close: 24 },
  ] as { day: string; open: number | null; close: number | null }[],

  // Home page text sections
  home: {
    heroHeadline: "DC's Premier Halal Hot Chicken",
    heroSubHeadline: "100% Halal, hormone-free chicken fried crisp with custom heat levels",
    galleryTitle: "Burnin Bird Hot Chicken",
    gallerySubtitle: "1829 M St NW (Dupont Circle), Washington, DC",
    distinctiveFeatures: [
      {
        title: "100% Halal & Hormone Free Chicken",
        description:
          "We take pride in serving high-quality, hormone-free chicken tenders and breasts, prepared fresh daily and fried to crispy perfection.",
        image: "/general/generalPages/enjoy.jpg",
      },
      {
        title: "Custom Heat Levels & Signature Sauces",
        description:
          "Choose your spice level from No Heat to Burnin, served with our house sauces, whipped honey butter, hot honey, or signature coleslaw.",
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
        question: "Where is Burnin Bird Hot Chicken located?",
        answer:
          "We are located at 1829 M St NW in Dupont Circle, Washington, DC 20036.",
      },
      {
        question: "Is your menu 100% Halal?",
        answer:
          "Yes! All of our chicken is 100% Halal and hormone-free.",
      },
      {
        question: "What are your signature menu items?",
        answer:
          "Our fan favorites include the Classic Nashville Sandwich, Hot Honey Sandwich, Honey Butter Sandwich, Tenders Combo, and Fry Bowls.",
      },
      {
        question: "What heat levels do you offer?",
        answer:
          "We offer 5 spice levels: No Heat, Mild, Medium, Hot, and Burnin.",
      },
      {
        question: "What are your hours?",
        answer:
          "We are open daily from 11:00 AM until late night.",
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
      return `© ${new Date().getFullYear()} Burnin Bird Hot Chicken. All rights reserved.`;
    },
    links: ALL_FOOTER_LINKS.filter(enabled).map(pickLink),
  },
};

export type SiteConfig = typeof SITE_CONFIG;
