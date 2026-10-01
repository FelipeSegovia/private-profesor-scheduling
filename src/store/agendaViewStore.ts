import { create } from "zustand";

interface AgendaViewState {
	weekStart: string;
	selectedDate: string;
	setWeekStart: (weekStart: string) => void;
	setSelectedDate: (selectedDate: string) => void;
	initializeIfEmpty: (weekStart: string, selectedDate: string) => void;
}

export const useAgendaViewStore = create<AgendaViewState>((set, get) => ({
	weekStart: "",
	selectedDate: "",
	setWeekStart: (weekStart) => set({ weekStart }),
	setSelectedDate: (selectedDate) => set({ selectedDate }),
	initializeIfEmpty: (weekStart, selectedDate) => {
		if (!get().weekStart) set({ weekStart, selectedDate });
	},
}));
