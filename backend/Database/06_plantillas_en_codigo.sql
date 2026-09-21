/* ============================================================================
   06 - Las plantillas pasan al codigo

   El catalogo de plantillas dejo de vivir en la base. Ahora esta en
   backend/Services/SeedData.cs y la aplicacion lo lee de ahi, asi que estas tres
   tablas ya no las usa nadie:

     - TemplateQuestionOptions
     - TemplateQuestions
     - Templates

   Motivo: son un catalogo fijo, igual para todos y de solo lectura. Tenerlo
   ademas en la base obligaba a borrar filas a mano cada vez que se editaba una
   plantilla en el codigo, porque el sembrador saltaba las que ya existian y la
   base se quedaba con la version vieja.

   Los formularios creados a partir de una plantilla NO se tocan: al crearlos se
   copian a Forms/Questions/QuestionOptions, que siguen igual.

   Se puede ejecutar varias veces. Ejecutalo sobre la base de la cadena de
   conexion (en desarrollo, IescoFormsPrueba).
   ============================================================================ */

SET QUOTED_IDENTIFIER ON;
GO

/* En orden inverso a las dependencias: las hijas primero. */
IF OBJECT_ID('dbo.TemplateQuestionOptions', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.TemplateQuestionOptions;
    PRINT 'Tabla TemplateQuestionOptions eliminada.';
END
ELSE
    PRINT 'La tabla TemplateQuestionOptions ya no existia.';
GO

IF OBJECT_ID('dbo.TemplateQuestions', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.TemplateQuestions;
    PRINT 'Tabla TemplateQuestions eliminada.';
END
ELSE
    PRINT 'La tabla TemplateQuestions ya no existia.';
GO

IF OBJECT_ID('dbo.Templates', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.Templates;
    PRINT 'Tabla Templates eliminada.';
END
ELSE
    PRINT 'La tabla Templates ya no existia.';
GO
