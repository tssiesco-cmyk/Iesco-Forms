using Microsoft.EntityFrameworkCore;

namespace IescoForms.Api.Data;

/// <summary>
/// Mapea las clases de <c>Rows.cs</c> contra el esquema de Database/01_schema.sql.
///
/// La configuracion es explicita a proposito: las tablas ya existen y las creo
/// el script, asi que aqui no se inventa nada por convencion. Si alguien cambia
/// una columna en SQL y se olvida de este archivo, el error salta al arrancar y
/// no a mitad de una peticion.
/// </summary>
public class IescoFormsDbContext(DbContextOptions<IescoFormsDbContext> options) : DbContext(options)
{
    public DbSet<UserRow> Users => Set<UserRow>();
    public DbSet<FormRow> Forms => Set<FormRow>();
    public DbSet<QuestionRow> Questions => Set<QuestionRow>();
    public DbSet<QuestionOptionRow> QuestionOptions => Set<QuestionOptionRow>();
    public DbSet<IntroFieldRow> IntroFields => Set<IntroFieldRow>();
    public DbSet<ResponseRow> Responses => Set<ResponseRow>();
    public DbSet<ResponseRespondentValueRow> ResponseRespondentValues => Set<ResponseRespondentValueRow>();
    public DbSet<ResponseAnswerRow> ResponseAnswers => Set<ResponseAnswerRow>();
    public DbSet<ResponseAnswerOptionRow> ResponseAnswerOptions => Set<ResponseAnswerOptionRow>();
    public DbSet<NotificationRow> Notifications => Set<NotificationRow>();
    public DbSet<FormShareRow> FormShares => Set<FormShareRow>();
    public DbSet<FormLinkRow> FormLinks => Set<FormLinkRow>();
    public DbSet<FormActivityRow> FormActivity => Set<FormActivityRow>();
    public DbSet<UserTemplateRow> UserTemplates => Set<UserTemplateRow>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<UserRow>(e =>
        {
            e.ToTable("Users");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnType("varchar(36)");
            e.HasIndex(x => x.Email).IsUnique();
        });

