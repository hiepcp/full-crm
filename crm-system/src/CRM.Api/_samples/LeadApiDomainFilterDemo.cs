using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace CRMSys.Api._samples
{
    /// <summary>
    /// Demo API calls for Lead endpoints with Domain Filter
    /// </summary>
    public static class LeadApiDomainFilterDemo
    {
        private static readonly HttpClient _client = new();

        static LeadApiDomainFilterDemo()
        {
            // _client.BaseAddress = new Uri("http://localhost:5000/api/");
            _client.BaseAddress = new Uri("https://crm-api-sandbox.response.com.vn/");
            _client.DefaultRequestHeaders.Accept.Add(new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/json"));
        }

        /// <summary>
        /// GET /api/leads with simple domain filter
        /// </summary>
        public static async Task GetLeadsByStatusAndScore()
        {
            // Domain: status = 'new' AND score >= 70
            var domain = new object[][]
            {
                new object[] { "status", "=", "new" },
                new object[] { "score", ">=", 70 }
            };

            var request = new
            {
                page = 1,
                pageSize = 20,
                domain = domain,
                orderBy = "-createdOn"
            };

            var json = JsonSerializer.Serialize(request);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _client.GetAsync($"leads?{System.Web.HttpUtility.UrlEncode(json)}");
            Console.WriteLine($"Status: {response.StatusCode}");
            var result = await response.Content.ReadAsStringAsync();
            Console.WriteLine(result);
        }

        /// <summary>
        /// GET /api/leads with OR logic domain filter
        /// </summary>
        public static async Task GetLeadsByStatusOrSource()
        {
            // Domain: (status = 'qualified' OR source = 'referral') AND owner_id = 101
            var domain = new object[]
            {
                "|", // OR operator
                new object[] { "status", "=", "qualified" },
                new object[] { "source", "=", "referral" },
                new object[] { "ownerId", "=", 101 }
            };

            var request = new
            {
                page = 1,
                pageSize = 10,
                domain = domain,
                orderBy = "score,-createdOn"
            };

            var json = JsonSerializer.Serialize(request);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _client.PostAsync("leads/search", content); // POST for complex domain
            Console.WriteLine($"Status: {response.StatusCode}");
            var result = await response.Content.ReadAsStringAsync();
            Console.WriteLine(result);
        }

        /// <summary>
        /// GET /api/leads with complex nested domain filter
        /// </summary>
        public static async Task GetLeadsByComplexFilter()
        {
            // Domain: (status IN ['working', 'qualified']) AND (score BETWEEN 60 AND 90)
            // AND (created_on >= '2025-01-01T00:00:00Z') AND is_converted = false
            var domain = new object[][]
            {
                new object[] { "status", "in", new[] { "working", "qualified" } },
                new object[] { "score", "between", new[] { 60, 90 } },
                new object[] { "createdOn", ">=", "2025-01-01T00:00:00Z" },
                new object[] { "isConverted", "=", false }
            };

            var request = new
            {
                page = 1,
                pageSize = 20,
                domain = domain,
                orderBy = "-score,firstName,lastName",
                top = 50
            };

            var json = JsonSerializer.Serialize(request);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _client.PostAsync("leads/search", content);
            Console.WriteLine($"Status: {response.StatusCode}");
            var result = await response.Content.ReadAsStringAsync();
            Console.WriteLine(result);
        }

        /// <summary>
        /// GET /api/leads with LIKE and ILIKE filters
        /// </summary>
        public static async Task GetLeadsByNameAndCompany()
        {
            // Domain: first_name ILIKE '%john%' AND company LIKE '%tech%'
            var domain = new object[][]
            {
                new object[] { "firstName", "icontains", "john" },
                new object[] { "company", "contains", "tech" }
            };

            var request = new
            {
                page = 1,
                pageSize = 15,
                domain = domain,
                orderBy = "company,firstName"
            };

            var json = JsonSerializer.Serialize(request);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _client.GetAsync($"leads?{System.Web.HttpUtility.UrlEncode(json)}");
            Console.WriteLine($"Status: {response.StatusCode}");
            var result = await response.Content.ReadAsStringAsync();
            Console.WriteLine(result);
        }

        /// <summary>
        /// GET /api/leads with NOT and NULL filters
        /// </summary>
        public static async Task GetLeadsNotConverted()
        {
            // Domain: NOT is_converted AND converted_at IS NULL AND owner_id IS NOT NULL
            var domain = new object[]
            {
                "!", new object[] { "isConverted", "=", true },
                new object[] { "convertedAt", "is", null },
                new object[] { "ownerId", "is not", null }
            };

            var request = new
            {
                page = 1,
                pageSize = 25,
                domain = domain,
                orderBy = "-updated_on"
            };

            var json = JsonSerializer.Serialize(request);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _client.PostAsync("leads/search", content);
            Console.WriteLine($"Status: {response.StatusCode}");
            var result = await response.Content.ReadAsStringAsync();
            Console.WriteLine(result);
        }

        /// <summary>
        /// GET /api/leads with domain filter for duplicates
        /// </summary>
        public static async Task GetDuplicateLeads()
        {
            // Domain: is_duplicate = true OR duplicate_of IS NOT NULL
            var domain = new object[]
            {
                "|",
                new object[] { "isDuplicate", "=", true },
                new object[] { "duplicateOf", "is not", null }
            };

            var request = new
            {
                page = 1,
                pageSize = 10,
                domain = domain,
                orderBy = "-createdOn"
            };

            var json = JsonSerializer.Serialize(request);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _client.GetAsync($"leads?{System.Web.HttpUtility.UrlEncode(JsonSerializer.Serialize(request))}");
            Console.WriteLine($"Status: {response.StatusCode}");
            var result = await response.Content.ReadAsStringAsync();
            Console.WriteLine(result);
        }

        /// <summary>
        /// Example of POST /api/leads with domain filter in body
        /// </summary>
        public static async Task PostLeadsSearchWithDomain()
        {
            var domain = new object[][]
            {
                new object[] { "status", "=", "new" },
                new object[] { "source", "in", new[] { "web", "referral" } },
                new object[] { "score", ">=", 50 }
            };

            var requestBody = new
            {
                page = 1,
                pageSize = 20,
                domain = domain,
                orderBy = "score,-createdOn",
                top = 100
            };

            var json = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _client.PostAsync("leads/search", content);
            Console.WriteLine($"Status: {response.StatusCode}");
            var result = await response.Content.ReadAsStringAsync();
            Console.WriteLine(result);
        }
    }
}
