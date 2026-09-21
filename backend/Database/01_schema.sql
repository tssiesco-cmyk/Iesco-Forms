/* ============================================================================
   IESCO Forms - Esquema de base de datos
   SQL Server 2019 o superior

   Se puede volver a ejecutar: borra las tablas y las crea de nuevo.
   OJO: borrar las tablas borra los datos. En produccion usar migraciones.

   Sobre los IDs
   -------------
   La app los genera con Guid.NewGuid().ToString("N")[..8], o sea 8 caracteres
   hex (32 bits). Con eso hay 50% de probabilidad de colision alrededor de las
   77.000 filas, algo alcanzable en ResponseAnswers.

   Por eso las columnas son VARCHAR(36): aceptan los ids de 8 que genera hoy y
   tambien un GUID completo. Cuando quieras cerrar ese riesgo basta con cambiar
   NewId() a Guid.NewGuid().ToString() sin tocar la base.
   ============================================================================ */

IF DB_ID('IescoForms') IS NULL
    CREATE DATABASE IescoForms;
GO

USE IescoForms;
GO

/* ---------------------------------------------------------------------------
   Borrado en orden inverso a las dependencias
   --------------------------------------------------------------------------- */
DROP TABLE IF EXISTS dbo.ResponseAnswerOptions;
DROP TABLE IF EXISTS dbo.ResponseAnswers;
DROP TABLE IF EXISTS dbo.ResponseRespondentValues;
DROP TABLE IF EXISTS dbo.Responses;
DROP TABLE IF EXISTS dbo.TemplateQuestionOptions;
DROP TABLE IF EXISTS dbo.TemplateQuestions;
DROP TABLE IF EXISTS dbo.Templates;
DROP TABLE IF EXISTS dbo.FormLinks;
DROP TABLE IF EXISTS dbo.FormShares;
DROP TABLE IF EXISTS dbo.Notifications;
DROP TABLE IF EXISTS dbo.QuestionOptions;
DROP TABLE IF EXISTS dbo.Questions;
DROP TABLE IF EXISTS dbo.IntroFields;
DROP TABLE IF EXISTS dbo.Forms;
DROP TABLE IF EXISTS dbo.Users;
GO

/* ===========================================================================
   USUARIOS
   =========================================================================== */
CREATE TABLE dbo.Users
(
    Id            VARCHAR(36)     NOT NULL CONSTRAINT PK_Users PRIMARY KEY,
    Email         NVARCHAR(256)   NOT NULL,
    DisplayName   NVARCHAR(150)   NOT NULL CONSTRAINT DF_Users_DisplayName DEFAULT '',
    Role          NVARCHAR(20)    NOT NULL CONSTRAINT DF_Users_Role        DEFAULT 'Editor',
    PasswordHash  NVARCHAR(256)   NOT NULL,

    -- Campos nuevos respecto al modelo en memoria. IsActive permite desactivar
    -- a alguien sin borrarlo y perder la autoria de sus formularios.
    IsActive      BIT             NOT NULL CONSTRAINT DF_Users_IsActive  DEFAULT 1,
    CreatedAt     DATETIMEOFFSET  NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT SYSDATETIMEOFFSET(),

    -- Cuando el usuario pulso "Olvide mi contrasena". NULL = no hay solicitud
    -- pendiente. Se limpia al ponerle una contrasena nueva.
    PasswordResetRequestedAt DATETIMEOFFSET NULL,

    CONSTRAINT CK_Users_Role CHECK (Role IN ('Administrador', 'Editor'))
);
GO

-- El login busca por correo: tiene que ser unico y estar indexado.
CREATE UNIQUE INDEX UX_Users_Email ON dbo.Users (Email);
GO

/* ===========================================================================
   FORMULARIOS
   =========================================================================== */
