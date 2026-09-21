/* ============================================================================
   07 - Portada del formulario

   La primera pantalla que ve quien responde, antes de las preguntas: un titulo,
   un subtitulo y un texto de bienvenida. Es opcional; apagada, se entra directo
   a las preguntas (o a los datos del respondedor, si los hay).

   El fondo de la portada no necesita columna: es el IntroBackgroundImage que ya
   existe, que cubre esa misma pantalla.

   Los textos vacios significan "usa el titulo y la descripcion del formulario",
   asi que los formularios que ya existen no cambian de aspecto.

   No borra datos y se puede ejecutar varias veces. Ejecutalo sobre la base de
   la cadena de conexion (en desarrollo, IescoFormsPrueba).
   ============================================================================ */

SET QUOTED_IDENTIFIER ON;
GO

IF COL_LENGTH('dbo.Forms', 'CoverEnabled') IS NULL
BEGIN
    ALTER TABLE dbo.Forms ADD CoverEnabled BIT NOT NULL CONSTRAINT DF_Forms_CoverEnabled DEFAULT 0;
    PRINT 'Columna Forms.CoverEnabled creada.';
END
ELSE
    PRINT 'La columna Forms.CoverEnabled ya existia.';
GO

IF COL_LENGTH('dbo.Forms', 'CoverTitle') IS NULL
BEGIN
    ALTER TABLE dbo.Forms ADD CoverTitle NVARCHAR(200) NOT NULL CONSTRAINT DF_Forms_CoverTitle DEFAULT '';
    PRINT 'Columna Forms.CoverTitle creada.';
END
ELSE
    PRINT 'La columna Forms.CoverTitle ya existia.';
GO

IF COL_LENGTH('dbo.Forms', 'CoverSubtitle') IS NULL
BEGIN
    ALTER TABLE dbo.Forms ADD CoverSubtitle NVARCHAR(300) NOT NULL CONSTRAINT DF_Forms_CoverSubtitle DEFAULT '';
    PRINT 'Columna Forms.CoverSubtitle creada.';
END
ELSE
    PRINT 'La columna Forms.CoverSubtitle ya existia.';
GO

IF COL_LENGTH('dbo.Forms', 'CoverWelcome') IS NULL
BEGIN
    ALTER TABLE dbo.Forms ADD CoverWelcome NVARCHAR(1000) NOT NULL CONSTRAINT DF_Forms_CoverWelcome DEFAULT '';
    PRINT 'Columna Forms.CoverWelcome creada.';
END
ELSE
    PRINT 'La columna Forms.CoverWelcome ya existia.';
GO
