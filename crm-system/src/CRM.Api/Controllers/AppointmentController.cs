using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Dtos.Response;
using CRMSys.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Serilog;
using Shared.AuthN.Common;
using Shared.Dapper.Models;

namespace CRMSys.Api.Controllers
{
    /// <summary>
    /// AppointmentController
    /// </summary>
    [Authorize]
    [ApiController]
    [Route("api/appointments")]
    public class AppointmentController : ControllerBase
    {
        private readonly IAppointmentService _appointmentService;

        /// <summary>
        /// Init AppointmentController
        /// </summary>
        /// <param name="appointmentService"></param>
        public AppointmentController(IAppointmentService appointmentService)
        {
            _appointmentService = appointmentService;
        }

        /// <summary>
        /// GetAppointments
        /// </summary>
        /// <param name="request"></param>
        /// <param name="ct"></param>
        /// <returns></returns>
        [HttpGet]
        public async Task<IActionResult> GetAppointments([FromQuery] AppointmentQueryRequest request, CancellationToken ct = default)
        {
            try
            {
                var result = await _appointmentService.QueryAsync(request, ct);
                return Ok(ApiResponse<PagedResult<AppointmentResponse>>.Ok(result, "Appointments retrieved successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error querying appointments");
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// GetById
        /// </summary>
        /// <param name="id"></param>
        /// <param name="ct"></param>
        /// <returns></returns>
        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetById(long id, CancellationToken ct = default)
        {
            try
            {
                var appointment = await _appointmentService.GetByIdAsync(id, ct);
                if (appointment == null)
                    return NotFound(ApiResponse<string>.Fail($"Appointment with ID {id} was not found"));

                return Ok(ApiResponse<AppointmentResponse>.Ok(appointment, "Appointment retrieved successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error getting appointment by id: {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// GetByMailId
        /// </summary>
        /// <param name="mailId"></param>
        /// <param name="ct"></param>
        /// <returns></returns>
        [HttpGet("by-mail/{mailId}")]
        public async Task<IActionResult> GetByMailId(string mailId, CancellationToken ct = default)
        {
            try
            {
                var appointment = await _appointmentService.GetByMailIdAsync(mailId, ct);
                if (appointment == null)
                    return NotFound(ApiResponse<string>.Fail($"Appointment with MailId {mailId} was not found"));

                return Ok(ApiResponse<AppointmentResponse>.Ok(appointment, "Appointment retrieved successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error getting appointment by mailId: {MailId}", mailId);
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Create
        /// </summary>
        /// <param name="request"></param>
        /// <param name="ct"></param>
        /// <returns></returns>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateAppointmentRequest request, CancellationToken ct = default)
        {
            try
            {
                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var id = await _appointmentService.CreateAsync(request, userEmail, ct);
                return CreatedAtAction(nameof(GetById), new { id }, ApiResponse<long>.Ok(id, "Appointment created successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error creating appointment");
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Update
        /// </summary>
        /// <param name="id"></param>
        /// <param name="request"></param>
        /// <param name="ct"></param>
        /// <returns></returns>
        [HttpPut("{id:long}")]
        public async Task<IActionResult> Update(long id, [FromBody] UpdateAppointmentRequest request, CancellationToken ct = default)
        {
            try
            {
                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var success = await _appointmentService.UpdateAsync(id, request, userEmail, ct);
                if (!success)
                    return NotFound(ApiResponse<string>.Fail($"Appointment with ID {id} was not found"));

                return Ok(ApiResponse<string>.Ok("", "Appointment updated successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error updating appointment with id: {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Delete
        /// </summary>
        /// <param name="id"></param>
        /// <param name="ct"></param>
        /// <returns></returns>
        [HttpDelete("{id:long}")]
        public async Task<IActionResult> Delete(long id, CancellationToken ct = default)
        {
            try
            {
                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var success = await _appointmentService.DeleteAsync(id, userEmail, ct);
                if (!success)
                    return NotFound(ApiResponse<string>.Fail($"Appointment with ID {id} was not found"));

                return Ok(ApiResponse<string>.Ok("", "Appointment deleted successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error deleting appointment with id: {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }
    }
}



