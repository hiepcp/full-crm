namespace CRM.Api.Utils
{
    /// <summary>
    /// ApiResponse
    /// </summary>
    /// <typeparam name="T"></typeparam>
    public class ApiResponse<T>
    {
        /// <summary>
        /// Success
        /// </summary>
        public bool Success { get; set; }

        /// <summary>
        /// Message
        /// </summary>
        public string? Message { get; set; }

        /// <summary>
        /// Data
        /// </summary>
        public T? Data { get; set; }

        /// <summary>
        /// Ok
        /// </summary>
        /// <param name="data"></param>
        /// <param name="message"></param>
        /// <returns></returns>
        public static ApiResponse<T> Ok(T data, string? message = null) =>
            new() { Success = true, Data = data, Message = message };

        /// <summary>
        /// Fail
        /// </summary>
        /// <param name="message"></param>
        /// <returns></returns>
        public static ApiResponse<T> Fail(string message) =>
            new() { Success = false, Message = message };
    }
}
