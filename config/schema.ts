import { z } from "zod";

export const themeChoiceSchema = z.enum(["light", "dark", "system"]);

export const siteConfigSchema = z.object({
  site: z.object({
    title: z.string().min(1),
    home_url: z.string().url(),
    theme: z.object({
      default: themeChoiceSchema,
      allow_switch: z.boolean(),
    }),
  }),
  theme: z.object({
    background: z.string(),
    primary: z.string(),
    secondary: z.string(),
    accent: z.string(),
  }),
  dark: z.object({
    background: z.string(),
    primary: z.string(),
    secondary: z.string(),
    accent: z.string(),
  }),
  card: z.object({
    radius: z.string(),
    blur: z.string(),
    border_opacity: z.number().min(0).max(1),
    bg_opacity: z.number().min(0).max(1),
  }),
});

export type SiteConfig = z.infer<typeof siteConfigSchema>;
