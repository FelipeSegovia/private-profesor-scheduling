import { useMutation } from "@tanstack/react-query";
import { todayChileYmd } from "@/data/dashboard";
import { fetchChildNotesPdf } from "@/lib/api/panel";

/** `ficha-<nombre sin tildes>-<fecha>.pdf`, igual que el nombre que manda la API. */
function fallbackFilename(childName: string): string {
	const slug = childName
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
	return `ficha-${slug || "nino"}-${todayChileYmd()}.pdf`;
}

/**
 * Baja el PDF con `fetch` (lleva el `Bearer`) y lo entrega al navegador con un
 * `<a download>` temporal: un enlace directo no manda el header de auth.
 *
 * El nombre sale de `Content-Disposition`, que el navegador solo deja leer
 * entre orígenes si la API lo expone por CORS (`src/common/cors.ts`); si no
 * llega, se arma uno equivalente.
 */
export function useExportNotesPdf(childName: string) {
	return useMutation({
		mutationFn: async (childId: string) => {
			const { blob, filename } = await fetchChildNotesPdf(childId);
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = filename ?? fallbackFilename(childName);
			document.body.appendChild(link);
			link.click();
			link.remove();
			// El navegador ya tomó el archivo; liberar la URL en el siguiente tick.
			setTimeout(() => URL.revokeObjectURL(url), 0);
		},
	});
}
