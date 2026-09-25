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

## Usuarios

No hay usuarios ni contrasenas en el codigo ni en `appsettings`. Viven solo en la
tabla `Users`, con la contrasena cifrada.

**Primer administrador** (o si se pierde el acceso de todos): con el backend
detenido,

```bash
cd backend
dotnet run -- crear-usuario
```

Pide los datos y escribe el `INSERT` (y un `UPDATE` para cambiar la contrasena)
para ejecutarlo en SQL Server. No se conecta a la base.

**El resto de usuarios** los crea un administrador desde la aplicacion, en
Configuracion > Usuarios.

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
| POST | `/api/forms/{id}/duplicate` | Copia sin respuestas, compartidos, enlaces ni cierre; nace en borrador |
| PATCH | `/api/forms/{id}/settings` | Cierre y mensaje final — `{ closesAt, clearClosesAt, maxResponses, confirmationMessage }` |
| POST | `/api/forms/{id}/save-as-template` | Lo guarda como plantilla del equipo — `{ name, description }` |
| GET | `/api/forms/{id}/activity` | Historial: quien hizo que y cuando (ultimas 100 lineas) |

`status` solo acepta `"Borrador"` o `"Activo"`.

`maxResponses: 0` quita el cupo. El formulario trae `isClosed`, calculado al
leer: `true` si paso `closesAt` o si `responseCount` llego a `maxResponses`.

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

`type`: `short_text`, `long_text`, `single_choice`, `multiple_choice`,
`dropdown`, `yes_no`, `rating`, `nps`, `number`, `date`.
Las de opcion nacen con dos opciones (`yes_no` con "Sí" y "No"); las demas no
admiten opciones. `rating` tiene `scaleMax` (de 3 a 10 estrellas, 5 por defecto).
Las respuestas de `dropdown` y `yes_no` son el id de la opcion, como en
`single_choice`; las de `rating`, `nps`, `number` y `date` (`yyyy-MM-dd`) van
como texto.

**Logica condicional.** El PATCH de la pregunta acepta `jumpTo` y el de la opcion
tambien: `""` quita el salto, `"end"` termina el formulario y cualquier otro
valor es el id de una pregunta. El de la opcion elegida (solo en `single_choice`,
`dropdown` y `yes_no`) manda sobre el de la pregunta. Un salto hacia atras se
ignora al responder. Requiere `Database/12_logica_y_tipos_de_pregunta.sql`.

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
| DELETE | `/api/forms/{id}/responses/{responseId}` | La borra para siempre (pide permiso de edicion) |

Al enviar se valida que el formulario este publicado (si no, `409`), que no haya
cerrado por fecha o cupo (si no, `410`) y que vengan las preguntas y campos
obligatorios (si no, `400`). Con logica condicional solo se exigen y se guardan
las preguntas del camino que dejan las respuestas (`Services/FormLogic.cs`, que
decide igual que `frontend/src/services/questionTypes.js`). Numeros, fechas,
estrellas y NPS fuera de formato tambien dan `400`. Se admiten 60 envios por minuto por IP (`429`).
El login tiene su propio limite: 10 intentos cada 5 minutos por IP.

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
| GET | `/api/templates` | Las del equipo y despues las del catalogo |
| GET | `/api/templates/{id}` | Una plantilla |
| DELETE | `/api/templates/{id}` | Borra una del equipo (su autor o un administrador) |

Las plantillas del catalogo no estan en la base: viven en `Services/SeedData.cs`.
Son fijas, iguales para todos y de solo lectura, asi que se editan ahi y el
cambio viaja en el repositorio como cualquier otro. Crear un formulario a partir
de una plantilla si guarda una copia en `Forms`, independiente del original.

Las del equipo se guardan desde un formulario (`save-as-template`) en la tabla
`UserTemplates` (script `10`), con el contenido en JSON. Las ve todo el equipo,
con la categoria "Del equipo", y llevan copia propia de sus imagenes.

En bases creadas antes de este cambio hay que ejecutar
`Database/06_plantillas_en_codigo.sql`, que borra las tres tablas que sobran.

### Compartir

Dos formas, las dos las decide solo el dueno (o un administrador):

- **Privado:** con personas concretas, para editarlo entre varios. Lo ven en
  Compartidos > Privados y lo abren en el editor.
- **Publico:** todos los usuarios lo ven en Compartidos > Publicos y lo abren
  para responder. Solo se lista mientras esta publicado. No da acceso al editor
  ni a los resultados.

| Metodo | Ruta | Que hace |
|---|---|---|
| GET | `/api/forms/{id}/shares` | Con quien esta compartido (solo el dueno) |
| PUT | `/api/forms/{id}/shares/{userId}` | Lo comparte con esa persona para editar |
| DELETE | `/api/forms/{id}/shares/{userId}` | Quita el acceso. Con el `userId` propio, uno se quita de un compartido |
| PUT | `/api/forms/{id}/public` | Publico o no — `{ isPublic }` |
| GET | `/api/forms/public` | Publicos y publicados de otros usuarios |
| GET | `/api/directory/users` | Usuarios activos para elegir con quien compartir |

Quien puede que:

| | Responder | Editar, publicar y resultados | Compartir, papelera y borrar |
|---|---|---|---|
| Dueno / Administrador | si | si | si |
| Compartido (privado) | si | si | no |
| Cualquiera (si es publico) | si | no | no |

Sin acceso, todo responde `404` como si el formulario no existiera. `GET /api/forms`
devuelve los propios y los compartidos en privado; cada uno trae `access`
(`owner` o `edit`), `sharedPermission` (si te lo compartieron), `ownerName` e
`isPublic`. La papelera es de cada usuario. En bases creadas antes de estos
cambios hay que ejecutar `Database/03_compartir_formularios.sql` y
`Database/04_formularios_publicos.sql`.

