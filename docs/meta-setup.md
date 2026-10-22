# Conectar WhatsApp Cloud API (cuando tengas el token)

Podés hacerlo con **tu propio número de prueba** en Meta, sin tocar todavía el WhatsApp del cliente.

## 1. Meta Developers

1. Entrá a [developers.facebook.com](https://developers.facebook.com)
2. Creá una app → tipo **Business**
3. Agregá el producto **WhatsApp**
4. En **API Setup** vas a ver:
   - Temporary access token (después generá uno permanente)
   - Phone number ID
   - WhatsApp Business Account ID

## 2. Variables en este proyecto

En `.env.local`:

```bash
WHATSAPP_TOKEN=EAAB...
WHATSAPP_PHONE_NUMBER_ID=1234567890
WHATSAPP_VERIFY_TOKEN=el-barbara-verify
# opcional pero recomendado (firma del webhook):
WHATSAPP_APP_SECRET=...
WHATSAPP_API_VERSION=v21.0
DEMO_MODE=false
```

Reiniciá `npm run dev` (o redeploy en Vercel).

## 3. Webhook

URL callback:

```text
https://TU-DOMINIO/api/whatsapp/webhook
```

- Verify token: el mismo de `WHATSAPP_VERIFY_TOKEN`
- Suscribite al campo **messages**

En local, usá un túnel (Cloudflare Tunnel, ngrok, etc.) apuntando al puerto `43123`.

## 4. Número de prueba

Meta te da un número de prueba. Agregá tu celular personal como destinatario permitido y escribile al bot.

Los repartidores de demo (`5491110000001`, etc.) hay que **reemplazarlos** en **Repartidores** por números reales que puedan recibir mensajes del WABA (o números de prueba agregados).

## 5. Checklist en el back office

Abrí **Conexión**: ahí se ve si el token está cargado, el modo demo/live y el verify token.

## 6. Sheets (opcional, después)

Service account de Google + compartir la planilla + `SHEET_ID` + JSON en `GOOGLE_SERVICE_ACCOUNT_JSON`.
Sin eso, el sistema igual guarda todo en la base y deja un audit local.