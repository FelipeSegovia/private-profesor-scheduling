import { HttpResponse } from "msw";
import { MSW_TOKEN } from "./fixtures";

/** Respuesta de error con la forma del backend (`{ error, code? }`). */
export function errorResponse(status: number, error: string, code?: string) {
	return HttpResponse.json(code ? { error, code } : { error }, { status });
}

/** El mock acepta un único token (el que devuelve el login de MSW). */
export function requireAuth(request: Request) {
	const header = request.headers.get("Authorization");
	return header === `Bearer ${MSW_TOKEN}`;
}

/** El `401 NO_SESSION` que devuelve el backend real sin token válido. */
export function noSessionResponse() {
	return errorResponse(
		401,
		"Tu sesión expiró. Inicia sesión de nuevo.",
		"NO_SESSION",
	);
}
