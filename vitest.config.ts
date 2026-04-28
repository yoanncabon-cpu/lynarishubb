import { defineConfig } from "vitest/config"

export default defineConfig({
  // Vite 7+ résout nativement les paths du tsconfig — plus besoin du plugin externe
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    // Logique pure (pricing, permissions, helpers) — pas besoin de jsdom.
    // Quand on ajoutera des tests React, on basculera sur "jsdom" et plugin-react.
  },
})
