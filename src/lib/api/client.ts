import { apiUrl } from "@/lib/env";
import { getStoredToken, useAuthStore } from "@/store/authStore";

export class ApiError extends Error {
	readonly status: number;
	readonly code?: string;

	constructor(message: string, status: number, code?: string) {
		super(message);
		this.status = status;
		this.code = code;
	}
}

/**
 * Único lugar que arma la URL, agrega el header de auth y traduce el
 * formato de error del backend (`{ error, code? }`, `code` ausente —no
 * `null`— en un par de casos del contrato congelado). Nunca usa
 * `credentials: "include"`: el backend no habilita cookies, la auth es
 * Bearer.
 *
 * Devuelve la `Response` ya validada: `request` la lee como JSON y
 * `getBlob` como binario, así el manejo de errores y del 401 no se duplica.
 */
async function send(path: string, init: RequestInit = {}): Promise<Response> {
	const headers = new Headers(init.headers);
	if (init.body) headers.set("Content-Type", "application/json");
	const token = getStoredToken();
	if (token) headers.set("Authorization", `Bearer ${token}`);

	const res = await fetch(apiUrl(path), { ...init, headers });

	if (!res.ok) {
		let message = res.statusText;
		let code: string | undefined;
		try {
			const data = (await res.json()) as { error?: string; code?: string };
			message = data.error ?? message;
			code = data.code;
		} catch {
			// cuerpo vacío o no JSON
		}

		// El token venció o quedó inválido (clave cambiada, tokenVersion subió):
		// cerrar la sesión local para que el guard mande a /login.
		if (res.status === 401 && code === "NO_SESSION") {
			useAuthStore.getState().logout();
		}

		throw new ApiError(message, res.status, code);
	}

	return res;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
	const res = await send(path, init);
	if (res.status === 204) return undefined as T;
	return (await res.json()) as T;
}

export function get<T>(path: string): Promise<T> {
	return request<T>(path);
}

export function post<T>(path: string, body?: unknown): Promise<T> {
	return request<T>(path, {
		method: "POST",
		body: body === undefined ? undefined : JSON.stringify(body),
	});
}

export function put<T>(path: string, body?: unknown): Promise<T> {
	return request<T>(path, {
		method: "PUT",
		body: body === undefined ? undefined : JSON.stringify(body),
	});
}

export function patch<T>(path: string, body?: unknown): Promise<T> {
	return request<T>(path, {
		method: "PATCH",
		body: body === undefined ? undefined : JSON.stringify(body),
	});
}

export function del<T = void>(path: string): Promise<T> {
	return request<T>(path, { method: "DELETE" });
}

/** Nombre del archivo en `Content-Disposition: attachment; filename="…"`, si viene. */
function filenameFrom(res: Response): string | null {
	const header = res.headers.get("Content-Disposition");
	const match = header?.match(/filename="([^"]+)"/);
	return match ? match[1] : null;
}

/**
 * Descarga binaria (el PDF de la ficha). Un enlace directo no sirve: el
 * navegador no manda el `Bearer` en una navegación.
 */
export async function getBlob(
	path: string,
): Promise<{ blob: Blob; filename: string | null }> {
	const res = await send(path);
	return { blob: await res.blob(), filename: filenameFrom(res) };
}
