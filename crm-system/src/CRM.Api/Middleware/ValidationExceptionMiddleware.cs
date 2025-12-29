using Shared.AuthN.Common;

namespace CRMSys.Api.Middleware
{
    /// <summary>
    /// ValidationExceptionMiddleware
    /// </summary>
    public class ValidationExceptionMiddleware
    {
        private readonly RequestDelegate _next;

        /// <summary>
        /// Init ValidationExceptionMiddleware
        /// </summary>
        /// <param name="next"></param>
        public ValidationExceptionMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        /// <summary>
        /// InvokeAsync
        /// </summary>
        /// <param name="context"></param>
        /// <returns></returns>
        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (FluentValidation.ValidationException ex)
            {
                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                context.Response.ContentType = "application/json";

                var errors = ex.Errors.Select(e => e.ErrorMessage).ToList();

                var response = ApiResponse<string>.Fail(string.Join("; ", errors));

                await context.Response.WriteAsJsonAsync(response);
            }
            catch (KeyNotFoundException ex)
            {
                context.Response.StatusCode = StatusCodes.Status404NotFound;
                context.Response.ContentType = "application/json";

                var response = ApiResponse<string>.Fail(ex.Message);

                await context.Response.WriteAsJsonAsync(response);
            }
        }
    }
}
