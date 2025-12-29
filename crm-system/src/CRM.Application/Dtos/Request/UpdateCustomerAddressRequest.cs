using System.ComponentModel.DataAnnotations;

namespace CRMSys.Application.Dtos.Request
{
    /// <summary>
    /// Request DTO for updating an existing CustomerAddress
    /// All properties are optional - only provided fields will be updated
    /// </summary>
    public class UpdateCustomerAddressRequest
    {
        // === Updatable Fields (all optional) ===
        [RegularExpression("^(legal|delivery|forwarder|forwarder_agent_asia|other)$",
            ErrorMessage = "AddressType must be one of: legal, delivery, forwarder, forwarder_agent_asia, other")]
        public string? AddressType { get; set; }

        [StringLength(255, ErrorMessage = "Company name cannot exceed 255 characters")]
        public string? CompanyName { get; set; }

        public string? AddressLine { get; set; }

        [StringLength(32, ErrorMessage = "Postcode cannot exceed 32 characters")]
        public string? Postcode { get; set; }

        [StringLength(128, ErrorMessage = "City cannot exceed 128 characters")]
        public string? City { get; set; }

        [StringLength(3, ErrorMessage = "Country code must be 3 characters")]
        public string? Country { get; set; }

        [StringLength(255, ErrorMessage = "Contact person cannot exceed 255 characters")]
        public string? ContactPerson { get; set; }

        [EmailAddress(ErrorMessage = "Invalid email format")]
        [StringLength(320, ErrorMessage = "Email cannot exceed 320 characters")]
        public string? Email { get; set; }

        [Phone(ErrorMessage = "Invalid telephone number format")]
        [StringLength(64, ErrorMessage = "Telephone No cannot exceed 64 characters")]
        public string? TelephoneNo { get; set; }

        [StringLength(255, ErrorMessage = "Port of destination cannot exceed 255 characters")]
        public string? PortOfDestination { get; set; }

        public bool? IsPrimary { get; set; }

        // === Helper Properties ===
        public bool HasChanges()
        {
            return AddressType != null ||
                   CompanyName != null ||
                   AddressLine != null ||
                   Postcode != null ||
                   City != null ||
                   Country != null ||
                   ContactPerson != null ||
                   Email != null ||
                   TelephoneNo != null ||
                   PortOfDestination != null ||
                   IsPrimary != null;
        }

        public int ChangesCount()
        {
            int count = 0;
            if (AddressType != null) count++;
            if (CompanyName != null) count++;
            if (AddressLine != null) count++;
            if (Postcode != null) count++;
            if (City != null) count++;
            if (Country != null) count++;
            if (ContactPerson != null) count++;
            if (Email != null) count++;
            if (TelephoneNo != null) count++;
            if (PortOfDestination != null) count++;
            if (IsPrimary != null) count++;
            return count;
        }
    }
}
