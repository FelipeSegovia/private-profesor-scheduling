# Tasks

1. [x] `src/data/api-types.ts`: agregar `WorkDayInput`, `UpdateTemplateBody`,
       `UpdateTemplateResult`, `UpdatePreferencesBody`
2. [x] `src/lib/api/panel.ts`: agregar `updateTemplate`, `updatePreferences`
3. [x] `src/data/preferences.ts`: horas de los selects, `slotsInRange`, `toWorkDayInput`,
       `buildWorkWeekPayload`, `validateWorkDay`, `validatePreferences`
4. [x] `src/data/queries/useUpdateTemplate.ts`
5. [x] `src/data/queries/useUpdatePreferences.ts`
6. [x] `src/components/preferences/WorkDayDialog.tsx`
7. [x] `src/components/preferences/DeadlinesDialog.tsx`
8. [x] `src/components/preferences/PreferencesPage.tsx`: botones "Editar" / "Editar plazos",
       montar diálogos, aviso de `orphanSessions`
9. [x] `src/mocks/fixtures.ts`: plantilla y plazos mutables, `buildPreferences`,
       `replaceMockTemplate`, `updateMockPreferences`; agenda y resumen leen el estado mutable
10. [x] `src/mocks/handlers.ts`: `GET /preferences` dinámico, `PUT /template`, `PUT /preferences`
11. [x] `CLAUDE.md` de la app y `../CLAUDE.md`: actualizar estado
12. [x] `pnpm check` y `pnpm build` en verde
13. [ ] Verificación manual en modo MSW (casos de `plan.md`)
14. [ ] Verificación manual contra backend real (requiere `profesor-scheduling-api`
        levantado con `pnpm db:seed`)
