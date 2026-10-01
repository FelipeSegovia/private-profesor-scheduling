export interface SseMessage {
	event: string;
	data: string;
	id?: string;
}

/**
 * Parser mínimo del formato Server-Sent Events. Sin imports a propósito: así
 * se puede ejecutar con `node --experimental-strip-types` para verificarlo
 * (esta app no tiene test runner).
 *
 * Se alimenta con trozos de texto tal como llegan de la red: un mensaje puede
 * venir partido en cualquier punto (a mitad de línea, entre `\r` y `\n`).
 * Los mensajes terminan en una línea en blanco; un bloque sin `data:` (por
 * ejemplo, solo comentarios `:`) no emite nada.
 */
export function createSseParser(
	onMessage: (message: SseMessage) => void,
): (chunk: string) => void {
	let buffer = "";
	let skipLf = false;

	function dispatch(block: string) {
		let event = "";
		let id: string | undefined;
		const data: string[] = [];

		for (const line of block.split("\n")) {
			if (line === "" || line.startsWith(":")) continue;
			const colon = line.indexOf(":");
			const field = colon === -1 ? line : line.slice(0, colon);
			let value = colon === -1 ? "" : line.slice(colon + 1);
			if (value.startsWith(" ")) value = value.slice(1);

			if (field === "event") event = value;
			else if (field === "data") data.push(value);
			else if (field === "id") id = value;
		}

		if (data.length === 0) return;
		onMessage({ event: event || "message", data: data.join("\n"), id });
	}

	return (chunk) => {
		if (chunk === "") return;

		// Un `\r\n` puede llegar partido entre dos trozos. El `\r` se convierte en
		// salto de línea al instante (así un mensaje cerrado con `\r` no queda
		// esperando) y, si el trozo siguiente empieza con `\n`, ese se descarta.
		if (skipLf && chunk.startsWith("\n")) chunk = chunk.slice(1);
		skipLf = chunk.endsWith("\r");

		buffer += chunk.replace(/\r\n?/g, "\n");

		let end = buffer.indexOf("\n\n");
		while (end !== -1) {
			const block = buffer.slice(0, end);
			buffer = buffer.slice(end + 2);
			dispatch(block);
			end = buffer.indexOf("\n\n");
		}
	};
}
