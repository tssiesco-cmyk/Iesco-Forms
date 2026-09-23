/* ============================================================================
   10 - Cierre automatico, mensaje final, historial y plantillas propias

   Este script hace cuatro cosas:

     1. Forms.ClosesAt y Forms.MaxResponses: el formulario deja de aceptar
        respuestas en una fecha o al llegar a un numero. NULL = sin limite, que
        es como quedan todos los formularios que ya existen.

     2. Forms.ConfirmationMessage: el texto que ve quien termina de responder.
        Vacio = el mensaje de siempre.

     3. Tabla FormActivity: el historial de cada formulario (quien edito,
        publico, compartio, borro una respuesta...).

     4. Tabla UserTemplates: las plantillas que guardan los usuarios desde un
        formulario suyo. Las del catalogo siguen en el codigo (ver script 06).

   No borra datos y se puede ejecutar varias veces. Ejecutalo sobre la base de
   la cadena de conexion (en desarrollo, IescoFormsPrueba).
   ============================================================================ */

SET QUOTED_IDENTIFIER ON;
GO

/* ---------------------------------------------------------------------------
   1 y 2. Columnas nuevas de Forms
   --------------------------------------------------------------------------- */
IF COL_LENGTH('dbo.Forms', 'ClosesAt') IS NULL
BEGIN
    ALTER TABLE dbo.Forms ADD ClosesAt DATETIMEOFFSET NULL;
    PRINT 'Columna Forms.ClosesAt creada.';
END
ELSE
    PRINT 'La columna Forms.ClosesAt ya existia.';
GO

IF COL_LENGTH('dbo.Forms', 'MaxResponses') IS NULL
BEGIN
    ALTER TABLE dbo.Forms ADD MaxResponses INT NULL
        CONSTRAINT CK_Forms_MaxResponses CHECK (MaxResponses IS NULL OR MaxResponses > 0);
    PRINT 'Columna Forms.MaxResponses creada.';
END
ELSE
    PRINT 'La columna Forms.MaxResponses ya existia.';
GO

IF COL_LENGTH('dbo.Forms', 'ConfirmationMessage') IS NULL
BEGIN
    ALTER TABLE dbo.Forms ADD ConfirmationMessage NVARCHAR(1000) NOT NULL
        CONSTRAINT DF_Forms_ConfirmationMessage DEFAULT '';
    PRINT 'Columna Forms.ConfirmationMessage creada.';
END
ELSE
    PRINT 'La columna Forms.ConfirmationMessage ya existia.';
GO

/* ---------------------------------------------------------------------------
   3. Historial de cada formulario

   Sin cascada hacia Forms, igual que Notifications y FormShares: el borrado
   definitivo limpia estas filas a mano (SqlFormStore.BorrarDeVerdad).
   UserId sin clave foranea a proposito: si se borra el usuario, lo que hizo
   sigue en el historial.
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.FormActivity') IS NULL
BEGIN
    CREATE TABLE dbo.FormActivity
    (
        Id        VARCHAR(36)    NOT NULL CONSTRAINT PK_FormActivity PRIMARY KEY,
        FormId    VARCHAR(36)    NOT NULL,
        UserId    VARCHAR(36)    NULL,
        Action    VARCHAR(40)    NOT NULL,
        Detail    NVARCHAR(500)  NOT NULL CONSTRAINT DF_FormActivity_Detail DEFAULT '',
        [Count]   INT            NOT NULL CONSTRAINT DF_FormActivity_Count  DEFAULT 1,
        CreatedAt DATETIMEOFFSET NOT NULL CONSTRAINT DF_FormActivity_CreatedAt DEFAULT SYSDATETIMEOFFSET(),
        UpdatedAt DATETIMEOFFSET NOT NULL CONSTRAINT DF_FormActivity_UpdatedAt DEFAULT SYSDATETIMEOFFSET(),

        CONSTRAINT FK_FormActivity_Form FOREIGN KEY (FormId) REFERENCES dbo.Forms (Id)
    );

    CREATE INDEX IX_FormActivity_Form ON dbo.FormActivity (FormId, UpdatedAt DESC);
    PRINT 'Tabla FormActivity creada.';
END
ELSE
    PRINT 'La tabla FormActivity ya existia.';
GO

/* ---------------------------------------------------------------------------
   4. Plantillas de los usuarios

   El contenido va entero en JSON: se lee y se escribe siempre de una vez.
   OwnerId sin clave foranea: si se borra al autor, la plantilla sigue siendo
   util para el resto del equipo.
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.UserTemplates') IS NULL
BEGIN
    CREATE TABLE dbo.UserTemplates
    (
        Id          VARCHAR(36)    NOT NULL CONSTRAINT PK_UserTemplates PRIMARY KEY,
        OwnerId     VARCHAR(36)    NULL,
        Name        NVARCHAR(200)  NOT NULL,
        Description NVARCHAR(1000) NOT NULL CONSTRAINT DF_UserTemplates_Description DEFAULT '',
        Content     NVARCHAR(MAX)  NOT NULL,
        CreatedAt   DATETIMEOFFSET NOT NULL CONSTRAINT DF_UserTemplates_CreatedAt DEFAULT SYSDATETIMEOFFSET()
    );

    PRINT 'Tabla UserTemplates creada.';
END
ELSE
    PRINT 'La tabla UserTemplates ya existia.';
GO
