import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react"

const config = defineConfig({
  globalCss: {
    "html, body": {
      margin: 0,
      padding: 0,
      backgroundColor: "#0a0a0a",
      color: "#e5e5e5",
    },
    "#root": {
      minHeight: "100vh",
      backgroundColor: "#0a0a0a",
    },
  },
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: "#e0f2f1" },
          100: { value: "#b2dfdb" },
          200: { value: "#80cbc4" },
          300: { value: "#4db6ac" },
          400: { value: "#26a69a" },
          500: { value: "#009688" },
          600: { value: "#00897b" },
          700: { value: "#00796b" },
          800: { value: "#00695c" },
          900: { value: "#004d40" },
        },
        gray: {
          50: { value: "#fafafa" },
          100: { value: "#f5f5f5" },
          200: { value: "#e5e5e5" },
          300: { value: "#d4d4d4" },
          400: { value: "#a3a3a3" },
          500: { value: "#737373" },
          600: { value: "#525252" },
          700: { value: "#404040" },
          800: { value: "#262626" },
          900: { value: "#171717" },
          950: { value: "#0a0a0a" },
        },
        positive: {
          value: "#10b981",
        },
        negative: {
          value: "#ef4444",
        },
      },
    },
    semanticTokens: {
      colors: {
        bg: {
          default: { value: "{colors.gray.950}" },
          subtle: { value: "{colors.gray.900}" },
          muted: { value: "{colors.gray.800}" },
        },
        fg: {
          default: { value: "{colors.gray.50}" },
          muted: { value: "{colors.gray.400}" },
          subtle: { value: "{colors.gray.500}" },
        },
        primary: {
          default: { value: "{colors.brand.500}" },
          emphasized: { value: "{colors.brand.400}" },
          fg: { value: "{colors.gray.950}" },
        },
        border: {
          default: { value: "{colors.gray.800}" },
          muted: { value: "{colors.gray.700}" },
        },
        up: { value: "{colors.positive}" },
        down: { value: "{colors.negative}" },
      },
    },
  },
})

export const system = createSystem(defaultConfig, config)