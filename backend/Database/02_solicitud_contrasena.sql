/* ============================================================================
   02 - Solicitudes de "Olvide mi contrasena"

   Para bases creadas con 01_schema.sql antes de este cambio. No borra nada y se
   puede ejecutar varias veces: si la columna ya existe, no hace nada.

   Ejecutalo sobre la base de la cadena de conexion (en desarrollo,
   IescoFormsPrueba).
   ============================================================================ */

IF COL_LENGTH('dbo.Users', 'PasswordResetRequestedAt') IS NULL
BEGIN
    ALTER TABLE dbo.Users ADD PasswordResetRequestedAt DATETIMEOFFSET NULL;
    PRINT 'Columna PasswordResetRequestedAt creada.';
END
ELSE
    PRINT 'La columna PasswordResetRequestedAt ya existia.';
GO
