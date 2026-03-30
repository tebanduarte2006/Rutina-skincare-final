# INSTRUCCIONES — Rutina Personal · Esteban

Este archivo es el contexto completo del proyecto para Claude Code.
Léelo completo antes de hacer cualquier modificación.

---

## Qué es este proyecto

Una PWA (Progressive Web App) de rutinas personales para uso exclusivo de Esteban Duarte,
desplegada en GitHub Pages: https://tebanduarte2006.github.io/Rutina-skincare-final/

La app es data-driven: todo el contenido vive en `rutina.json`. El código en `app.js` lee
ese archivo y construye la interfaz dinámicamente. Para actualizar cualquier contenido,
solo se modifica `rutina.json`. Nunca se toca `index.html` para cambios de contenido.

---

## Estructura de archivos

```
rutina.json       <- FUENTE DE VERDAD. Todo el contenido de la app vive aquí.
app.js            <- Lógica: lee rutina.json y renderiza la UI dinámicamente.
styles.css        <- Todo el CSS. Estética Apple Health.
index.html        <- Solo estructura HTML vacía. Sin contenido hardcodeado.
sw.js             <- Service Worker. Cachea los archivos para uso offline.
manifest.json     <- Configuración PWA (nombre, íconos, colores).
icon-192.png      <- Ícono PWA 192x192.
icon-512.png      <- Ícono PWA 512x512.
```

---

## Reglas absolutas — no violar nunca

1. **No tocar `index.html` para cambios de contenido.** Solo se modifica para cambios
   estructurales mayores (agregar un nuevo tipo de contenedor HTML). Cualquier texto,
   producto, paso o rutina se modifica en `rutina.json`.

2. **No hardcodear contenido en `app.js`.** El JS solo renderiza — no contiene datos.

3. **Cada `id` debe ser único en todo el JSON.** Los IDs de checklist se usan como
   claves en localStorage. Duplicados rompen la persistencia.

4. **Antes de modificar `rutina.json`, validar que el JSON resultante sea válido.**
   Un JSON malformado rompe toda la app. Usar `node -e "JSON.parse(require('fs')
   .readFileSync('rutina.json','utf8'))"` para validar antes del commit.

5. **Al terminar cualquier modificación, incrementar la versión del cache en `sw.js`.**
   Esto fuerza al navegador a descargar los archivos nuevos. El campo a cambiar es:
   `const CACHE = "rutina-vX"` — incrementar el número.

6. **No modificar `styles.css` a menos que el usuario lo pida explícitamente.**

---

## Schema de rutina.json

El JSON tiene esta estructura raíz:

```json
{
  "version": "string",
  "app": { "title": "string", "subtitle": "string" },
  "modules": [ ...módulos... ]
}
```

### Módulo

Agrupa rutinas relacionadas. Ejemplo: "Skincare", "Gym", "Oral".

```json
{
  "id": "string único",
  "label": "string visible",
  "icon": "emoji o string",
  "color": "#hexcolor",
  "tabs": [ ...tabs... ]
}
```

### Tab

Una pestaña dentro de un módulo. Contiene secciones.

```json
{
  "id": "string único",
  "label": "string visible",
  "icon": "emoji o string",
  "sections": [ ...secciones... ]
}
```

### Secciones — tipos disponibles

Cada sección tiene un campo `"type"` que determina cómo se renderiza.

---

#### `checklist`
Pasos interactivos con checkbox y barra de progreso.

```json
{
  "type": "checklist",
  "id": "string único — se usa como clave en localStorage",
  "label": "string visible encima del grupo",
  "steps": [
    {
      "id": "string único",
      "name": "string — título del paso",
      "detail": "string — descripción (opcional)",
      "product": "string — nombre del producto (opcional)"
    }
  ]
}
```

---

#### `scenario_picker`
Sub-tabs donde cada uno contiene su propio array de secciones.
Usado para la rutina de noche con múltiples escenarios.

```json
{
  "type": "scenario_picker",
  "label": "string visible encima de los sub-tabs",
  "scenarios": [
    {
      "id": "string único",
      "label": "string visible en el sub-tab",
      "sections": [ ...secciones anidadas (cualquier tipo)... ]
    }
  ]
}
```

---

#### `alert`
Caja de aviso con color según variante.
Variantes: `"info"` (azul) · `"ok"` (verde) · `"warn"` (amarillo) · `"danger"` (rojo)

```json
{
  "type": "alert",
  "variant": "info | ok | warn | danger",
  "label": "string — título en mayúsculas pequeñas",
  "text": "string — cuerpo del aviso"
}
```

---

#### `rules`
Lista numerada de reglas o información estática. Sin checkbox.

