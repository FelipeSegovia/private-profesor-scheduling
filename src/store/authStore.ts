import { create } from "zustand";
import type { EducatorProfile } from "@/data/api-types";

const TOKEN_KEY = "panel.authToken";

interface AuthState {
	token: string | null;
	educator: EducatorProfile | null;
	login: (token: string, educator: EducatorProfile) => void;
	setEducator: (educator: EducatorProfile) => void;
	logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
	token: localStorage.getItem(TOKEN_KEY),
	educator: null,
	login: (token, educator) => {
		localStorage.setItem(TOKEN_KEY, token);
		set({ token, educator });
	},
	setEducator: (educator) => set({ educator }),
	logout: () => {
		localStorage.removeItem(TOKEN_KEY);
		set({ token: null, educator: null });
	},
}));

/**
 * Lectura fuera de React (para el cliente HTTP, que no es un componente).
 * `useAuthStore.getState()` sería lo mismo, pero esto deja explícito el uso.
 */
export function getStoredToken(): string | null {
	return useAuthStore.getState().token;
}