CREATE TABLE dbo.Forms
(
    Id                    VARCHAR(36)    NOT NULL CONSTRAINT PK_Forms PRIMARY KEY,

    -- En el modelo en memoria "sin dueno" es cadena vacia. Aqui es NULL, que es
    -- lo unico compatible con una clave foranea.
    OwnerId               VARCHAR(36)    NULL,

    Title                 NVARCHAR(500)  NOT NULL CONSTRAINT DF_Forms_Title       DEFAULT '',
    Description           NVARCHAR(1000) NOT NULL CONSTRAINT DF_Forms_Description DEFAULT '',
    Status                NVARCHAR(20)   NOT NULL CONSTRAINT DF_Forms_Status      DEFAULT 'Borrador',

    -- Guarda fecha Y hora aunque el modelo solo exponga 'yyyy-MM-dd'. Sin la
    -- hora, todos los formularios creados el mismo dia empatarian y la lista
    -- (que va del mas nuevo al mas viejo) quedaria en un orden arbitrario.
    CreatedAt             DATETIMEOFFSET NOT NULL CONSTRAINT DF_Forms_CreatedAt DEFAULT SYSDATETIMEOFFSET(),

    -- Solo tiene valor mientras esta en la papelera.
    TrashedAt             DATETIMEOFFSET NULL,

    BackgroundImage       NVARCHAR(400)  NOT NULL CONSTRAINT DF_Forms_BackgroundImage       DEFAULT '',
    BackgroundOverlay     BIT            NOT NULL CONSTRAINT DF_Forms_BackgroundOverlay     DEFAULT 1,
    BackgroundPerQuestion BIT            NOT NULL CONSTRAINT DF_Forms_BackgroundPerQuestion DEFAULT 0,
    IntroBackgroundImage  NVARCHAR(400)  NOT NULL CONSTRAINT DF_Forms_IntroBackgroundImage  DEFAULT '',

    -- Visible para todos los usuarios en Compartidos > Publicos, para responderlo.
    -- Solo se lista mientras esta publicado.
    IsPublic              BIT            NOT NULL CONSTRAINT DF_Forms_IsPublic DEFAULT 0,

    RowVersion            ROWVERSION     NOT NULL,

    CONSTRAINT CK_Forms_Status CHECK (Status IN ('Borrador', 'Activo')),
    CONSTRAINT FK_Forms_Owner  FOREIGN KEY (OwnerId) REFERENCES dbo.Users (Id) ON DELETE SET NULL
);
GO

CREATE INDEX IX_Forms_OwnerId ON dbo.Forms (OwnerId);

-- El listado principal pide siempre los que NO estan en la papelera.
CREATE INDEX IX_Forms_Activos ON dbo.Forms (Status) WHERE TrashedAt IS NULL;
GO

/* ===========================================================================
   PREGUNTAS
   =========================================================================== */
CREATE TABLE dbo.Questions
(
    Id              VARCHAR(36)    NOT NULL CONSTRAINT PK_Questions PRIMARY KEY,
    FormId          VARCHAR(36)    NOT NULL,

    -- Reemplaza el orden de la lista en memoria.
    Position        INT            NOT NULL CONSTRAINT DF_Questions_Position DEFAULT 0,

    Type            NVARCHAR(30)   NOT NULL,
    Title           NVARCHAR(500)  NOT NULL CONSTRAINT DF_Questions_Title       DEFAULT '',
    Description     NVARCHAR(1000) NOT NULL CONSTRAINT DF_Questions_Description DEFAULT '',
    Required        BIT            NOT NULL CONSTRAINT DF_Questions_Required    DEFAULT 0,

    -- Manda sobre el Bloq Mayus de quien responde. Solo aplica a texto.
    TextCase        NVARCHAR(10)   NOT NULL CONSTRAINT DF_Questions_TextCase DEFAULT 'normal',

    BackgroundImage NVARCHAR(400)  NOT NULL CONSTRAINT DF_Questions_BackgroundImage DEFAULT '',

    -- Borrado logico: una pregunta con respuestas nunca se borra de verdad, o
    -- las respuestas historicas quedarian apuntando a nada.
    DeletedAt       DATETIMEOFFSET NULL,

    RowVersion      ROWVERSION     NOT NULL,

    CONSTRAINT CK_Questions_Type     CHECK (Type IN ('short_text', 'long_text', 'single_choice', 'multiple_choice')),
    CONSTRAINT CK_Questions_TextCase CHECK (TextCase IN ('normal', 'upper', 'lower')),
    CONSTRAINT FK_Questions_Form     FOREIGN KEY (FormId) REFERENCES dbo.Forms (Id) ON DELETE CASCADE
);
GO

