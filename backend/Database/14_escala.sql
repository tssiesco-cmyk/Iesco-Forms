/* ============================================================================
   14 - Tipo de pregunta: Escala

   Botones numerados de ScaleMin (0 o 1) a ScaleMax, con un texto en cada
   extremo ("Insatisfecho" / "Muy satisfecho"). ScaleMax ya existia para las
   estrellas; aqui se agregan el inicio y los dos textos.

   La respuesta se guarda en ResponseAnswers.TextValue, igual que NPS.

   No borra datos y se puede ejecutar varias veces.
   ============================================================================ */

SET QUOTED_IDENTIFIER ON;
GO

IF OBJECT_ID('dbo.CK_Questions_Type', 'C') IS NOT NULL
    ALTER TABLE dbo.Questions DROP CONSTRAINT CK_Questions_Type;
GO

ALTER TABLE dbo.Questions ADD CONSTRAINT CK_Questions_Type CHECK (Type IN (
    'short_text', 'long_text', 'single_choice', 'multiple_choice',
    'dropdown', 'yes_no', 'rating', 'nps', 'number', 'date', 'matrix', 'scale'));
PRINT 'Restriccion CK_Questions_Type actualizada con el tipo scale.';
GO

IF COL_LENGTH('dbo.Questions', 'ScaleMin') IS NULL
BEGIN
    ALTER TABLE dbo.Questions ADD ScaleMin INT NULL
        CONSTRAINT CK_Questions_ScaleMin CHECK (ScaleMin IN (0, 1));
    PRINT 'Columna Questions.ScaleMin creada.';
END
GO

IF COL_LENGTH('dbo.Questions', 'ScaleMinLabel') IS NULL
BEGIN
    ALTER TABLE dbo.Questions ADD ScaleMinLabel NVARCHAR(100) NULL;
    PRINT 'Columna Questions.ScaleMinLabel creada.';
END
GO

IF COL_LENGTH('dbo.Questions', 'ScaleMaxLabel') IS NULL
BEGIN
    ALTER TABLE dbo.Questions ADD ScaleMaxLabel NVARCHAR(100) NULL;
    PRINT 'Columna Questions.ScaleMaxLabel creada.';
END
GO
