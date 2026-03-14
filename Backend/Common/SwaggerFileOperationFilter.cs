using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace RMS.Common;

public class SwaggerFileOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var formParameters = context.ApiDescription.ParameterDescriptions
            .Where(parameter => parameter.Source == BindingSource.Form || parameter.Source == BindingSource.FormFile)
            .ToList();

        if (!formParameters.Any())
            return;

        var schemaProperties = new Dictionary<string, OpenApiSchema>();
        var requiredProperties = new HashSet<string>();

        foreach (var parameter in formParameters)
        {
            var parameterType = parameter.Type;
            var parameterName = parameter.Name;

            if (parameterType == typeof(IFormFile))
            {
                schemaProperties[parameterName] = new OpenApiSchema
                {
                    Type = "string",
                    Format = "binary"
                };
            }
            else if (typeof(IEnumerable<IFormFile>).IsAssignableFrom(parameterType))
            {
                schemaProperties[parameterName] = new OpenApiSchema
                {
                    Type = "array",
                    Items = new OpenApiSchema
                    {
                        Type = "string",
                        Format = "binary"
                    }
                };
            }
            else
            {
                schemaProperties[parameterName] = context.SchemaGenerator.GenerateSchema(parameterType, context.SchemaRepository);
            }

            if (parameter.IsRequired)
                requiredProperties.Add(parameterName);
        }

        operation.Parameters = operation.Parameters
            .Where(parameter => formParameters.All(formParameter => formParameter.Name != parameter.Name))
            .ToList();

        operation.RequestBody = new OpenApiRequestBody
        {
            Required = true,
            Content = new Dictionary<string, OpenApiMediaType>
            {
                ["multipart/form-data"] = new OpenApiMediaType
                {
                    Schema = new OpenApiSchema
                    {
                        Type = "object",
                        Properties = schemaProperties,
                        Required = requiredProperties
                    }
                }
            }
        };
    }
}