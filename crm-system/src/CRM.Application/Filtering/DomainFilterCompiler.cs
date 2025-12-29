using System;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace CRMSys.Application.Filtering
{
    public sealed class DomainFilterCompiler : IDomainFilterCompiler
    {
        private sealed class Ctx
        {
            public int ParamIndex = 0;
            public readonly Dictionary<string, object?> Parameters = new();
            public readonly HashSet<string> ReferencedFields = new(StringComparer.OrdinalIgnoreCase);
            public required ISet<string> AllowedFields { get; init; }
            public IDictionary<string, string>? FieldToColumnMap { get; init; }

            public string NextParam(object? value)
            {
                var name = $"p{++ParamIndex}";
                Parameters[name] = value;
                return name;
            }

            public string ResolveColumn(string field)
            {
                if (!AllowedFields.Contains(field))
                    throw new InvalidOperationException($"Field not allowed in domain: {field}");
                ReferencedFields.Add(field);
                if (FieldToColumnMap != null && FieldToColumnMap.TryGetValue(field, out var mapped))
                    return mapped;
                return field; // assume field equals column name by default
            }
        }

        public DomainFilterResult Compile(object? domainExpression, ISet<string> allowedFields, IDictionary<string, string>? fieldToColumnMap = null)
        {
            if (allowedFields == null || allowedFields.Count == 0)
                throw new ArgumentException("allowedFields must not be empty");

            var ctx = new Ctx { AllowedFields = allowedFields, FieldToColumnMap = fieldToColumnMap };

            if (domainExpression is null)
                return new DomainFilterResult("", ctx.Parameters, ctx.ReferencedFields);

            var node = ToJsonNode(domainExpression);
            var sql = CompileNode(node, ctx);
            var where = string.IsNullOrWhiteSpace(sql) ? "" : $"({sql})";
            return new DomainFilterResult(where, ctx.Parameters, ctx.ReferencedFields);
        }

        private static JsonNode ToJsonNode(object domainExpression)
        {
            if (domainExpression is JsonNode jn) return jn;
            if (domainExpression is string s)
            {
                return JsonNode.Parse(s) ?? throw new ArgumentException("Invalid JSON for domain");
            }
            // Fallback: serialize POCO to JSON then parse
            var json = JsonSerializer.Serialize(domainExpression);
            return JsonNode.Parse(json) ?? throw new ArgumentException("Invalid domain expression");
        }

        private static string CompileNode(JsonNode? node, Ctx ctx)
        {
            if (node is null) return string.Empty;

            if (node is JsonArray arr)
            {
                // Prefix operators: "|" (OR), "!" (NOT). Optional "&" for explicit AND.
                if (arr.Count == 0) return string.Empty;

                // Condition: [field, op, value]
                if (arr.Count == 3 && arr[0] is JsonValue && arr[1] is JsonValue)
                {
                    var field = arr[0]!.GetValue<string>();
                    var op = arr[1]!.GetValue<string>();
                    var valueNode = arr[2];
                    return CompileCondition(field, op, valueNode, ctx);
                }

                // Group OR: ["|", condA, condB]
                if (arr[0] is JsonValue v0)
                {
                    var tag = v0.GetValue<string>();
                    if (tag == "|")
                    {
                        var parts = arr.Skip(1).Select(n => CompileNode(n, ctx)).Where(s => !string.IsNullOrWhiteSpace(s)).ToArray();
                        return parts.Length == 0 ? string.Empty : $"({string.Join(" OR ", parts)})";
                    }
                    if (tag == "!")
                    {
                        var part = arr.Count > 1 ? CompileNode(arr[1], ctx) : string.Empty;
                        return string.IsNullOrWhiteSpace(part) ? string.Empty : $"(NOT ({part}))";
                    }
                    if (tag == "&")
                    {
                        var parts = arr.Skip(1).Select(n => CompileNode(n, ctx)).Where(s => !string.IsNullOrWhiteSpace(s)).ToArray();
                        return parts.Length == 0 ? string.Empty : $"({string.Join(" AND ", parts)})";
                    }
                }

                // Default AND over elements
                var andParts = arr.Select(n => CompileNode(n, ctx)).Where(s => !string.IsNullOrWhiteSpace(s)).ToArray();
                return andParts.Length == 0 ? string.Empty : $"({string.Join(" AND ", andParts)})";
            }

            throw new ArgumentException("Domain node must be an array for conditions or groups");
        }

        private static string CompileCondition(string field, string op, JsonNode? valueNode, Ctx ctx)
        {
            var column = ctx.ResolveColumn(field);
            var opLower = op.Trim().ToLowerInvariant();

            switch (opLower)
            {
                case "=":
                case "!=":
                case "<":
                case ">":
                case "<=":
                case ">=":
                {
                    var p = ctx.NextParam(ValueFrom(valueNode));
                    var sqlOp = opLower == "!=" ? "<>" : opLower;
                    return $"{column} {sqlOp} @{p}";
                }
                case "is":
                case "is not":
                {
                    if (valueNode is null || valueNode.GetValueKind() == JsonValueKind.Null)
                    {
                        return opLower == "is" ? $"{column} IS NULL" : $"{column} IS NOT NULL";
                    }
                    // allow boolean IS TRUE/IS FALSE
                    var val = ValueFrom(valueNode);
                    if (val is bool b)
                    {
                        return opLower == "is" ? $"{column} IS {(b ? "TRUE" : "FALSE")}" : $"{column} IS NOT {(b ? "TRUE" : "FALSE")}";
                    }
                    throw new ArgumentException("Operator 'is' expects null or boolean");
                }
                case "in":
                case "not in":
                {
                    var list = EnsureArray(valueNode, requireNonEmpty: false);
                    if (list.Count == 0)
                    {
                        // empty IN set should be false/true depending on polarity
                        return opLower == "in" ? "(1=0)" : "(1=1)";
                    }
                    var p = ctx.NextParam(list);
                    return opLower == "in" ? $"{column} IN @{p}" : $"{column} NOT IN @{p}";
                }
                case "between":
                {
                    var list = EnsureArray(valueNode, requireNonEmpty: true);
                    if (list.Count != 2) throw new ArgumentException("between expects [min,max]");
                    var p1 = ctx.NextParam(list[0]);
                    var p2 = ctx.NextParam(list[1]);
                    return $"{column} BETWEEN @{p1} AND @{p2}";
                }
                case "like":
                case "startswith":
                case "endswith":
                case "contains":
                {
                    var raw = Convert.ToString(ValueFrom(valueNode), CultureInfo.InvariantCulture) ?? string.Empty;
                    var pattern = opLower switch
                    {
                        "like" => raw,
                        "startswith" => raw + "%",
                        "endswith" => "%" + raw,
                        _ => "%" + raw + "%"
                    };
                    var p = ctx.NextParam(pattern);
                    return $"{column} LIKE @{p}";
                }
                case "ilike":
                case "istartswith":
                case "iendswith":
                case "icontains":
                {
                    var raw = Convert.ToString(ValueFrom(valueNode), CultureInfo.InvariantCulture) ?? string.Empty;
                    var pattern = opLower switch
                    {
                        "ilike" => raw,
                        "istartswith" => raw + "%",
                        "iendswith" => "%" + raw,
                        _ => "%" + raw + "%"
                    };
                    var p = ctx.NextParam(pattern);
                    return $"LOWER({column}) LIKE LOWER(@{p})";
                }
                default:
                    throw new ArgumentException($"Unsupported operator: {op}");
            }
        }

        private static object? ValueFrom(JsonNode? node)
        {
            if (node is null) return null;
            if (node is JsonValue jv)
            {
                var kind = jv.GetValueKind();
                return kind switch
                {
                    JsonValueKind.String => jv.GetValue<string>(),
                    JsonValueKind.Number => jv.TryGetValue<long>(out var l) ? l : jv.GetValue<decimal>(),
                    JsonValueKind.True => true,
                    JsonValueKind.False => false,
                    JsonValueKind.Null => null,
                    _ => jv.ToJsonString()
                };
            }
            if (node is JsonArray)
            {
                // handled elsewhere when needed
                return node.AsArray().Select(ValueFrom).ToList();
            }
            return node.ToJsonString();
        }

        private static List<object?> EnsureArray(JsonNode? node, bool requireNonEmpty)
        {
            var list = new List<object?>();
            if (node is JsonArray arr)
            {
                foreach (var item in arr)
                {
                    list.Add(ValueFrom(item));
                }
            }
            else if (node is JsonValue)
            {
                list.Add(ValueFrom(node));
            }

            if (requireNonEmpty && list.Count == 0)
                throw new ArgumentException("Expected non-empty array");

            return list;
        }
    }
}


