# El Barba Gas — pedidos WhatsApp + back office

Repo: [rober-palestini/gas-delivery-automation](https://cursor.com/codebase/rober-palestini/gas-delivery-automation) (Private)

Sistema para **El Barba Gas** ([@elbarbagas](https://www.instagram.com/elbarbagas/)): el bot toma el pedido por WhatsApp, lo guarda en base, espeja a Google Sheets (opcional) y avisa al repartidor. El repartidor responde al mensaje del pedido («estoy llegando», «estoy afuera», «pagó efectivo», etc.) y el bot avisa al cliente.

Local: Santa Clara del Mar y zonas aledañas · WhatsApp público del local: `223 538-8647` / `223 460-2686`.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- SQLite local (Drizzle); en Vercel usa `/tmp` hasta migrar a Neon
- WhatsApp Cloud API de Meta (opcional; hay modo demo)
- Deploy: Vercel Hobby — [docs/deploy-vercel.md](docs/deploy-vercel.md)

## Clonar (Windows → WSL)

Origin CLI no corre en PowerShell. En WSL:

```bash
curl -fsSL https://downloads.cursor.com/origin/install.sh | sh
origin auth login
origin repo clone rober-palestini/gas-delivery-automation
```

Si `origin` no se encuentra:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

Docs CLI: https://cursor.com/docs/origin/cli

## Arranque local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abrí [http://127.0.0.1:43123](http://127.0.0.1:43123)  
Login: `barbara-demo` (o `ADMIN_PASSWORD`).

### Demo de venta (sin Meta)

1. Footer → **Demo WA** → **Correr demo completa**
2. Revisá **Pedidos** (ABM + timeline) y **Conversaciones**
3. **Acciones**: agregá una frase nueva (adaptabilidad)
4. Footer → **Conexión**: checklist hasta pegar el token

Más: [docs/demo-script.md](docs/demo-script.md) · Meta: [docs/meta-setup.md](docs/meta-setup.md)

## Flujo

1. Cliente escribe al WhatsApp
2. Bot: dirección → producto → cantidad → pago → confirmación
3. Pedido en DB (+ Sheets si hay credenciales) y mensaje al repartidor
4. Repartidor responde al mensaje o usa `#G-12 estoy llegando`
5. Bot actualiza estados y avisa al cliente  
   También: alta manual desde **Pedidos** (editar / finalizar / eliminar lógico)

## Variables

Ver `.env.example`. Mínimo: `ADMIN_PASSWORD`, `AUTH_SECRET`.  
WhatsApp: `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`.

Webhook: `https://tu-dominio/api/whatsapp/webhook`

## Scripts

```bash
npm run dev      # :43123
npm run build
npm run start
npm run lint
```
