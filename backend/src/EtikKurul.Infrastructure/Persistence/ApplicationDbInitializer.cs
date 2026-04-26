using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using System.Data.Common;

namespace EtikKurul.Infrastructure.Persistence;

public static class ApplicationDbInitializer
{
    public static async Task InitializeAsync(IServiceProvider services, CancellationToken cancellationToken = default)
    {
        const int maxAttempts = 10;
        var delay = TimeSpan.FromSeconds(3);

        for (var attempt = 1; attempt <= maxAttempts; attempt++)
        {
            try
            {
                await using var scope = services.CreateAsyncScope();
                var logger = scope.ServiceProvider
                    .GetRequiredService<ILoggerFactory>()
                    .CreateLogger("EtikKurul.Infrastructure.Persistence.ApplicationDbInitializer");
                var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                await EnsureSchemaAsync(dbContext, logger, cancellationToken);
                logger.LogInformation("Application database is ready.");
                return;
            }
            catch (Exception ex) when (attempt < maxAttempts && !cancellationToken.IsCancellationRequested)
            {
                await using var scope = services.CreateAsyncScope();
                var logger = scope.ServiceProvider
                    .GetRequiredService<ILoggerFactory>()
                    .CreateLogger("EtikKurul.Infrastructure.Persistence.ApplicationDbInitializer");

                logger.LogWarning(
                    ex,
                    "Database initialization attempt {Attempt} of {MaxAttempts} failed. Retrying in {DelaySeconds} seconds.",
                    attempt,
                    maxAttempts,
                    delay.TotalSeconds);

                await Task.Delay(delay, cancellationToken);
            }
        }
    }

    private static async Task EnsureSchemaAsync(
        ApplicationDbContext dbContext,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        var created = await dbContext.Database.EnsureCreatedAsync(cancellationToken);
        if (created || !dbContext.Database.IsRelational())
        {
            return;
        }

        var requiredTables = new[]
        {
            "applications",
            "application_expert_assignments",
            "application_expert_review_decisions",
            "application_revision_responses",
            "application_review_packages",
            "application_committee_agenda_items",
        };

        if (await RequiredTablesExistAsync(dbContext, requiredTables, cancellationToken))
        {
            return;
        }

        logger.LogWarning(
            "Existing relational schema is missing one or more required Etik Kurul tables. Recreating the isolated development database.");

        await dbContext.Database.EnsureDeletedAsync(cancellationToken);
        await dbContext.Database.EnsureCreatedAsync(cancellationToken);
    }

    private static async Task<bool> RequiredTablesExistAsync(
        ApplicationDbContext dbContext,
        IEnumerable<string> tableNames,
        CancellationToken cancellationToken)
    {
        foreach (var tableName in tableNames)
        {
            if (!await TableExistsAsync(dbContext, tableName, cancellationToken))
            {
                return false;
            }
        }

        return true;
    }

    private static async Task<bool> TableExistsAsync(
        ApplicationDbContext dbContext,
        string tableName,
        CancellationToken cancellationToken)
    {
        var connection = dbContext.Database.GetDbConnection();
        var shouldClose = connection.State != System.Data.ConnectionState.Open;

        if (shouldClose)
        {
            await connection.OpenAsync(cancellationToken);
        }

        try
        {
            await using var command = connection.CreateCommand();
            command.CommandText = """
                SELECT EXISTS (
                    SELECT 1
                    FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_name = @tableName
                )
                """;

            var parameter = command.CreateParameter();
            parameter.ParameterName = "@tableName";
            parameter.Value = tableName;
            command.Parameters.Add(parameter);

            var result = await command.ExecuteScalarAsync(cancellationToken);
            return result is true || (result is bool exists && exists);
        }
        finally
        {
            if (shouldClose)
            {
                await connection.CloseAsync();
            }
        }
    }
}
