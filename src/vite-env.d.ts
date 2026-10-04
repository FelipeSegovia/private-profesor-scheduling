/// <reference types="vite/client" />

interface ImportMetaEnv {
	/** Base URL del backend real (`profesor-scheduling-api`), sin slash final. Vacío = rutas relativas. */
	readonly VITE_API_BASE_URL?: string;
	/** `'false'` desactiva MSW en dev y habla directo con VITE_API_BASE_URL. Por defecto usa mocks. */
	readonly VITE_USE_MSW?: string;
	/** Dirección del sitio público de reservas; es la que codifica el QR de Preferencias. */
	readonly VITE_PUBLIC_BOOKING_URL?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
