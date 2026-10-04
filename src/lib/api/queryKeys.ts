export const queryKeys = {
	me: () => ["auth", "me"] as const,
	summary: (date?: string) => ["summary", date ?? null] as const,
	agenda: (weekStart: string) => ["agenda", weekStart] as const,
	preferences: () => ["preferences"] as const,
	guardians: (query?: string) => ["guardians", query ?? null] as const,
	guardian: (id: string) => ["guardian", id] as const,
	childNotes: (childId: string) => ["childNotes", childId] as const,
	notifications: () => ["notifications"] as const,
};
