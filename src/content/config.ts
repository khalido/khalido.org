import { defineCollection, z } from 'astro:content';

// main blog posts
const blogCollection = defineCollection({
	// Type-check frontmatter using a schema
	type: 'content',
	schema: z.object({
		title: z.string(),
		description: z.string().optional(),
		tags: z.array(z.string()).default(["untagged"]),
		// Transform string to Date object
		pubDate: z
			.string()
			.or(z.date())
			.transform((val) => new Date(val)),
		updatedDate: z
			.string()
			.optional()
			.transform((str) => (str ? new Date(str) : undefined)),
		heroImage: z.string().optional(),
	}),
});

// asides is links to interesting things
const asidesCollection = defineCollection({
	// Type-check frontmatter using a schema
	type: 'content',
	schema: z.object({
		tags: z.array(z.string()).default(["untagged"]),
		// Transform string to Date object
		pubDate: z
			.string()
			.or(z.date())
			.transform((val) => new Date(val)),
		updatedDate: z
			.string()
			.optional()
			.transform((str) => (str ? new Date(str) : undefined)),
		heroImage: z.string().optional(),
	}),
});

export const collections = { 
	'blog': blogCollection,
	'asides': asidesCollection 
};