CREATE INDEX IX_Questions_Form ON dbo.Questions (FormId, Position) WHERE DeletedAt IS NULL;
GO

/* ===========================================================================
   OPCIONES DE PREGUNTA
   =========================================================================== */
CREATE TABLE dbo.QuestionOptions
(
    Id         VARCHAR(36)    NOT NULL CONSTRAINT PK_QuestionOptions PRIMARY KEY,
    QuestionId VARCHAR(36)    NOT NULL,
    Position   INT            NOT NULL CONSTRAINT DF_QuestionOptions_Position DEFAULT 0,
    [Text]     NVARCHAR(500)  NOT NULL CONSTRAINT DF_QuestionOptions_Text     DEFAULT '',
    DeletedAt  DATETIMEOFFSET NULL,

    CONSTRAINT FK_QuestionOptions_Question FOREIGN KEY (QuestionId) REFERENCES dbo.Questions (Id) ON DELETE CASCADE
);
GO

CREATE INDEX IX_QuestionOptions_Question ON dbo.QuestionOptions (QuestionId, Position) WHERE DeletedAt IS NULL;
GO

/* ===========================================================================
   CAMPOS DE DATOS DEL USUARIO (pantalla previa a las preguntas)
   =========================================================================== */
CREATE TABLE dbo.IntroFields
(
    Id          VARCHAR(36)    NOT NULL CONSTRAINT PK_IntroFields PRIMARY KEY,
    FormId      VARCHAR(36)    NOT NULL,
    Position    INT            NOT NULL CONSTRAINT DF_IntroFields_Position    DEFAULT 0,
    Type        NVARCHAR(20)   NOT NULL CONSTRAINT DF_IntroFields_Type        DEFAULT 'text',
    Label       NVARCHAR(200)  NOT NULL CONSTRAINT DF_IntroFields_Label       DEFAULT '',
    Placeholder NVARCHAR(200)  NOT NULL CONSTRAINT DF_IntroFields_Placeholder DEFAULT '',
    Required    BIT            NOT NULL CONSTRAINT DF_IntroFields_Required    DEFAULT 0,
    Enabled     BIT            NOT NULL CONSTRAINT DF_IntroFields_Enabled     DEFAULT 1,
    DeletedAt   DATETIMEOFFSET NULL,

    CONSTRAINT CK_IntroFields_Type CHECK (Type IN ('name', 'phone', 'email', 'text')),
    CONSTRAINT FK_IntroFields_Form FOREIGN KEY (FormId) REFERENCES dbo.Forms (Id) ON DELETE CASCADE
);
GO

CREATE INDEX IX_IntroFields_Form ON dbo.IntroFields (FormId, Position) WHERE DeletedAt IS NULL;
GO

/* ===========================================================================
   RESPUESTAS

   Nota sobre ON DELETE: SQL Server no admite dos caminos de borrado en cascada
   hacia la misma tabla. ResponseAnswers llega a Forms por dos lados (via
   Responses y via Questions), asi que la FK a Questions queda sin cascada.
   Eso es justamente lo que obliga al borrado logico de las preguntas.
   =========================================================================== */
CREATE TABLE dbo.Responses
(
    Id          VARCHAR(36)    NOT NULL CONSTRAINT PK_Responses PRIMARY KEY,
    FormId      VARCHAR(36)    NOT NULL,
    SubmittedAt DATETIMEOFFSET NOT NULL CONSTRAINT DF_Responses_SubmittedAt DEFAULT SYSDATETIMEOFFSET(),

    CONSTRAINT FK_Responses_Form FOREIGN KEY (FormId) REFERENCES dbo.Forms (Id) ON DELETE CASCADE
);
GO

