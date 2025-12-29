using CRMSys.Domain.Dynamics;
using Shared.Dapper.Models;

namespace CRMSys.Application.Utils
{
    public class ODataFilterBuilder
    {
        private readonly RSVNModelBase _model;
        private readonly List<string> _filterConditions = new();

        public ODataFilterBuilder(RSVNModelBase model)
        {
            _model = model;
        }

        private string CapitalizeFirstLetter(string input)
        {
            if (string.IsNullOrEmpty(input))
                return input;

            return char.ToUpper(input[0]) + input.Substring(1);
        }

        public ODataFilterBuilder AddFilter(string fieldName, string operatorType, string value)
        {
            // Capitalize first letter of fieldName
            var normalizedFieldName = CapitalizeFirstLetter(fieldName);

            // Validate field name
            if (!_model.FilterableFields.ContainsKey(normalizedFieldName))
            {
                throw new ArgumentException($"Field '{normalizedFieldName}' is not filterable for {_model.EntityName}");
            }

            var d365FieldName = _model.FilterableFields[normalizedFieldName];

            // Build filter condition based on operator
            string condition = operatorType.ToLower() switch
            {
                "eq" => $"{d365FieldName} eq '*{value}*'",
                "ne" => $"{d365FieldName} ne '{value}'",
                "gt" => $"{d365FieldName} gt '{value}'",
                "lt" => $"{d365FieldName} lt '{value}'",
                "ge" => $"{d365FieldName} ge '{value}'",
                "le" => $"{d365FieldName} le '{value}'",
                "contains" => $"contains({d365FieldName}, '{value}')",
                "startswith" => $"startswith({d365FieldName}, '{value}')",
                "endswith" => $"endswith({d365FieldName}, '{value}')",
                _ => throw new ArgumentException($"Unsupported operator: {operatorType}")
            };

            _filterConditions.Add(condition);
            return this;
        }

        public ODataFilterBuilder AddFilters(List<FilterRequest> filters)
        {
            foreach (var filter in filters)
            {
                AddFilter(filter.Column, filter.Operator, filter.Value!.ToString()!);
            }
            return this;
        }

        public ODataFilterBuilder AddOrConditions(string fieldName, List<string> values)
        {
            // Capitalize first letter of fieldName
            var normalizedFieldName = CapitalizeFirstLetter(fieldName);

            if (!_model.FilterableFields.ContainsKey(normalizedFieldName))
            {
                throw new ArgumentException($"Field '{normalizedFieldName}' is not filterable");
            }

            var d365FieldName = _model.FilterableFields[normalizedFieldName];
            var orConditions = values.Select(v => $"{d365FieldName} eq '{v}'");
            var combinedCondition = $"({string.Join(" or ", orConditions)})";

            _filterConditions.Add(combinedCondition);
            return this;
        }

        public string Build(string logicalOperator = "and")
        {
            if (!_filterConditions.Any())
                return string.Empty;

            return string.Join($" {logicalOperator} ", _filterConditions);
        }
    }
}