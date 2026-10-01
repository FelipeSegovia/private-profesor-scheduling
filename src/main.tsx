import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { USE_MSW } from "@/lib/env";
import { queryClient } from "@/lib/queryClient";
import "./index.css";
import App from "./App.tsx";

async function enableMocking() {
	if (!USE_MSW) return;

	const { worker } = await import("./mocks/browser");
	await worker.start({
		onUnhandledRequest: "bypass",
		serviceWorker: {
			url: "/mockServiceWorker.js",
		},
	});
}

void enableMocking().then(() => {
	createRoot(document.getElementById("root")!).render(
		<StrictMode>
			<QueryClientProvider client={queryClient}>
				<BrowserRouter>
					<App />
				</BrowserRouter>
			</QueryClientProvider>
		</StrictMode>,
	);
});