### Enlaces para responder que vencen

| Metodo | Ruta | Que hace |
|---|---|---|
| GET | `/api/forms/{id}/links` | Enlaces del formulario (quien puede editarlo) |
| POST | `/api/forms/{id}/links` | Crea uno — `{ expiresAt }` |
| PATCH | `/api/forms/{id}/links/{linkId}` | Cambia la hora de vencimiento (sirve para reabrir) |
| DELETE | `/api/forms/{id}/links/{linkId}` | Lo anula al momento |
| GET | `/api/links/{token}` | Sin sesion: el formulario, si el enlace sigue vigente (`410` si vencio) |

El enlace que se comparte es `/r/{token}`. Al vencer solo cae ese enlace; el
formulario sigue abierto. Sin sesion ya no se puede leer un formulario por id ni
responder sin un `?link={token}` vigente. Un enlace dura como mucho un ano. En
bases creadas antes de este cambio hay que ejecutar
`Database/05_enlaces_con_vencimiento.sql`.

### Notificaciones

| Metodo | Ruta | Que hace |
|---|---|---|
| GET | `/api/notifications` | Tus avisos, del mas reciente al mas antiguo |
| GET | `/api/notifications/unread-count` | Solo el numero, para la campana |
| POST | `/api/notifications/{id}/read` | Marca uno como leido |
| POST | `/api/notifications/read-all` | Marca todos |

**Que se avisa.** Todo lo que pasa en un formulario (crear, editar, publicar,
despublicar, respuestas nuevas, papelera, restaurar, borrado definitivo,
compartir, dejar de compartir, hacerlo publico o privado y los enlaces para
responder), lo que cambia en tu cuenta (perfil, contrasena, contrasena
restablecida por un administrador) y la gestion de usuarios (cuenta creada, rol
cambiado, activada o desactivada).

**A quien.** Los avisos de un formulario llegan a su dueno **y a todas las
personas con las que esta compartido**: son las que lo ven, asi que son las que
tienen que enterarse. Lo reparte `FormNotifier`, para no repetir la consulta de
compartidos en cada controlador. Los de cuenta llegan solo a su dueno, y los de
gestion de usuarios a la persona afectada y al administrador que lo hizo.

Se avisa tambien a quien hizo el cambio: la campana hace de registro de
actividad. Los eventos del mismo tipo se agrupan mientras el aviso siga sin
leer, asi que teclear un titulo no genera un aviso por pulsacion.

**Los que no van de un formulario** (cuenta, usuarios y el de borrado
definitivo, cuyo formulario ya no existe) se guardan con `FormId` en null; el
campo `Subject` dice de que tratan. Antes ese campo se llamaba `FormTitle` y
`FormId` era obligatorio, asi que no cabia ningun aviso que no fuera de un
formulario. En bases creadas antes de este cambio hay que ejecutar
`Database/09_avisos_generales.sql`. Cada tipo nuevo hay que anadirlo ademas al
`CHECK` de la tabla y darle texto en el panel del frontend.

### Mi cuenta

| Metodo | Ruta | Que hace |
|---|---|---|
| PATCH | `/api/account` | Cambia el nombre — `{ displayName }` |
| POST | `/api/account/password` | `{ currentPassword, newPassword }` |
| POST | `/api/account/avatar` | Sube la foto de perfil — `multipart/form-data`, campo `file` |
| DELETE | `/api/account/avatar` | Quita la foto: se vuelve a las iniciales |

**Foto de perfil.** Las tres devuelven el perfil ya actualizado. La foto se
guarda en `wwwroot/uploads/avatars` y en `Users.AvatarUrl` viaja solo su ruta
publica; vacia significa "sin foto" y la interfaz pinta entonces las iniciales.
Valen PNG, JPG y WebP hasta 5 MB, validados por los primeros bytes del archivo
igual que los fondos. Al cambiarla o quitarla se borra el archivo anterior. La
ruta acompana tambien al usuario en `/api/directory/users` y en los compartidos
de un formulario, para poder verla junto a los demas. En bases creadas antes de
este cambio hay que ejecutar `Database/08_foto_de_perfil.sql`.

### Usuarios (solo Administrador)

| Metodo | Ruta | Que hace |
|---|---|---|
| GET | `/api/users` | Todos, incluidos los desactivados |
| POST | `/api/users` | `{ email, displayName, role, password }` — `409` si el correo existe |
| PATCH | `/api/users/{id}` | `displayName`, `role` o `isActive` |
| POST | `/api/users/{id}/password` | Restablece la contrasena — `{ newPassword }`. Cierra la solicitud pendiente |
| DELETE | `/api/users/{id}/password-request` | Descarta la solicitud de "Olvide mi contrasena" |

**Olvide mi contrasena.** `POST /api/auth/forgot-password` — `{ email }`, sin
sesion. Mientras no haya servidor de correo solo marca la solicitud
(`Users.PasswordResetRequestedAt`) para que un administrador la atienda. Responde
`202` exista o no el correo, y admite 5 peticiones cada 15 minutos por IP (`429`
despues). En bases creadas antes de este cambio hay que ejecutar
`Database/02_solicitud_contrasena.sql`.

No hay borrado: se desactiva. Un administrador no puede quitarse el rol ni
desactivarse a si mismo, y siempre queda al menos un administrador activo. Un
usuario desactivado o al que le cambian el rol pierde la sesion en su siguiente
peticion.

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
