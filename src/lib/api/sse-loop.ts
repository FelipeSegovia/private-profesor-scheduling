// Los imports llevan extensión `.ts` (permitido por `allowImportingTsExtensions`)
// para que este archivo y el parser se puedan ejecutar con
// `node --experimental-strip-types` al verificarlos: esta app no tiene test runner.
import { createSseParser, type SseMessage } from "./sse-parser.ts";

export interface SseLoopConfig {
	url: string;
	/** Token vigente en cada intento. `null` = no hay sesión: el bucle termina. */
	getToken: () => string | null;
	/** `401 NO_SESSION`: la sesión ya no sirve (el llamador cierra la sesión local). */
	onUnauthorized: () => void;
	/** Cada mensaje del stream, salvo los `ping`. */
	onEvent: (message: SseMessage) => void;
	/** Al abrirse una conexión. `opened` = cuántas se abrieron antes (0 la primera vez). */
	onOpen?: (opened: number) => void;
	signal: AbortSignal;
	/** Espera inicial entre reintentos y su tope (se duplica en cada intento fallido). */
	minDelayMs?: number;
	maxDelayMs?: number;
	fetchImpl?: typeof fetch;
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
	return new Promise((resolve) => {
		if (signal.aborted) return resolve();
		const timer = setTimeout(done, ms);
		function done() {
			clearTimeout(timer);
			signal.removeEventListener("abort", done);
			resolve();
		}
		signal.addEventListener("abort", done, { once: true });
	});
}

async function readStream(
	body: ReadableStream<Uint8Array>,
	onEvent: (message: SseMessage) => void,
): Promise<void> {
	const reader = body.getReader();
	const decoder = new TextDecoder();
	const feed = createSseParser((message) => {
		if (message.event === "ping") return;
		// Un fallo del manejador no debe cortar el stream (y menos disparar una
		// reconexión): se registra y se sigue.
		try {
			onEvent(message);
		} catch (error) {
			console.error("Error al manejar un evento del stream", error);
		}
	});

	for (;;) {
		const { done, value } = await reader.read();
		if (done) return;
		feed(decoder.decode(value, { stream: true }));
	}
}

/**
 * Mantiene abierto un stream SSE: reconecta solo si la conexión se corta o falla
 * (red, 5xx, fin del stream), con espera exponencial; no reintenta ante un 4xx
 * (token inválido, ruta mala) ni tras abortar con `signal`.
 */
export async function runSseLoop(config: SseLoopConfig): Promise<void> {
	const {
		url,
		getToken,
		onUnauthorized,
		onEvent,
		onOpen,
		signal,
		minDelayMs = 1_000,
		maxDelayMs = 30_000,
		fetchImpl = fetch,
	} = config;

	let delay = minDelayMs;
	let opened = 0;

	while (!signal.aborted) {
		const token = getToken();
		if (!token) return;

		try {
			const res = await fetchImpl(url, {
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: "text/event-stream",
				},
				signal,
			});

			if (!res.ok) {
				if (res.status === 401) {
					const body = (await res.json().catch(() => null)) as {
						code?: string;
					} | null;
					if (body?.code === "NO_SESSION") onUnauthorized();
				}
				if (res.status >= 400 && res.status < 500) return;
			} else if (res.body) {
				// Una conexión que llegó a abrirse reinicia la espera.
				delay = minDelayMs;
				onOpen?.(opened);
				opened++;
				await readStream(res.body, onEvent);
			}
		} catch {
			// Red caída o stream roto: se reintenta, salvo que haya sido un abort.
		}

		if (signal.aborted) return;
		await sleep(delay, signal);
		delay = Math.min(delay * 2, maxDelayMs);
	}
}
