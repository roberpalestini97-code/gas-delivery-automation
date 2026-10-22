# Script de demo comercial — El Barba Gas

Duración sugerida: 8–10 minutos.

## 1. El problema actual (1 min)

- Cliente escribe por WhatsApp
- Recepcionista carga Google Form → Sheets
- Copian la fila y la pegan al WhatsApp del repartidor
- El repartidor avisa «estoy llegando» a mano (si se acuerda)
- No hay métricas fáciles (garrafas ayer, efectivo vs transferencia, no estaba)

## 2. Back office (2 min)

Login con la contraseña demo.

- **Pedidos**: la planilla linda (reemplazo del Excel)
- **Métricas**: unidades, pagos, no estaba
- **Acciones**: catálogo editable del repartidor

## 3. Demo WA completa (4 min)

Ir a **Demo WA** → **Correr demo completa**.

Narrar:

1. Cliente saluda y deja dirección / producto / pago
2. Aparece el pedido despachado al camión
3. Repartidor responde al mensaje: **estoy llegando** → el cliente recibe el aviso
4. **Estoy afuera** → otro aviso
5. **Pagó efectivo** → estado de pago y entrega

Abrir el detalle del pedido y mostrar el **timeline**.

## 4. Adaptabilidad (1 min)

En **Acciones**, crear:

- Código: `porteria`
- Etiqueta: `Dejo en portería`
- Aliases: `porteria, dejo en porteria`
- Mensaje al cliente: `Dejamos la garrafa en portería. Cualquier cosa escribinos.`

Explicar: no hace falta reprogramar el bot para sumar frases del día a día.

## 5. Cierre / infraestructura (1 min)

- Meta Cloud API directa (sin intermediario caro)
- Arranque en capa gratuita / costo bajo
- Mostrar **Conexión**: checklist + modo demo hasta pegar el token
- Cuando tengan el número verificado (o tu WhatsApp de prueba), el mismo flujo sale a producción sin reescribir el bot
