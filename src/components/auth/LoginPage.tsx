import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { ApiError } from "@/lib/api/client";
import { panelLogin } from "@/lib/api/panel";
import { useAuthStore } from "@/store/authStore";

export function LoginPage() {
	const navigate = useNavigate();
	const login = useAuthStore((state) => state.login);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	const mutation = useMutation({
		mutationFn: () => panelLogin(email, password),
		onSuccess: (result) => {
			login(result.token, result.educator);
			navigate("/", { replace: true });
		},
	});

	const errorMessage =
		mutation.error instanceof ApiError
			? mutation.error.message
			: mutation.error
				? "No se pudo iniciar sesión. Intenta nuevamente."
				: null;

	return (
		<div className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
			<Card className="w-full max-w-sm rounded-2xl shadow-sm ring-border">
				<CardHeader>
					<CardTitle className="font-serif text-2xl tracking-tight">
						Panel de la educadora
					</CardTitle>
					<CardDescription>Inicia sesión para ver tu agenda.</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						className="flex flex-col gap-4"
						onSubmit={(event) => {
							event.preventDefault();
							mutation.mutate();
						}}
					>
						<div className="flex flex-col gap-1.5">
							<label
								htmlFor="email"
								className="text-sm font-medium text-foreground"
							>
								Correo
							</label>
							<input
								id="email"
								type="email"
								autoComplete="username"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<label
								htmlFor="password"
								className="text-sm font-medium text-foreground"
							>
								Clave
							</label>
							<input
								id="password"
								type="password"
								autoComplete="current-password"
								value={password}
								onChange={(event) => setPassword(event.target.value)}
								className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
							/>
						</div>

						{errorMessage ? (
							<p className="text-sm text-destructive">{errorMessage}</p>
						) : null}

						<Button
							type="submit"
							className="mt-1 w-full"
							disabled={mutation.isPending}
						>
							{mutation.isPending ? "Entrando…" : "Entrar"}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
