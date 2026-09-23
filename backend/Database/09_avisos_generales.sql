/* ============================================================================
   09 - Avisos de todo, no solo de formularios

   Hasta ahora la campana solo sabia hablar de formularios: cada aviso exigia un
   FormId con clave foranea, y un CHECK limitaba los tipos a siete. Con eso era
   imposible anunciar un cambio de contrasena o la creacion de un usuario.

   Este script hace tres cosas:

     1. FormId pasa a admitir NULL. Los avisos de cuenta y de usuarios no hablan
        de ningun formulario, y el de "borrado definitivo" tampoco puede: su
        formulario ya no existe cuando se registra.

     2. FormTitle se renombra a Subject. Guarda lo mismo de antes (el titulo del
        formulario) pero tambien el nombre de la persona en los avisos de
        usuarios, asi que "FormTitle" se habia quedado corto.

     3. El CHECK de tipos se amplia con los catorce nuevos.

   No borra datos: los avisos que ya existen siguen igual, con su FormId y su
   texto. Se puede ejecutar varias veces. Ejecutalo sobre la base de la cadena
   de conexion (en desarrollo, IescoFormsPrueba).
   ============================================================================ */

SET QUOTED_IDENTIFIER ON;
GO

/* ---------------------------------------------------------------------------
   1. FormTitle -> Subject
   --------------------------------------------------------------------------- */
IF COL_LENGTH('dbo.Notifications', 'Subject') IS NULL
   AND COL_LENGTH('dbo.Notifications', 'FormTitle') IS NOT NULL
BEGIN
    EXEC sp_rename 'dbo.Notifications.FormTitle', 'Subject', 'COLUMN';
    PRINT 'Notifications.FormTitle renombrada a Subject.';
END
ELSE
    PRINT 'Notifications.Subject ya existia.';
GO

-- El DEFAULT conserva el nombre viejo tras el rename; se deja coherente.
IF EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'DF_Notifications_FormTitle')
BEGIN
    EXEC sp_rename 'DF_Notifications_FormTitle', 'DF_Notifications_Subject', 'OBJECT';
    PRINT 'Restriccion DF_Notifications_FormTitle renombrada.';
END
GO

/* ---------------------------------------------------------------------------
   2. FormId pasa a aceptar NULL

   Para cambiar la nulabilidad hay que soltar antes la clave foranea y el indice
   filtrado que la usan. Los dos se vuelven a crear igual que estaban.
   --------------------------------------------------------------------------- */
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Notifications_Form')
BEGIN
    ALTER TABLE dbo.Notifications DROP CONSTRAINT FK_Notifications_Form;
    PRINT 'Clave foranea FK_Notifications_Form soltada temporalmente.';
END
GO

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Notifications_Agrupar' AND object_id = OBJECT_ID('dbo.Notifications'))
BEGIN
    DROP INDEX IX_Notifications_Agrupar ON dbo.Notifications;
    PRINT 'Indice IX_Notifications_Agrupar soltado temporalmente.';
END
GO

IF EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.Notifications') AND name = 'FormId' AND is_nullable = 0)
BEGIN
    ALTER TABLE dbo.Notifications ALTER COLUMN FormId VARCHAR(36) NULL;
    PRINT 'Notifications.FormId ahora admite NULL.';
END
ELSE
    PRINT 'Notifications.FormId ya admitia NULL.';
GO

-- Se recrean los dos. La foranea sigue sin cascada por la misma razon de antes:
-- con ella habria dos caminos de borrado desde Users y SQL Server da el 1785.
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Notifications_Form')
BEGIN
    ALTER TABLE dbo.Notifications
        ADD CONSTRAINT FK_Notifications_Form FOREIGN KEY (FormId) REFERENCES dbo.Forms (Id);
    PRINT 'Clave foranea FK_Notifications_Form recreada.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Notifications_Agrupar' AND object_id = OBJECT_ID('dbo.Notifications'))
BEGIN
    CREATE INDEX IX_Notifications_Agrupar ON dbo.Notifications (UserId, FormId, Type) WHERE ReadAt IS NULL;
    PRINT 'Indice IX_Notifications_Agrupar recreado.';
END
GO

/* ---------------------------------------------------------------------------
   3. Los tipos nuevos

   El CHECK se reemplaza entero: es mas claro leer la lista completa que ir
   anadiendo restricciones sueltas.
   --------------------------------------------------------------------------- */
IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Notifications_Type')
BEGIN
    ALTER TABLE dbo.Notifications DROP CONSTRAINT CK_Notifications_Type;
END
GO

ALTER TABLE dbo.Notifications ADD CONSTRAINT CK_Notifications_Type CHECK (Type IN (
    -- Sobre un formulario
    'new_responses', 'form_created', 'form_published', 'form_unpublished',
    'form_updated', 'form_trashed', 'form_restored', 'form_deleted',
    'form_shared', 'form_unshared', 'form_public', 'form_private', 'form_link',
    -- Sobre la cuenta
    'account_updated', 'password_changed', 'password_reset',
    'password_request_dismissed',
    -- Gestion de usuarios
    'user_created', 'user_role_changed', 'user_activated', 'user_deactivated',
    'password_requested'));
GO

PRINT 'CHECK de tipos actualizado con los avisos nuevos.';
GO
