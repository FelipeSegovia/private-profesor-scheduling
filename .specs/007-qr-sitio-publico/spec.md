# 007 · QR del sitio público en Preferencias

La educadora ve en `/preferencias` un código QR que lleva al sitio público de reservas, para
compartirlo o imprimirlo.

- La dirección sale de `VITE_PUBLIC_BOOKING_URL` (solo http/https válido).
- Con la variable vacía o inválida no se genera QR: se avisa que falta configurarla.
- Acciones: copiar enlace y descargar el QR (SVG).
- Sin cambios en la API ni en reglas de negocio.
