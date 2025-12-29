using MySql.Data.MySqlClient;
using Microsoft.Extensions.Configuration;
using System.Data;

namespace ResAuthZApi.Infrastructure.Database
{
    public class MySqlConnectionFactory
    {
        private readonly string _conn;
        public MySqlConnectionFactory(string conn) => _conn = conn;
        public IDbConnection Create() => new MySqlConnection(_conn);
    }
}
