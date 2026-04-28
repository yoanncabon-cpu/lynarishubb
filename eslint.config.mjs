import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import reactCompiler from "eslint-plugin-react-compiler";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Register react-compiler plugin
  {
    plugins: { "react-compiler": reactCompiler },
  },
  // Global overrides
  {
    rules: {
      // Disable react-compiler rules — not using React compiler transform
      "react-compiler/react-compiler": "off",
      // set-state-in-effect fires false positives on valid conditional setState in useEffect
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      // <img> in IntegrationLogo is intentional (Clearbit CDN + img fallback)
      "@next/next/no-img-element": "warn",
      // Allow _ prefix for intentionally unused vars/args
      "@typescript-eslint/no-unused-vars": ["warn", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_",
      }],
    },
  },
  // Three.js / R3F files — useFrame is not a React render
  {
    files: ["src/components/marketing/HeroScene.tsx", "src/server/**"],
    rules: {
      "react-hooks/purity": "off",
    },
  },
]);

export default eslintConfig;
