import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: ["generated/**", "prisma/migrations/**", "public/**"],
  },
  {
    rules: {
      // Several third-party SDKs used here (HERE Maps, Google Sheets/Analytics)
      // ship no usable types, so `any` is unavoidable at those boundaries.
      // Keep it visible as a warning rather than blocking builds/CI.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];

export default eslintConfig;
