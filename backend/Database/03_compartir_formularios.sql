/* ============================================================================
   03 - Compartir formularios con otros usuarios

   Para bases creadas con 01_schema.sql antes de este cambio. No borra datos y
   se puede ejecutar varias veces.

   Ejecutalo sobre la base de la cadena de conexion (en desarrollo,
   IescoFormsPrueba).
   ============================================================================ */

SET QUOTED_IDENTIFIER ON;
GO

IF OBJECT_ID('dbo.FormShares') IS NULL
BEGIN
    CREATE TABLE dbo.FormShares
    (
        FormId     VARCHAR(36)    NOT NULL,
        UserId     VARCHAR(36)    NOT NULL,

        -- edit: puede cambiar el formulario y publicarlo.
        -- view: solo vista previa y resultados.
        Permission NVARCHAR(10)   NOT NULL,

        -- Quien lo compartio. Sin clave foranea: es un dato historico.
        SharedBy   VARCHAR(36)    NULL,
        SharedAt   DATETIMEOFFSET NOT NULL CONSTRAINT DF_FormShares_SharedAt DEFAULT SYSDATETIMEOFFSET(),

        CONSTRAINT PK_FormShares PRIMARY KEY (FormId, UserId),
        CONSTRAINT CK_FormShares_Permission CHECK (Permission IN ('edit', 'view')),

        -- Sin cascada hacia Forms por el mismo motivo que en Notifications: SQL
        -- Server rechaza dos caminos de borrado desde Users. El borrado
        -- definitivo de un formulario limpia esta tabla a mano.
        CONSTRAINT FK_FormShares_Form FOREIGN KEY (FormId) REFERENCES dbo.Forms (Id),
        CONSTRAINT FK_FormShares_User FOREIGN KEY (UserId) REFERENCES dbo.Users (Id) ON DELETE CASCADE
    );

    -- "Compartidos conmigo" busca por usuario.
    CREATE INDEX IX_FormShares_User ON dbo.FormShares (UserId);

    PRINT 'Tabla FormShares creada.';
END
ELSE
    PRINT 'La tabla FormShares ya existia.';
GO

-- Nuevo tipo de aviso: "te compartieron un formulario".
IF EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'CK_Notifications_Type'
      AND definition NOT LIKE '%form_shared%')
BEGIN
    ALTER TABLE dbo.Notifications DROP CONSTRAINT CK_Notifications_Type;
    ALTER TABLE dbo.Notifications ADD CONSTRAINT CK_Notifications_Type CHECK (Type IN (
        'new_responses', 'form_published', 'form_unpublished',
        'form_updated', 'form_trashed', 'form_restored', 'form_shared'));

    PRINT 'Aviso form_shared agregado.';
END
ELSE
    PRINT 'El aviso form_shared ya estaba.';
GO
