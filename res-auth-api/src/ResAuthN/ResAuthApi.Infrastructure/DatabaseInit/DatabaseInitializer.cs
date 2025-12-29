using Dapper;
using Microsoft.Extensions.Configuration;
using MySql.Data.MySqlClient;
using System.Data;

namespace ResAuthApi.Infrastructure.DatabaseInit;

public class DatabaseInitializer
{
    private readonly string _connectionString;
    private readonly string _databaseName;

    public DatabaseInitializer(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
                           ?? throw new InvalidOperationException("DefaultConnection not found in appsettings.json");

        // Parse database name from connection string
        var builder = new MySqlConnectionStringBuilder(_connectionString);
        _databaseName = builder.Database;
    }

    private IDbConnection CreateConnection(bool includeDatabase = true)
    {
        if (includeDatabase)
        {
            return new MySqlConnection(_connectionString);
        }

        // Nếu chưa tạo database, bỏ phần Database trong connection string
        var builder = new MySqlConnectionStringBuilder(_connectionString)
        {
            Database = ""
        };
        return new MySqlConnection(builder.ConnectionString);
    }

    public async Task InitializeAsync()
    {
        await InitDatabase();
        await InitTables();
        await InitProcedures();
    }

    private async Task InitDatabase()
    {
        using var connection = CreateConnection(includeDatabase: false);
        var sql = $"CREATE DATABASE IF NOT EXISTS `{_databaseName}`;";
        await connection.ExecuteAsync(sql);
    }

    private async Task InitTables()
    {
        using var connection = CreateConnection();
        var sqlFolderPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Sqls/Tables");

        if (!Directory.Exists(sqlFolderPath)) return;

        foreach (var file in Directory.GetFiles(sqlFolderPath, "*.sql"))
        {
            try
            {
                var sql = await File.ReadAllTextAsync(file);
                await connection.ExecuteAsync(sql);
                Console.WriteLine($"Executed table script: {Path.GetFileName(file)}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error executing {Path.GetFileName(file)}: {ex.Message}");
            }
        }
    }

    private async Task InitProcedures()
    {
        using var connection = CreateConnection();
        var sqlFolderPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Sqls/Procedures");

        if (!Directory.Exists(sqlFolderPath)) return;

        foreach (var file in Directory.GetFiles(sqlFolderPath, "*.sql"))
        {
            try
            {
                var sql = await File.ReadAllTextAsync(file);
                sql = FixDelimiter(sql);
                await connection.ExecuteAsync(sql);
                Console.WriteLine($"Executed procedure script: {Path.GetFileName(file)}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error executing {Path.GetFileName(file)}: {ex.Message}");
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

