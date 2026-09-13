import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Palette Industrielle (Fonds sombres SCADA)
        scada: {
          bg: '#0f172a',      // Fond principal de l'atelier
          panel: '#1e293b',   // Fond des pupitres et fenêtres
          border: '#334155',  // Bordures métalliques
        },
        // États de fonctionnement (Signaux)
        signal: {
          ok: '#10b981',      // Vert : En marche / Normal
          warn: '#f59e0b',    // Orange : Alerte / Surcharge
          danger: '#ef4444',  // Rouge : Défaut / Arrêt d'urgence
          off: '#64748b',     // Gris : Hors tension
          power: '#3b82f6',   // Bleu : Présence tension
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
      },
      fontFamily: {
        mono: ['var(--font-roboto-mono)', 'monospace'], // Police lisible pour les afficheurs digitaux
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config