        b.Entity<FormRow>(e =>
        {
            e.ToTable("Forms");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnType("varchar(36)");
            e.Property(x => x.OwnerId).HasColumnType("varchar(36)");
            e.Property(x => x.RowVersion).IsRowVersion();

            e.HasMany(x => x.Questions)
                .WithOne(q => q.Form!)
                .HasForeignKey(q => q.FormId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasMany(x => x.IntroFields)
                .WithOne(f => f.Form!)
                .HasForeignKey(f => f.FormId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<QuestionRow>(e =>
        {
            e.ToTable("Questions");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnType("varchar(36)");
            e.Property(x => x.FormId).HasColumnType("varchar(36)");
            e.Property(x => x.JumpTo).HasColumnType("varchar(36)");
            e.Property(x => x.RowVersion).IsRowVersion();

            e.HasMany(x => x.Options)
                .WithOne(o => o.Question!)
                .HasForeignKey(o => o.QuestionId)
                .OnDelete(DeleteBehavior.Cascade);

            // Filtro global: una pregunta borrada deja de existir para todas las
            // consultas sin que nadie tenga que acordarse de excluirla. Es la
            // red de seguridad del borrado logico.
            e.HasQueryFilter(x => x.DeletedAt == null);
        });

        b.Entity<QuestionOptionRow>(e =>
        {
            e.ToTable("QuestionOptions");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnType("varchar(36)");
            e.Property(x => x.QuestionId).HasColumnType("varchar(36)");
            e.Property(x => x.Text).HasColumnName("Text");
            e.Property(x => x.JumpTo).HasColumnType("varchar(36)");
            e.HasQueryFilter(x => x.DeletedAt == null);
        });

        b.Entity<IntroFieldRow>(e =>
        {
            e.ToTable("IntroFields");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnType("varchar(36)");
            e.Property(x => x.FormId).HasColumnType("varchar(36)");
            e.HasQueryFilter(x => x.DeletedAt == null);
        });

        b.Entity<ResponseRow>(e =>
        {
            e.ToTable("Responses");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnType("varchar(36)");
            e.Property(x => x.FormId).HasColumnType("varchar(36)");

            e.HasOne<FormRow>()
                .WithMany()
                .HasForeignKey(x => x.FormId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasMany(x => x.Answers)
                .WithOne()
                .HasForeignKey(a => a.ResponseId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasMany(x => x.RespondentValues)
                .WithOne()
                .HasForeignKey(v => v.ResponseId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<ResponseRespondentValueRow>(e =>
        {
            e.ToTable("ResponseRespondentValues");
            e.HasKey(x => new { x.ResponseId, x.IntroFieldId });
            e.Property(x => x.ResponseId).HasColumnType("varchar(36)");
            e.Property(x => x.IntroFieldId).HasColumnType("varchar(36)");
            e.Property(x => x.Value).HasColumnName("Value");

            e.HasOne<IntroFieldRow>()
                .WithMany()
                .HasForeignKey(x => x.IntroFieldId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        b.Entity<ResponseAnswerRow>(e =>
        {
            e.ToTable("ResponseAnswers");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnType("varchar(36)");
            e.Property(x => x.ResponseId).HasColumnType("varchar(36)");
            e.Property(x => x.QuestionId).HasColumnType("varchar(36)");
            e.HasIndex(x => new { x.ResponseId, x.QuestionId }).IsUnique();

            // Sin cascada: SQL Server no admite dos caminos de borrado hacia
            // Forms. Es justo lo que obliga al DeletedAt de las preguntas.
            e.HasOne<QuestionRow>()
                .WithMany()
                .HasForeignKey(x => x.QuestionId)
                .OnDelete(DeleteBehavior.NoAction);

            e.HasMany(x => x.SelectedOptions)
                .WithOne()
                .HasForeignKey(o => o.AnswerId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<ResponseAnswerOptionRow>(e =>
        {
            e.ToTable("ResponseAnswerOptions");
            e.HasKey(x => new { x.AnswerId, x.OptionId });
            e.Property(x => x.AnswerId).HasColumnType("varchar(36)");
            e.Property(x => x.OptionId).HasColumnType("varchar(36)");

            e.HasOne<QuestionOptionRow>()
                .WithMany()
                .HasForeignKey(x => x.OptionId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        b.Entity<FormLinkRow>(e =>
        {
            e.ToTable("FormLinks");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnType("varchar(36)");
            e.Property(x => x.FormId).HasColumnType("varchar(36)");
            e.Property(x => x.Token).HasColumnType("varchar(32)");
            e.Property(x => x.CreatedBy).HasColumnType("varchar(36)");
            e.HasIndex(x => x.Token).IsUnique();

            e.HasOne<FormRow>()
                .WithMany()
                .HasForeignKey(x => x.FormId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        b.Entity<FormShareRow>(e =>
        {
            e.ToTable("FormShares");
            e.HasKey(x => new { x.FormId, x.UserId });
            e.Property(x => x.FormId).HasColumnType("varchar(36)");
            e.Property(x => x.UserId).HasColumnType("varchar(36)");
            e.Property(x => x.SharedBy).HasColumnType("varchar(36)");

            e.HasOne<FormRow>()
                .WithMany()
                .HasForeignKey(x => x.FormId)
                .OnDelete(DeleteBehavior.NoAction);

            e.HasOne<UserRow>()
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<NotificationRow>(e =>
        {
            e.ToTable("Notifications");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnType("varchar(36)");
            e.Property(x => x.UserId).HasColumnType("varchar(36)");
            e.Property(x => x.FormId).HasColumnType("varchar(36)");
            e.Property(x => x.ActorId).HasColumnType("varchar(36)");

            // "Count" es palabra reservada en T-SQL; EF la entrecomilla sola.
            e.Property(x => x.Count).HasColumnName("Count");

            e.HasOne<UserRow>()
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne<FormRow>()
                .WithMany()
                .HasForeignKey(x => x.FormId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        b.Entity<FormActivityRow>(e =>
        {
            e.ToTable("FormActivity");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnType("varchar(36)");
            e.Property(x => x.FormId).HasColumnType("varchar(36)");
            e.Property(x => x.UserId).HasColumnType("varchar(36)");
            e.Property(x => x.Action).HasColumnType("varchar(40)");
            e.Property(x => x.Count).HasColumnName("Count");

            // Sin cascada, como el resto de hijas de Forms: el borrado definitivo
            // las limpia a mano en SqlFormStore.
            e.HasOne<FormRow>()
                .WithMany()
                .HasForeignKey(x => x.FormId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        b.Entity<UserTemplateRow>(e =>
        {
            e.ToTable("UserTemplates");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnType("varchar(36)");
            e.Property(x => x.OwnerId).HasColumnType("varchar(36)");
        });
    }
}
