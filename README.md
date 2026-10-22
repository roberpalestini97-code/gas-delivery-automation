# El Barba Gas — pedidos WhatsApp + back office

Sistema para **El Barba Gas** ([@elbarbagas](https://www.instagram.com/elbarbagas/)) (gas envasado): el bot toma el pedido por WhatsApp, lo guarda en base de datos, espeja a Google Sheets y avisa al repartidor. El repartidor responde al mensaje del pedido («estoy llegando», «estoy afuera», «pagó efectivo», etc.) y el bot avisa al cliente correcto.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- SQLite local con Drizzle (demo sin credenciales)
- WhatsApp Cloud API de Meta (opcional; hay modo demo)
- Deploy pensado para Vercel Hobby

## Arranque local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abrí [http://127.0.0.1:43123](http://127.0.0.1:43123)  
Login: contraseña `barbara-demo` (o `ADMIN_PASSWORD`).

### Demo de venta (sin Meta)

No hace falta token de WhatsApp para desarrollar ni para la reunión de venta.

1. Entrá al back office → **Demo WA**
2. Tocá **Correr demo completa**
3. Revisá **Pedidos** (timeline) y **Conversaciones**
4. En **Acciones**, agregá una acción nueva (ej. «Dejo en portería») para mostrar adaptabilidad
5. En **Conexión**, cargá pedidos de ejemplo y mirá el checklist hasta pegar el token

Script detallado: [docs/demo-script.md](docs/demo-script.md)  
Cuando tengas tu WhatsApp de prueba: [docs/meta-setup.md](docs/meta-setup.md)

## Flujo

1. Cliente escribe al WhatsApp del local
2. Bot pide dirección → producto → cantidad → pago → confirmación
3. Se crea el pedido, se append-ea a Sheets (si hay credenciales) y se manda el bloque al repartidor
4. El repartidor **responde a ese mensaje** (o usa `#G-12 estoy llegando`)
5. El bot actualiza estados y avisa al cliente

## Variables de entorno

Ver `.env.example`.

| Variable | Uso |
|---|---|
| `ADMIN_PASSWORD` / `AUTH_SECRET` | Login back office |
| `DATABASE_PATH` | Archivo SQLite |
| `WHATSAPP_*` | Cloud API Meta |
| `SHEET_ID` / `GOOGLE_SERVICE_ACCOUNT_JSON` | Espejo Sheets |

### Webhook Meta

`GET/POST https://tu-dominio/api/whatsapp/webhook`  
Verify token: el de `WHATSAPP_VERIFY_TOKEN`.

## Capa gratuita

- Vercel Hobby + SQLite en demo local (en producción Vercel conviene Neon free y migrar el schema)
- Meta: mensajes entrantes gratis; cupo mensual de service messages (ver pricing actual de Meta)
- Sin BSP pagos ni LLM en el MVP

## Scripts

```bash
npm run dev      # http://127.0.0.1:43123
npm run build
npm run start
npm run lint
```
