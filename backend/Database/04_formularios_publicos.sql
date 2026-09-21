/* ============================================================================
   04 - Formularios publicos y compartir solo para editar

   - Forms.IsPublic: el formulario aparece a todos los usuarios en
     Compartidos > Publicos para responderlo (solo mientras esta publicado).
   - Compartir con personas concretas ya no distingue permisos: siempre es para
     editar. Las filas que hubiera con 'view' pasan a 'edit'.

   No borra datos y se puede ejecutar varias veces. Ejecutalo sobre la base de
   la cadena de conexion (en desarrollo, IescoFormsPrueba).
   ============================================================================ */

SET QUOTED_IDENTIFIER ON;
GO

IF COL_LENGTH('dbo.Forms', 'IsPublic') IS NULL
BEGIN
    ALTER TABLE dbo.Forms ADD IsPublic BIT NOT NULL CONSTRAINT DF_Forms_IsPublic DEFAULT 0;
    PRINT 'Columna Forms.IsPublic creada.';
END
ELSE
    PRINT 'La columna Forms.IsPublic ya existia.';
GO

UPDATE dbo.FormShares SET Permission = 'edit' WHERE Permission <> 'edit';
PRINT CONCAT('Compartidos pasados a edicion: ', @@ROWCOUNT);
GO
