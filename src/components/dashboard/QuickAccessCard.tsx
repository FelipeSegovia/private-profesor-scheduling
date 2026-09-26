import { ArrowRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function QuickAccessCard() {
  return (
    <Card className="rounded-2xl shadow-sm ring-border">
      <CardHeader>
        <CardTitle className="font-serif text-xl tracking-tight">
          Accesos rápidos
        </CardTitle>
        <CardDescription>Lo que más utilizas</CardDescription>
      </CardHeader>

      <CardContent>
        <Button
          type="button"
          variant="outline"
          className="h-auto w-full justify-start gap-3 rounded-xl border-border bg-background px-3.5 py-3 hover:bg-secondary"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
            <Plus className="size-4" strokeWidth={2.5} />
          </span>
          <span className="min-w-0 flex-1 text-left">
            <span className="block text-sm font-semibold text-foreground">
              Crear una nueva cita
            </span>
            <span className="block text-xs font-normal text-muted-foreground">
              Agrega una sesión única o serie
            </span>
          </span>
          <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      </CardContent>
    </Card>
  )
}