-- ResponseCount no se guarda en Forms: se cuenta con este indice.
CREATE INDEX IX_Responses_Form ON dbo.Responses (FormId, SubmittedAt DESC);
GO

/* Datos de quien responde, uno por campo de intro. */
CREATE TABLE dbo.ResponseRespondentValues
(
    ResponseId   VARCHAR(36)   NOT NULL,
    IntroFieldId VARCHAR(36)   NOT NULL,
    [Value]      NVARCHAR(500) NOT NULL CONSTRAINT DF_RRV_Value DEFAULT '',

    CONSTRAINT PK_ResponseRespondentValues PRIMARY KEY (ResponseId, IntroFieldId),
    CONSTRAINT FK_RRV_Response   FOREIGN KEY (ResponseId)   REFERENCES dbo.Responses   (Id) ON DELETE CASCADE,
    CONSTRAINT FK_RRV_IntroField FOREIGN KEY (IntroFieldId) REFERENCES dbo.IntroFields (Id)
);
GO

/* Una fila por pregunta respondida.
   TextValue solo se llena en preguntas de texto; en las de opciones queda NULL
   y la eleccion vive en ResponseAnswerOptions. */
CREATE TABLE dbo.ResponseAnswers
(
    Id         VARCHAR(36)   NOT NULL CONSTRAINT PK_ResponseAnswers PRIMARY KEY,
    ResponseId VARCHAR(36)   NOT NULL,
    QuestionId VARCHAR(36)   NOT NULL,
    TextValue  NVARCHAR(MAX) NULL,

    CONSTRAINT UQ_ResponseAnswers UNIQUE (ResponseId, QuestionId),
    CONSTRAINT FK_ResponseAnswers_Response FOREIGN KEY (ResponseId) REFERENCES dbo.Responses (Id) ON DELETE CASCADE,
    CONSTRAINT FK_ResponseAnswers_Question FOREIGN KEY (QuestionId) REFERENCES dbo.Questions (Id)
);
GO

CREATE INDEX IX_ResponseAnswers_Question ON dbo.ResponseAnswers (QuestionId);
GO

/* Opciones elegidas. Opcion unica deja 1 fila; multiple deja N. */
CREATE TABLE dbo.ResponseAnswerOptions
(
    AnswerId VARCHAR(36) NOT NULL,
    OptionId VARCHAR(36) NOT NULL,

    CONSTRAINT PK_ResponseAnswerOptions PRIMARY KEY (AnswerId, OptionId),
    CONSTRAINT FK_RAO_Answer FOREIGN KEY (AnswerId) REFERENCES dbo.ResponseAnswers (Id) ON DELETE CASCADE,
    CONSTRAINT FK_RAO_Option FOREIGN KEY (OptionId) REFERENCES dbo.QuestionOptions  (Id)
);
GO

CREATE INDEX IX_RAO_Option ON dbo.ResponseAnswerOptions (OptionId);
GO

/* ===========================================================================
   AVISOS
   =========================================================================== */
