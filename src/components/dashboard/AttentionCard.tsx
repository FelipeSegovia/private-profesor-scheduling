import type { AttentionItem } from '@/data/dashboard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface AttentionCardProps {
  items: AttentionItem[]
}

export function AttentionCard({ items }: AttentionCardProps) {
  return (
    <Card className="rounded-2xl shadow-sm ring-border">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="font-serif text-xl tracking-tight">
            Requieren atención
          </CardTitle>
          <Badge className="size-5 justify-center rounded-full p-0 text-[11px]">
            {items.length}
          </Badge>
        </div>
        <CardDescription>Antes de que termine el día</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-border bg-background px-3.5 py-3"
            >
              <p className="text-sm font-semibold text-foreground">
                {item.childName}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p>
              <Badge className="mt-2 border-transparent bg-warning-soft text-warning hover:bg-warning-soft">
                {item.statusLabel}
              </Badge>
            </li>
          ))}
        </ul>

        <Button type="button" variant="outline" className="w-full border-primary/30 text-primary">
          Ver pendientes
        </Button>
      </CardContent>
    </Card>
  )
}
