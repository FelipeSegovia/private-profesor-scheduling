export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

/** MSW nunca arranca en un build de producción, sin importar la variable. */
export const USE_MSW =
	import.meta.env.DEV && import.meta.env.VITE_USE_MSW !== "false";

export function apiUrl(path: string): string {
	return `${API_BASE_URL}${path}`;
}

/**
 * Dirección del sitio público de reservas (la que se codifica en el QR de
 * Preferencias). Devuelve `""` si falta o no es una URL http(s) válida.
 */
export const PUBLIC_BOOKING_URL = normalizePublicUrl(
	import.meta.env.VITE_PUBLIC_BOOKING_URL,
);

function normalizePublicUrl(raw: string | undefined): string {
	const value = raw?.trim();
	if (!value) return "";
	try {
		const url = new URL(value);
		return url.protocol === "http:" || url.protocol === "https:"
			? url.toString()
			: "";
	} catch {
		return "";
	}
}