CREATE TABLE dbo.Notifications
(
    Id        VARCHAR(36)    NOT NULL CONSTRAINT PK_Notifications PRIMARY KEY,
    UserId    VARCHAR(36)    NOT NULL,
    Type      NVARCHAR(30)   NOT NULL,
    FormId    VARCHAR(36)    NOT NULL,

    -- Se guarda el titulo del momento: si el formulario se renombra, el aviso
    -- sigue diciendo lo que el usuario vio entonces.
    FormTitle NVARCHAR(500)  NOT NULL CONSTRAINT DF_Notifications_FormTitle DEFAULT '',

    -- Cuantos eventos iguales se agruparon en este aviso.
    [Count]   INT            NOT NULL CONSTRAINT DF_Notifications_Count     DEFAULT 1,

    CreatedAt DATETIMEOFFSET NOT NULL CONSTRAINT DF_Notifications_CreatedAt DEFAULT SYSDATETIMEOFFSET(),
    UpdatedAt DATETIMEOFFSET NOT NULL CONSTRAINT DF_Notifications_UpdatedAt DEFAULT SYSDATETIMEOFFSET(),
    ReadAt    DATETIMEOFFSET NULL,

    CONSTRAINT CK_Notifications_Type CHECK (Type IN (
        'new_responses', 'form_published', 'form_unpublished',
        'form_updated', 'form_trashed', 'form_restored', 'form_shared')),
    CONSTRAINT FK_Notifications_User FOREIGN KEY (UserId) REFERENCES dbo.Users (Id) ON DELETE CASCADE,

    -- Sin cascada a proposito. Con ella habria dos caminos de borrado desde
    -- Users hasta aqui (directo, y pasando por Forms), y SQL Server rechaza el
    -- script con el error 1785. De borrar estos avisos ya se encarga
    -- RemoveForForms cuando se vacia la papelera.
    CONSTRAINT FK_Notifications_Form FOREIGN KEY (FormId) REFERENCES dbo.Forms (Id)
);
GO

-- La campana pide el numero de no leidos todo el tiempo.
CREATE INDEX IX_Notifications_NoLeidos ON dbo.Notifications (UserId, UpdatedAt DESC) WHERE ReadAt IS NULL;

-- Record() busca un aviso sin leer del mismo tipo y formulario para sumarle.
CREATE INDEX IX_Notifications_Agrupar ON dbo.Notifications (UserId, FormId, Type) WHERE ReadAt IS NULL;
GO

/* ===========================================================================
   COMPARTIR
   =========================================================================== */
CREATE TABLE dbo.FormShares
(
    FormId     VARCHAR(36)    NOT NULL,
    UserId     VARCHAR(36)    NOT NULL,

    -- Hoy siempre 'edit': compartir con alguien es para editar entre varios.
    -- 'view' se admite por compatibilidad pero la aplicacion ya no lo usa.
    Permission NVARCHAR(10)   NOT NULL,

    -- Quien lo compartio. Sin clave foranea: es un dato historico.
    SharedBy   VARCHAR(36)    NULL,
    SharedAt   DATETIMEOFFSET NOT NULL CONSTRAINT DF_FormShares_SharedAt DEFAULT SYSDATETIMEOFFSET(),

    CONSTRAINT PK_FormShares PRIMARY KEY (FormId, UserId),
    CONSTRAINT CK_FormShares_Permission CHECK (Permission IN ('edit', 'view')),

    -- Sin cascada hacia Forms por el mismo motivo que en Notifications: SQL
    -- Server rechaza dos caminos de borrado desde Users. El borrado definitivo
    -- de un formulario limpia esta tabla a mano.
    CONSTRAINT FK_FormShares_Form FOREIGN KEY (FormId) REFERENCES dbo.Forms (Id),
    CONSTRAINT FK_FormShares_User FOREIGN KEY (UserId) REFERENCES dbo.Users (Id) ON DELETE CASCADE
);
GO

-- "Compartidos conmigo" busca por usuario.
CREATE INDEX IX_FormShares_User ON dbo.FormShares (UserId);
GO

/* ===========================================================================
   ENLACES PARA RESPONDER QUE VENCEN
   =========================================================================== */
