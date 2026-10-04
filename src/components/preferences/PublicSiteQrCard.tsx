import { Copy, Download } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { PUBLIC_BOOKING_URL } from "@/lib/env";

/** Tarjeta de Preferencias con el QR que lleva al sitio público de reservas. */
export function PublicSiteQrCard() {
	const qrRef = useRef<HTMLDivElement>(null);

	async function copyLink() {
		try {
			await navigator.clipboard.writeText(PUBLIC_BOOKING_URL);
			toast.success("Enlace copiado");
		} catch {
			toast.error("No se pudo copiar el enlace");
		}
	}

	function downloadSvg() {
		const svg = qrRef.current?.querySelector("svg");
		if (!svg) return;
		const blob = new Blob([new XMLSerializer().serializeToString(svg)], {
			type: "image/svg+xml",
		});
		const href = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = href;
		link.download = "qr-reservas.svg";
		link.click();
		URL.revokeObjectURL(href);
	}

	return (
		<Card className="rounded-2xl shadow-sm ring-border">
			<CardHeader>
				<CardTitle className="font-serif text-2xl tracking-tight">
					Código QR de reservas
				</CardTitle>
				<CardDescription>
					Los apoderados lo escanean para agendar una sesión.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{PUBLIC_BOOKING_URL ? (
					<div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
						<div
							ref={qrRef}
							className="rounded-xl border border-border bg-white p-3"
						>
							<QRCodeSVG
								value={PUBLIC_BOOKING_URL}
								size={160}
								level="M"
								marginSize={1}
								title="Código QR del sitio de reservas"
							/>
						</div>
						<div className="flex min-w-0 flex-col gap-3">
							<p className="break-all text-sm text-muted-foreground">
								{PUBLIC_BOOKING_URL}
							</p>
							<div className="flex flex-wrap gap-2">
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={copyLink}
								>
									<Copy />
									Copiar enlace
								</Button>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={downloadSvg}
								>
									<Download />
									Descargar QR
								</Button>
							</div>
						</div>
					</div>
				) : (
					<p className="rounded-xl bg-secondary px-4 py-3 text-sm text-foreground">
						Falta configurar la dirección del sitio público (
						<code>VITE_PUBLIC_BOOKING_URL</code>).
					</p>
				)}
			</CardContent>
		</Card>
	);
}
