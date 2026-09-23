/* ============================================================================
   11 - Quien hizo cada cosa en los avisos

   La campana decia "Formulario editado · Encuesta X" pero no quien lo edito.
   Con Notifications.ActorId cada aviso guarda a su autor, y el panel muestra
   "Juan Perez", "Tu" o "Alguien con el enlace".

   El autor entra en la agrupacion: si editan Juan y Ana, llegan dos avisos,
   uno de cada uno, en vez de uno solo mezclado.

   Sin clave foranea a proposito: si se borra al usuario, el aviso se queda
   (sin nombre). Los avisos que ya existen quedan con ActorId en NULL y se ven
   igual que antes.

   No borra datos y se puede ejecutar varias veces. Ejecutalo sobre la base de
   la cadena de conexion (en desarrollo, IescoFormsPrueba).
   ============================================================================ */

SET QUOTED_IDENTIFIER ON;
GO

IF COL_LENGTH('dbo.Notifications', 'ActorId') IS NULL
BEGIN
    ALTER TABLE dbo.Notifications ADD ActorId VARCHAR(36) NULL;
    PRINT 'Columna Notifications.ActorId creada.';
END
ELSE
    PRINT 'La columna Notifications.ActorId ya existia.';
GO