CREATE TABLE dbo.FormLinks
(
    Id        VARCHAR(36)    NOT NULL CONSTRAINT PK_FormLinks PRIMARY KEY,
    FormId    VARCHAR(36)    NOT NULL,

    -- Lo que va en la URL (/r/<Token>). Aleatorio y largo para que no se adivine.
    Token     VARCHAR(32)    NOT NULL,

    -- Pasada esta hora el enlace deja de abrir el formulario. El formulario
    -- sigue abierto: solo cae este enlace.
    ExpiresAt DATETIMEOFFSET NOT NULL,

    -- Quien lo creo. Sin clave foranea: es un dato historico.
    CreatedBy VARCHAR(36)    NULL,
    CreatedAt DATETIMEOFFSET NOT NULL CONSTRAINT DF_FormLinks_CreatedAt DEFAULT SYSDATETIMEOFFSET(),

    -- Sin cascada por el mismo motivo que FormShares: el borrado definitivo de
    -- un formulario limpia esta tabla a mano.
    CONSTRAINT FK_FormLinks_Form FOREIGN KEY (FormId) REFERENCES dbo.Forms (Id)
);
GO

CREATE UNIQUE INDEX UX_FormLinks_Token ON dbo.FormLinks (Token);
CREATE INDEX IX_FormLinks_Form ON dbo.FormLinks (FormId);
GO

/* ===========================================================================
   PLANTILLAS (solo lectura desde la app)
   =========================================================================== */
CREATE TABLE dbo.Templates
(
    Id          VARCHAR(36)    NOT NULL CONSTRAINT PK_Templates PRIMARY KEY,
    Name        NVARCHAR(200)  NOT NULL CONSTRAINT DF_Templates_Name        DEFAULT '',
    Description NVARCHAR(1000) NOT NULL CONSTRAINT DF_Templates_Description DEFAULT '',
    Category    NVARCHAR(100)  NOT NULL CONSTRAINT DF_Templates_Category    DEFAULT ''
);
GO

CREATE TABLE dbo.TemplateQuestions
(
    Id         VARCHAR(36)   NOT NULL CONSTRAINT PK_TemplateQuestions PRIMARY KEY,
    TemplateId VARCHAR(36)   NOT NULL,
    Position   INT           NOT NULL CONSTRAINT DF_TemplateQuestions_Position DEFAULT 0,
    Type       NVARCHAR(30)  NOT NULL,
    Title      NVARCHAR(500) NOT NULL CONSTRAINT DF_TemplateQuestions_Title    DEFAULT '',
    Required   BIT           NOT NULL CONSTRAINT DF_TemplateQuestions_Required DEFAULT 0,

    CONSTRAINT CK_TemplateQuestions_Type     CHECK (Type IN ('short_text', 'long_text', 'single_choice', 'multiple_choice')),
    CONSTRAINT FK_TemplateQuestions_Template FOREIGN KEY (TemplateId) REFERENCES dbo.Templates (Id) ON DELETE CASCADE
);
GO

CREATE INDEX IX_TemplateQuestions_Template ON dbo.TemplateQuestions (TemplateId, Position);
GO

CREATE TABLE dbo.TemplateQuestionOptions
(
    Id                 VARCHAR(36)   NOT NULL CONSTRAINT PK_TemplateQuestionOptions PRIMARY KEY,
    TemplateQuestionId VARCHAR(36)   NOT NULL,
    Position           INT           NOT NULL CONSTRAINT DF_TQO_Position DEFAULT 0,
    [Text]             NVARCHAR(500) NOT NULL CONSTRAINT DF_TQO_Text     DEFAULT '',

    CONSTRAINT FK_TQO_TemplateQuestion FOREIGN KEY (TemplateQuestionId) REFERENCES dbo.TemplateQuestions (Id) ON DELETE CASCADE
);
GO

CREATE INDEX IX_TQO_TemplateQuestion ON dbo.TemplateQuestionOptions (TemplateQuestionId, Position);
GO

/* ===========================================================================
   COMPROBACION
   =========================================================================== */
SELECT
    t.name AS Tabla,
    (SELECT COUNT(*) FROM sys.columns      c WHERE c.object_id        = t.object_id) AS Columnas,
    (SELECT COUNT(*) FROM sys.foreign_keys f WHERE f.parent_object_id = t.object_id) AS ClavesForaneas
FROM sys.tables t
ORDER BY t.name;
GO
