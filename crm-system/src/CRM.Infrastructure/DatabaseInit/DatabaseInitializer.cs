using System.Data;
using Dapper;
using MySql.Data.MySqlClient;
using Microsoft.Extensions.Configuration;
using Serilog;

namespace CRMSys.Infrastructure.DatabaseInit;

public class DatabaseInitializer
{
    private readonly string _connectionString;
    private readonly string _databaseName;

    public DatabaseInitializer(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
                           ?? throw new InvalidOperationException("DefaultConnection not found in appsettings.json");

        var builder = new MySqlConnectionStringBuilder(_connectionString);
        _databaseName = builder.Database;
    }

    private IDbConnection CreateConnection(bool includeDatabase = true)
    {
        if (includeDatabase)
            return new MySqlConnection(_connectionString);

        var builder = new MySqlConnectionStringBuilder(_connectionString)
        {
            Database = ""
        };
        return new MySqlConnection(builder.ConnectionString);
    }

    public async Task InitializeAsync()
    {
        Log.Information("?? Checking database existence...");
        if (await DatabaseExistsAsync())
        {
            Log.Warning($"? Database '{_databaseName}' already exists. Skipping initialization.");
            return;
        }

        Log.Information($"??? Initializing database '{_databaseName}'...");
        await InitDatabase();
        await InitTables();
        await InitProcedures();
        Log.Information("?? Database initialization CRMeted successfully.");
    }

    private async Task<bool> DatabaseExistsAsync()
    {
        using var connection = CreateConnection(includeDatabase: false);
        var sql = "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = @dbName;";
        var result = await connection.QueryFirstOrDefaultAsync<string>(sql, new { dbName = _databaseName });
        return result != null;
    }

    private async Task InitDatabase()
    {
        using var connection = CreateConnection(includeDatabase: false);
        var sql = $"CREATE DATABASE IF NOT EXISTS `{_databaseName}`;";
        await connection.ExecuteAsync(sql);
        Log.Information($"? Database '{_databaseName}' created or already exists.");
    }

    private async Task InitTables()
    {
        using var connection = CreateConnection();
        var sqlFolderPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Sqls/Tables");

        if (!Directory.Exists(sqlFolderPath))
        {
            Log.Warning("?? No table scripts found.");
            return;
        }

        foreach (var file in Directory.GetFiles(sqlFolderPath, "*.sql"))
        {
            try
            {
                var sql = await File.ReadAllTextAsync(file);
                await connection.ExecuteAsync(sql);
                Log.Information($"?? Executed table script: {Path.GetFileName(file)}");
            }
            catch (Exception ex)
            {
                Log.Error($"? Error executing {Path.GetFileName(file)}: {ex.Message}");
            }
        }
    }

    private async Task InitProcedures()
    {
        using var connection = CreateConnection();
        var sqlFolderPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Sqls/Procedures");

        if (!Directory.Exists(sqlFolderPath))
        {
            Log.Error("?? No procedure scripts found.");
            return;
        }

        foreach (var file in Directory.GetFiles(sqlFolderPath, "*.sql"))
        {
            try
            {
                var sql = await File.ReadAllTextAsync(file);
                sql = FixDelimiter(sql);
                await connection.ExecuteAsync(sql);
                Log.Information($"?? Executed procedure script: {Path.GetFileName(file)}");
            }
            catch (Exception ex)
            {
                Log.Error($"? Error executing {Path.GetFileName(file)}: {ex.Message}");
            }
        }
    }

    private string FixDelimiter(string script)
    {
        return script.Replace("DELIMITER //", "")
                     .Replace("DELIMITER ;", "")
                     .Replace("//", ";");
    }
}
