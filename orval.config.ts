import { defineConfig } from "orval";

// Generates a typed client from the server's code-first OpenAPI spec.
// In production the spec is a published artifact (@barbu/barbu-api); here we read
// the committed copy. Any contract drift surfaces as a TypeScript error at build.
export default defineConfig({
  barbu: {
    input: "./openapi.yml",
    output: {
      target: "./app/lib/api/barbu.ts",
      client: "fetch",
      mode: "single",
      clean: true,
    },
  },
});