```json
{
  "type": "rules",
  "label": "string visible encima del grupo",
  "items": [
    {
      "id": "string — número o código visible (ej: R1, T1)",
      "name": "string — título de la regla",
      "detail": "string — descripción (opcional)"
    }
  ]
}
```

---

#### `metric_grid`
Cuadrícula de tarjetas con un valor grande. Usada para métricas como el nivel del safety razor.
Variantes de tarjeta: `"warn"` (rojo) · `"ok"` (verde) · `"default"` (neutro)

```json
{
  "type": "metric_grid",
  "label": "string visible encima del grid (opcional)",
  "items": [
    {
      "label": "string — etiqueta encima del valor",
      "value": "string — valor grande",
      "sublabel": "string — texto pequeño debajo del valor",
      "variant": "warn | ok | default"
    }
  ]
}
```

---

#### `day_selector`
Selector de días de la semana. Días seleccionados se guardan en localStorage.

```json
{
  "type": "day_selector",
  "label": "string visible encima",
  "sublabel": "string visible debajo del label (opcional)",
  "days": ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
  "default_selected": [0, 2, 4]
}
```

`default_selected` es un array de índices (0 = Lun, 1 = Mar, etc.).

---

#### `phase_tracker`
Selector de fases con descripción dinámica. Usado para el protocolo de transición.

```json
{
  "type": "phase_tracker",
  "title": "string — título del tracker",
  "subtitle": "string — subtítulo",
  "default": 0,
  "phases": [
    {
      "label": "string — valor grande en la tarjeta (ej: 1–2)",
      "sublabel": "string — texto pequeño en la tarjeta",
      "title": "string — título en el área de descripción",
      "description": "string — texto completo de la fase"
    }
  ]
}
```

---

#### `permit_table`
Tabla de permisos por fase. Valores de celda: `"ok"` · `"no"` · `"half"`

```json
{
  "type": "permit_table",
  "label": "string visible encima de la tabla",
  "columns": ["Producto", "S 1-2", "S 3-4", "S 5-8"],
  "rows": [
    {
      "product": "string — nombre del producto",
      "values": ["ok | no | half", "ok | no | half", "ok | no | half"],
      "highlight": "danger | warn | ok (opcional — colorea la fila)"
    }
  ]
}
```

---

#### `divider`
Línea horizontal separadora. Sin parámetros adicionales.

```json
{ "type": "divider" }
```

---

## Cómo agregar contenido nuevo — ejemplos concretos

### Cambiar un producto en un paso

Busca el `id` del paso en `rutina.json` y cambia el campo `"product"`.

Ejemplo: cambiar el bloqueador solar en el paso `m_04`:
```json
"product": "La Roche-Posay Anthelios SPF 50+ · Oil Control"
```

### Agregar un paso nuevo a una rutina existente

Agrega un objeto al array `"steps"` del checklist correspondiente.
El `id` debe seguir el patrón del grupo: si el grupo es `"m"`, el id sería `"m_05"`.

### Agregar un módulo nuevo (ej: Gym)

Agrega un objeto al array `"modules"` con su `id`, `label`, `icon`, `color` y `tabs`.
Cada tab sigue la misma estructura de secciones descrita arriba.

### Agregar una rutina oral

```json
{
  "id": "oral",
  "label": "Oral",
  "icon": "🦷",
  "color": "#34C759",
  "tabs": [
    {
      "id": "oral_manana",
      "label": "Mañana",
      "icon": "☀",
      "sections": [
        {
          "type": "checklist",
          "id": "oral_m",
          "label": "Rutina oral matutina",
          "steps": [
            {
              "id": "oral_m_01",
              "name": "Raspador de lengua",
              "detail": "Metálico en U. 3-5 pasadas de atrás hacia adelante.",
              "product": "Raspador metálico en U"
            }
          ]
        }
      ]
    }
  ]
}
```

---

## Flujo de trabajo para cada modificación

1. Leer este archivo.
2. Editar `rutina.json`.
3. Validar JSON: `node -e "JSON.parse(require('fs').readFileSync('rutina.json','utf8'))"`
4. Si la validación pasa, incrementar versión en `sw.js`.
5. Hacer commit y push:
   ```
   cd ~/Rutina-skincare-final
   git add rutina.json sw.js
   git commit -m "descripción del cambio"
   git push
   ```
6. Esperar 1-2 minutos. La app se actualiza automáticamente en GitHub Pages.

---

## Comandos útiles

```bash
# Ir al repositorio
cd ~/Rutina-skincare-final

# Ver estado de archivos modificados
git status

# Ver versión actual del cache en sw.js
grep "const CACHE" sw.js

# Validar JSON
node -e "JSON.parse(require('fs').readFileSync('rutina.json','utf8')); console.log('JSON válido')"

# Commit y push de un cambio
git add -A && git commit -m "mensaje" && git push
```
