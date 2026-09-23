/* ============================================================================
   08 - Foto de perfil del usuario

   Hasta ahora el avatar eran siempre las iniciales del nombre ("AV"). Con esta
   columna cada uno puede subir su propia foto desde Mi cuenta.

   Guarda la ruta publica del archivo ('/uploads/avatars/xxx.png'), no la imagen:
   los archivos viven en wwwroot, igual que los fondos de los formularios.

   Cadena vacia significa "sin foto", que es como quedan todos los usuarios que
   ya existen: siguen viendose con sus iniciales hasta que suban una.

   No borra datos y se puede ejecutar varias veces. Ejecutalo sobre la base de
   la cadena de conexion (en desarrollo, IescoFormsPrueba).
   ============================================================================ */

SET QUOTED_IDENTIFIER ON;
GO

IF COL_LENGTH('dbo.Users', 'AvatarUrl') IS NULL
BEGIN
    ALTER TABLE dbo.Users ADD AvatarUrl NVARCHAR(400) NOT NULL CONSTRAINT DF_Users_AvatarUrl DEFAULT '';
    PRINT 'Columna Users.AvatarUrl creada.';
END
ELSE
    PRINT 'La columna Users.AvatarUrl ya existia.';
GO
