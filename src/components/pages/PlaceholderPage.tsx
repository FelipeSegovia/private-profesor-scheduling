interface PlaceholderPageProps {
	title: string;
	description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
	return (
		<div className="mx-auto max-w-6xl rounded-2xl border border-border bg-card p-8 shadow-sm">
			<h1 className="font-serif text-3xl font-medium tracking-tight text-foreground">
				{title}
			</h1>
			<p className="mt-2 text-sm text-muted-foreground sm:text-base">
				{description}
			</p>
		</div>
	);
}
