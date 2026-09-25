/* ============================================================================
   12 - Logica condicional y tipos de pregunta nuevos

   Tipos nuevos: dropdown (lista desplegable), yes_no (Si / No), rating
   (estrellas), nps (0 a 10), number y date. Los de opciones (dropdown y
   yes_no) se guardan igual que single_choice; los demas van en
   ResponseAnswers.TextValue como texto.

   Logica: al terminar una pregunta se puede saltar a otra posterior o
   terminar el formulario.
     - Questions.JumpTo:       salto por defecto de la pregunta.
     - QuestionOptions.JumpTo: salto al elegir esa opcion (opcion unica,
                               lista desplegable y Si / No). Manda sobre el
                               de la pregunta.
   Valores: NULL (a la siguiente), 'end' (terminar) o el id de una pregunta.
   Sin clave foranea: 'end' no es una pregunta, y si la pregunta destino se
   borra el salto se ignora y se sigue a la siguiente.

   Questions.ScaleMax: cuantas estrellas tiene una pregunta rating (3 a 10).

   No borra datos y se puede ejecutar varias veces. Ejecutalo sobre la base de
   la cadena de conexion (en desarrollo, IescoFormsPrueba).
   ============================================================================ */

SET QUOTED_IDENTIFIER ON;
GO

IF OBJECT_ID('dbo.CK_Questions_Type', 'C') IS NOT NULL
    ALTER TABLE dbo.Questions DROP CONSTRAINT CK_Questions_Type;
GO

ALTER TABLE dbo.Questions ADD CONSTRAINT CK_Questions_Type CHECK (Type IN (
    'short_text', 'long_text', 'single_choice', 'multiple_choice',
    'dropdown', 'yes_no', 'rating', 'nps', 'number', 'date'));
PRINT 'Restriccion CK_Questions_Type actualizada con los tipos nuevos.';
GO

IF COL_LENGTH('dbo.Questions', 'JumpTo') IS NULL
BEGIN
    ALTER TABLE dbo.Questions ADD JumpTo VARCHAR(36) NULL;
    PRINT 'Columna Questions.JumpTo creada.';
END
ELSE
    PRINT 'La columna Questions.JumpTo ya existia.';
GO

IF COL_LENGTH('dbo.Questions', 'ScaleMax') IS NULL
BEGIN
    ALTER TABLE dbo.Questions ADD ScaleMax INT NULL
        CONSTRAINT CK_Questions_ScaleMax CHECK (ScaleMax BETWEEN 3 AND 10);
    PRINT 'Columna Questions.ScaleMax creada.';
END
ELSE
    PRINT 'La columna Questions.ScaleMax ya existia.';
GO

IF COL_LENGTH('dbo.QuestionOptions', 'JumpTo') IS NULL
BEGIN
    ALTER TABLE dbo.QuestionOptions ADD JumpTo VARCHAR(36) NULL;
    PRINT 'Columna QuestionOptions.JumpTo creada.';
END
ELSE
    PRINT 'La columna QuestionOptions.JumpTo ya existia.';
GO
