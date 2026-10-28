/* ============================================================================
   13 - Tipo de pregunta: Matriz (tabla de evaluacion)

   Agrega soporte para preguntas de tipo 'matrix': una tabla donde cada fila
   es un criterio y las columnas son las opciones de calificacion.

   Las columnas se guardan como opciones normales (QuestionOptions).
   Las filas van en una nueva columna Questions.Rows como JSON:
     [{"id":"uuid","text":"Claridad de los temas"}, ...]

   Las respuestas de una pregunta de matriz se guardan en
   ResponseAnswers.TextValue como JSON:
     {"rowId1":"colOptId1","rowId2":"colOptId2"}

   No borra datos y se puede ejecutar varias veces.
   ============================================================================ */

SET QUOTED_IDENTIFIER ON;
GO

IF OBJECT_ID('dbo.CK_Questions_Type', 'C') IS NOT NULL
    ALTER TABLE dbo.Questions DROP CONSTRAINT CK_Questions_Type;
GO

ALTER TABLE dbo.Questions ADD CONSTRAINT CK_Questions_Type CHECK (Type IN (
    'short_text', 'long_text', 'single_choice', 'multiple_choice',
    'dropdown', 'yes_no', 'rating', 'nps', 'number', 'date', 'matrix'));
PRINT 'Restriccion CK_Questions_Type actualizada con el tipo matrix.';
GO

IF COL_LENGTH('dbo.Questions', 'Rows') IS NULL
BEGIN
    ALTER TABLE dbo.Questions ADD Rows NVARCHAR(MAX) NULL;
    PRINT 'Columna Questions.Rows creada.';
END
ELSE
    PRINT 'La columna Questions.Rows ya existia.';
GO
