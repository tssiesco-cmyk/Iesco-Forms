/* ============================================================================
   05 - Enlaces para responder que vencen

   Cada enlace es un codigo (/r/<Token>) que abre un formulario para responder
   sin iniciar sesion hasta ExpiresAt. Vencido el enlace, el formulario sigue
   abierto: solo cae ese enlace. Puede haber varios por formulario.

   No borra datos y se puede ejecutar varias veces. Ejecutalo sobre la base de
   la cadena de conexion (en desarrollo, IescoFormsPrueba).
   ============================================================================ */

SET QUOTED_IDENTIFIER ON;
GO

IF OBJECT_ID('dbo.FormLinks') IS NULL
BEGIN
    CREATE TABLE dbo.FormLinks
    (
        Id        VARCHAR(36)    NOT NULL CONSTRAINT PK_FormLinks PRIMARY KEY,
        FormId    VARCHAR(36)    NOT NULL,

        -- Lo que va en la URL. Aleatorio y largo para que no se pueda adivinar.
        Token     VARCHAR(32)    NOT NULL,

        ExpiresAt DATETIMEOFFSET NOT NULL,

        -- Quien lo creo. Sin clave foranea: es un dato historico.
        CreatedBy VARCHAR(36)    NULL,
        CreatedAt DATETIMEOFFSET NOT NULL CONSTRAINT DF_FormLinks_CreatedAt DEFAULT SYSDATETIMEOFFSET(),

        -- Sin cascada por el mismo motivo que FormShares: el borrado definitivo
        -- de un formulario limpia esta tabla a mano.
        CONSTRAINT FK_FormLinks_Form FOREIGN KEY (FormId) REFERENCES dbo.Forms (Id)
    );

    -- Abrir un enlace busca por el token.
    CREATE UNIQUE INDEX UX_FormLinks_Token ON dbo.FormLinks (Token);
    CREATE INDEX IX_FormLinks_Form ON dbo.FormLinks (FormId);

    PRINT 'Tabla FormLinks creada.';
END
ELSE
    PRINT 'La tabla FormLinks ya existia.';
GO
