import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// Shared schemas to keep things DRY
const dateSchema = z
  .string()
  .or(z.date())
  .transform((val) => new Date(val));

const tagsSchema = z.array(z.string()).default(["untagged"]);

// main blog posts
const blogCollection = defineCollection({
  // Remove `type: 'content'`
  // Add loader configuration
  loader: glob({
    // Adjust this path to match your content location
    base: "./src/content/blog",
    // Pattern to match your blog post files
    pattern: "**/[^_]*.{md,mdx}",
  }),
  schema: z.object({
    // Schema remains largely the same
    date: dateSchema,
    tags: tagsSchema,
    draft: z.boolean().default(false),

    title: z.string().optional(),
    summary: z.string().optional(),
    updated: dateSchema.optional(),

    bookAuthor: z.string().optional(),
    // Update rating validation to remove refine
    rating: z
      .number()
      .min(0)
      .max(5)
      .multipleOf(0.5) // New way to validate multiples
      .optional(),

    link: z.string().url().optional(),
    via: z.string().url().optional(),
    viaTitle: z.string().optional(),

    type: z.enum(["post", "aside", "quote", "video"]).default("post"),
  }),
});

export const collections = {
  blog: blogCollection,
};
