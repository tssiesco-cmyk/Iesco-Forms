# Iesco Forms — API

Backend en ASP.NET Core (.NET 10) para la aplicacion de formularios.

## Arrancar

```bash
cd backend
dotnet run
```

Queda en `http://localhost:5080`, que es el puerto definido en
`Properties/launchSettings.json`. **Ese puerto tiene que coincidir con el destino
del proxy del frontend** (`frontend/vite.config.js`): si cambias uno, cambia el otro.

Para comprobar que esta viva:

```bash
curl http://localhost:5080/api/health
```

En desarrollo el esquema OpenAPI se publica en `/openapi/v1.json`.

## Credenciales de desarrollo

| Correo | Contrasena | Rol |
|---|---|---|
| admin@iescogroup.com | Iesco2026! | Administrador |
| editor@iescogroup.com | Editor2026! | Editor |

Salen de `appsettings.Development.json` y se cifran al arrancar. Ese archivo esta
en git: **no pongas ahi credenciales reales**, usa `appsettings.Local.json`, que
esta ignorado.

## Estado actual

**Los datos viven en memoria y se pierden al reiniciar.** Al arrancar vuelve a
cargar los formularios y respuestas de ejemplo. Tampoco hay autenticacion: todos
los endpoints estan abiertos, asi que por ahora no debe salir de la maquina local
o de la red interna.

## Endpoints

### Formularios

| Metodo | Ruta | Que hace |
|---|---|---|
| GET | `/api/forms` | Lista los formularios (sin los de la papelera) |
| GET | `/api/forms/{id}` | Un formulario con sus preguntas |
| POST | `/api/forms` | Crea uno nuevo — `{ title, description }` |
| POST | `/api/forms/from-template/{templateId}` | Crea uno copiando una plantilla |
| PATCH | `/api/forms/{id}` | Cambia `title`, `description` o `status` |
| DELETE | `/api/forms/{id}` | Lo manda a la papelera (no lo borra) |

`status` solo acepta `"Borrador"` o `"Activo"`.

### Preguntas y opciones

| Metodo | Ruta |
|---|---|
| POST | `/api/forms/{id}/questions` — `{ type }` |
| PATCH | `/api/forms/{id}/questions/{questionId}` |
| DELETE | `/api/forms/{id}/questions/{questionId}` |
| POST | `/api/forms/{id}/questions/reorder` — `{ fromIndex, toIndex }` |
| POST | `/api/forms/{id}/questions/{questionId}/options` |
| PATCH | `/api/forms/{id}/questions/{questionId}/options/{optionId}` |
| DELETE | `/api/forms/{id}/questions/{questionId}/options/{optionId}` |

`type`: `short_text`, `long_text`, `single_choice`, `multiple_choice`.
Las de opcion nacen con dos opciones; las de texto no admiten opciones.

### Campos del respondedor

| Metodo | Ruta |
|---|---|
| POST | `/api/forms/{id}/intro-fields` — `{ type }` |
| PATCH | `/api/forms/{id}/intro-fields/{fieldId}` |
| DELETE | `/api/forms/{id}/intro-fields/{fieldId}` |

`type`: `name`, `phone`, `email`, `text`. Cada uno trae su etiqueta y placeholder.

### Respuestas

| Metodo | Ruta | Que hace |
|---|---|---|
| GET | `/api/forms/{id}/responses` | De la mas reciente a la mas antigua |
| POST | `/api/forms/{id}/responses` | Registra una respuesta |

Al enviar se valida que el formulario este publicado (si no, `409`) y que vengan
las preguntas y campos obligatorios (si no, `400`).

`answers` va indexado por id de pregunta: cadena para texto y opcion unica (el id
de la opcion), arreglo de ids para opcion multiple.

```json
{
  "answers": { "q1": "o1", "q2": ["o5", "o6"], "q3": "Carlos" },
  "respondent": { "campo-id": "carlos@email.com" }
}
```

### Papelera y plantillas

| Metodo | Ruta | Que hace |
|---|---|---|
| GET | `/api/trash` | Formularios eliminados |
| POST | `/api/trash/{id}/restore` | Lo devuelve al listado |
| DELETE | `/api/trash/{id}` | Borrado definitivo, con sus respuestas |
| DELETE | `/api/trash` | Vacia la papelera |
| GET | `/api/templates` | Las 9 plantillas |
| GET | `/api/templates/{id}` | Una plantilla |

## Como esta organizado

```
Models/       Form, Question, QuestionOption, IntroField, FormResponse, Template
Contracts/    Los cuerpos que acepta cada endpoint
Services/     IFormStore (contrato), InMemoryFormStore, SeedData
Controllers/  Forms, Responses, Trash, Templates
Program.cs    Arranque, CORS y registro del almacen
```

Toda la persistencia pasa por `IFormStore`. Los controladores no saben si detras
hay memoria o una base de datos.

## Pasar a SQL Server

1. Agregar `Microsoft.EntityFrameworkCore.SqlServer` y un `DbContext`.
2. Escribir `SqlFormStore : IFormStore` con la misma firma.
3. En `Program.cs` cambiar una linea:

```csharp
// builder.Services.AddSingleton<IFormStore, InMemoryFormStore>();
builder.Services.AddScoped<IFormStore, SqlFormStore>();
```

Ni los controladores ni el frontend cambian. `SeedData` pasa a ser el seed de la
primera migracion.

## CORS

Por defecto acepta `http://localhost:5173` y `http://127.0.0.1:5173`, que es donde
corre Vite. Para cambiarlo, en `appsettings.json`:

```json
{ "Cors": { "AllowedOrigins": ["http://localhost:5173"] } }
```
