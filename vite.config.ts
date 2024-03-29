import react from "@vitejs/plugin-react-swc";
import path from "path";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import { PluginOption, defineConfig } from "vite";
import dts from "vite-plugin-dts";
import viteTsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    peerDepsExternal({
      includeDependencies: true,
    }) as PluginOption,
    react(),
    dts({
      insertTypesEntry: true,
    }),
    viteTsconfigPaths(),
  ],
  build: {
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "react-formiga-table",
      formats: ["es"],
      fileName: (format) => `react-formiga-table.${format}.js`,
    },
    rollupOptions: {
      // We manually add these since they are not directly in package.json, but they end up in the bundle if we don't exclude them.
      // Reason for this is using imports for specific components
      external: [],
    },
  },
});
