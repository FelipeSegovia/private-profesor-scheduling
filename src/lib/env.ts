export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

/** MSW nunca arranca en un build de producción, sin importar la variable. */
export const USE_MSW =
	import.meta.env.DEV && import.meta.env.VITE_USE_MSW !== "false";

export function apiUrl(path: string): string {
	return `${API_BASE_URL}${path}`;
}
