import { apiUrl } from "@/lib/env";
import { getStoredToken, useAuthStore } from "@/store/authStore";
import { runSseLoop } from "./sse-loop";
import type { SseMessage } from "./sse-parser";

interface SubscribeOptions {
	/** Cada mensaje del stream, salvo los `ping`. */
	onEvent: (message: SseMessage) => void;
	/** Al abrirse una conexión. `opened` = 0 la primera vez, ≥ 1 al reconectar. */
	onOpen?: (opened: number) => void;
	signal: AbortSignal;
}

/**
 * Abre un stream de Server-Sent Events del backend con el Bearer de la
 * educadora. No usa `EventSource`: no admite headers, y el token no debe ir en
 * la URL. Reconecta solo; ante `401 NO_SESSION` cierra la sesión local (igual
 * que `client.ts`) y no reintenta. Se detiene con `signal`.
 */
export function subscribeSse(
	path: string,
	{ onEvent, onOpen, signal }: SubscribeOptions,
): Promise<void> {
	return runSseLoop({
		url: apiUrl(path),
		getToken: getStoredToken,
		onUnauthorized: () => useAuthStore.getState().logout(),
		onEvent,
		onOpen,
		signal,
	});
}
