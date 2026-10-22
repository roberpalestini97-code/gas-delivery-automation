# Deploy en Vercel (Hobby)

Repo: [rober-palestini/gas-delivery-automation](https://cursor.com/codebase/rober-palestini/gas-delivery-automation)

## 1. Importar el proyecto

1. [vercel.com/new](https://vercel.com/new)
2. Importá `gas-delivery-automation`
3. Framework: Next.js (autodetectado)

## 2. Variables de entorno (mínimo)

| Nombre | Ejemplo | Notas |
|---|---|---|
| `ADMIN_PASSWORD` | *(secreto fuerte)* | Login back office |
| `AUTH_SECRET` | *(random 32+ chars)* | Firma de cookies |
| `DEMO_MODE` | `true` | Hasta tener Meta |
| `WHATSAPP_VERIFY_TOKEN` | `el-barbara-verify` | Para el webhook |

Cuando tengas Meta:

| Nombre | Notas |
|---|---|
| `WHATSAPP_TOKEN` | Token permanente |
| `WHATSAPP_PHONE_NUMBER_ID` | Phone number ID |
| `WHATSAPP_APP_SECRET` | Opcional, firma webhook |
| `DEMO_MODE` | `false` |

Opcional Sheets: `SHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_JSON`.

## 3. Base de datos en Vercel

Sin Neon, la app usa **SQLite en `/tmp`**: sirve para mostrar el back office, pero **los datos se pierden** en cold starts.

Para producción chica (gratis):

1. Creá un proyecto en [Neon](https://neon.tech) (free)
2. Más adelante migrá el schema a Postgres (`DATABASE_URL`) — hoy el MVP corre SQLite; el siguiente paso de infra es esa migración

## 4. Webhook de WhatsApp

Después del deploy:

```text
https://TU-PROYECTO.vercel.app/api/whatsapp/webhook
```

Verify token = `WHATSAPP_VERIFY_TOKEN`.

Guía Meta: [meta-setup.md](./meta-setup.md)

## 5. Región

`vercel.json` usa `gru1` (São Paulo) para latencia razonable a Argentina.
