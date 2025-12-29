using System.Text.Json.Serialization;

namespace CRMSys.Domain.Dynamics
{
    /// <summary>
    /// RSVNCustTableEntities - Dynamics 365 Customer Table Entity
    /// Represents customers from Dynamics 365 Finance & Operations
    /// Based on actual OData response structure
    /// </summary>
    public class RSVNCustTableEntities : RSVNModelBase
    {
        [JsonIgnore]
        public override int ModelType => 2;
        
        [JsonIgnore]
        public override string EntityName => "RSVNCustTableEntities";
        
        [JsonIgnore]
        public override Dictionary<string, string> FilterableFields => new()
        {
            { "AccountNum", "AccountNum" },
            { "Name", "Name" },
            { "CustGroup", "CustGroup" },
            { "CustClassificationId", "CustClassificationId" },
            { "VATNum", "VATNum" },
            { "PartyCountry", "PartyCountry" },
            { "Currency", "Currency" },
            { "Blocked", "Blocked" },
            { "DataAreaId", "dataAreaId" }
        };

        // === Core Identity Fields ===
        
        /// <summary>
        /// Data Area ID (Company identifier)
        /// </summary>
        public string? dataAreaId { get; set; }

        /// <summary>
        /// Customer Account Number (Primary identifier)
        /// </summary>
        public string? AccountNum { get; set; }

        /// <summary>
        /// Customer Name
        /// </summary>
        public string? Name { get; set; }

        /// <summary>
        /// Name Alias
        /// </summary>
        public string? NameAlias { get; set; }

        /// <summary>
        /// Party Number
        /// </summary>
        public string? PartyNumber { get; set; }

        /// <summary>
        /// Party Type (Organization, Person, etc.)
        /// </summary>
        public string? PartyType { get; set; }

        // === Customer Classification ===
        
        /// <summary>
        /// Customer Group
        /// </summary>
        public string? CustGroup { get; set; }

        /// <summary>
        /// Customer Classification ID
        /// </summary>
        public string? CustClassificationId { get; set; }

        /// <summary>
        /// Customer Status (Blocked: Yes/No)
        /// </summary>
        public string? Blocked { get; set; }

        /// <summary>
        /// One-time Customer flag
        /// </summary>
        public string? OneTimeCustomer { get; set; }

        // === Geographic Information ===
        
        /// <summary>
        /// Party Country/Region
        /// </summary>
        public string? PartyCountry { get; set; }

        /// <summary>
        /// Party State
        /// </summary>
        public string? PartyState { get; set; }

        // === Financial Information ===
        
        /// <summary>
        /// Currency Code
        /// </summary>
        public string? Currency { get; set; }

        /// <summary>
        /// VAT Number
        /// </summary>
        public string? VATNum { get; set; }

        /// <summary>
        /// Credit Maximum Amount
        /// </summary>
        public decimal? CreditMax { get; set; }

        /// <summary>
        /// Credit Rating
        /// </summary>
        public string? CreditRating { get; set; }

        /// <summary>
        /// Mandatory Credit Limit
        /// </summary>
        public string? MandatoryCreditLimit { get; set; }

        // === Payment Terms ===
        
        /// <summary>
        /// Payment Terms ID
        /// </summary>
        public string? PaymTermId { get; set; }

        /// <summary>
        /// Payment Mode
        /// </summary>
        public string? PaymMode { get; set; }

        /// <summary>
        /// Payment Specification
        /// </summary>
        public string? PaymSpec { get; set; }

        /// <summary>
        /// Payment Day ID
        /// </summary>
        public string? PaymDayId { get; set; }

        /// <summary>
        /// Payment Schedule
        /// </summary>
        public string? PaymSched { get; set; }

        /// <summary>
        /// Payment ID Type
        /// </summary>
        public string? PaymIdType { get; set; }

        /// <summary>
        /// Cash Discount
        /// </summary>
        public string? CashDisc { get; set; }

        /// <summary>
        /// Use Cash Discount
        /// </summary>
        public string? UseCashDisc { get; set; }

        /// <summary>
        /// Cash Discount Base Days
        /// </summary>
        public int? CashDiscBaseDays { get; set; }

        // === Delivery Information ===
        
        /// <summary>
        /// Delivery Terms
        /// </summary>
        public string? DlvTerm { get; set; }

        /// <summary>
        /// Delivery Mode
        /// </summary>
        public string? DlvMode { get; set; }

        /// <summary>
        /// Delivery Reason
        /// </summary>
        public string? DlvReason { get; set; }

        /// <summary>
        /// Freight Zone
        /// </summary>
        public string? FreightZone { get; set; }

        // === Shipping Information ===
        
        /// <summary>
        /// Ship Carrier ID
        /// </summary>
        public string? ShipCarrierId { get; set; }

        /// <summary>
        /// Ship Carrier Account
        /// </summary>
        public string? ShipCarrierAccount { get; set; }

        /// <summary>
        /// Ship Carrier Account Code
        /// </summary>
        public string? ShipCarrierAccountCode { get; set; }

        /// <summary>
        /// Ship Carrier Blind Shipment
        /// </summary>
        public string? ShipCarrierBlindShipment { get; set; }

        /// <summary>
        /// Ship Carrier Fuel Surcharge
        /// </summary>
        public string? ShipCarrierFuelSurcharge { get; set; }

        // === RSVN Custom Fields ===
        
        /// <summary>
        /// RSVN Place of Delivery
        /// </summary>
        public string? RsVnPlaceofdel { get; set; }

        /// <summary>
        /// RSVN Assembly Instruction
        /// </summary>
        public string? RsVnAssemblyInstruction { get; set; }

        /// <summary>
        /// RSVN Notifying Party
        /// </summary>
        public string? RsVnNotifyingParty { get; set; }

        /// <summary>
        /// RSVN Consignee
        /// </summary>
        public string? RsVnConsignee { get; set; }

        /// <summary>
        /// RSVN Documents Needed
        /// </summary>
        public string? RsVnDocumentsneeded { get; set; }

        /// <summary>
        /// RSVN Booking Agent in Vietnam
        /// </summary>
        public string? RsVnBookingagentinVietnam { get; set; }

        /// <summary>
        /// RSVN Inspection - QC Demands
        /// </summary>
        public string? RsVnInspection_QCDemands { get; set; }

        /// <summary>
        /// RSVN Inspection Details
        /// </summary>
        public string? RsVnInspectionDetails { get; set; }

        /// <summary>
        /// RSVN Shipping Mark
        /// </summary>
        public string? RsVnShippingmark { get; set; }

        /// <summary>
        /// RSVN Required Tests
        /// </summary>
        public string? RsVnRequiredTests { get; set; }

        /// <summary>
        /// RSVN FR
        /// </summary>
        public string? RSVN_FR { get; set; }

        /// <summary>
        /// RSVN Internal Inspection
        /// </summary>
        public string? RSVNInternalinspection { get; set; }

        /// <summary>
        /// RSVN Sales Order Comment
        /// </summary>
        public string? RSVNSoComment { get; set; }

        /// <summary>
        /// RSVN Sales Responsible
        /// </summary>
        public string? RSVNSalesResponsible { get; set; }

        /// <summary>
        /// RSVN Penalty
        /// </summary>
        public string? RSVNPenalty { get; set; }

        /// <summary>
        /// RSVN 3rd Party Inspection
        /// </summary>
        public string? RSVN3rdinspection { get; set; }

        // === VTV Custom Fields ===
        
        /// <summary>
        /// VTV Customer Inspection Company
        /// </summary>
        public string? VtvCustInspectionCompany { get; set; }

        /// <summary>
        /// VTV Sales Order Forwarder
        /// </summary>
        public string? VtvSOForwarder { get; set; }

        /// <summary>
        /// VTV Customer Special Notes
        /// </summary>
        public string? VtvCustSpecialNotes { get; set; }

        // === Account References ===
        
        /// <summary>
        /// Invoice Account
        /// </summary>
        public string? InvoiceAccount { get; set; }

        /// <summary>
        /// Invoice Address Type
        /// </summary>
        public string? InvoiceAddress { get; set; }

        /// <summary>
        /// Vendor Account
        /// </summary>
        public string? VendAccount { get; set; }

        /// <summary>
        /// Our Account Number
        /// </summary>
        public string? OurAccountNum { get; set; }

        // === Grouping and Classification ===
        
        /// <summary>
        /// Sales Group
        /// </summary>
        public string? SalesGroup { get; set; }

        /// <summary>
        /// Sales District ID
        /// </summary>
        public string? SalesDistrictId { get; set; }

        /// <summary>
        /// Sales Pool ID
        /// </summary>
        public string? SalesPoolId { get; set; }

        /// <summary>
        /// Line of Business ID
        /// </summary>
        public string? LineOfBusinessId { get; set; }

        /// <summary>
        /// Segment ID
        /// </summary>
        public string? SegmentId { get; set; }

        /// <summary>
        /// Subsegment ID
        /// </summary>
        public string? SubsegmentId { get; set; }

        /// <summary>
        /// Statistics Group
        /// </summary>
        public string? StatisticsGroup { get; set; }

        /// <summary>
        /// Commission Group
        /// </summary>
        public string? CommissionGroup { get; set; }

        /// <summary>
        /// Price Group
        /// </summary>
        public string? PriceGroup { get; set; }

        /// <summary>
        /// Line Discount
        /// </summary>
        public string? LineDisc { get; set; }

        /// <summary>
        /// Markup Group
        /// </summary>
        public string? MarkupGroup { get; set; }

        // === Inventory and Location ===
        
        /// <summary>
        /// Inventory Location
        /// </summary>
        public string? InventLocation { get; set; }

        /// <summary>
        /// Inventory Site ID
        /// </summary>
        public string? InventSiteId { get; set; }

        /// <summary>
        /// Customer Item Group ID
        /// </summary>
        public string? CustItemGroupId { get; set; }

        /// <summary>
        /// Supplementary Item Group ID
        /// </summary>
        public string? SuppItemGroupId { get; set; }

        // === Tax Information ===
        
        /// <summary>
        /// Tax Group
        /// </summary>
        public string? TaxGroup { get; set; }

        /// <summary>
        /// Tax License Number
        /// </summary>
        public string? TaxLicenseNum { get; set; }

        /// <summary>
        /// VAT Number Table Type
        /// </summary>
        public string? VATNumTableType { get; set; }

        /// <summary>
        /// Override Sales Tax
        /// </summary>
        public string? OverrideSalesTax { get; set; }

        // === Electronic Invoice ===
        
        /// <summary>
        /// Electronic Invoice Enabled
        /// </summary>
        public string? EInvoice { get; set; }

        /// <summary>
        /// Electronic Invoice Attachment
        /// </summary>
        public string? EInvoiceAttachment { get; set; }

        /// <summary>
        /// Electronic Invoice EAN Number
        /// </summary>
        public string? EinvoiceEANNum { get; set; }

        // === Collections and Charges ===
        
        /// <summary>
        /// Collection Letter Code
        /// </summary>
        public string? CollectionLetterCode { get; set; }

        /// <summary>
        /// Customer Exclude Collection Fee
        /// </summary>
        public string? CustExcludeCollectionFee { get; set; }

        /// <summary>
        /// Customer Exclude Interest Charges
        /// </summary>
        public string? CustExcludeInterestCharges { get; set; }

        /// <summary>
        /// Account Statement Frequency
        /// </summary>
        public string? AccountStatement { get; set; }

        // === Contact and Identification ===
        
        /// <summary>
        /// Contact Person ID
        /// </summary>
        public string? ContactPersonId { get; set; }

        /// <summary>
        /// Identification Number
        /// </summary>
        public string? IdentificationNumber { get; set; }

        /// <summary>
        /// Organization ID
        /// </summary>
        public string? OrgId { get; set; }

        /// <summary>
        /// Company Chain ID
        /// </summary>
        public string? CompanyChainId { get; set; }

        /// <summary>
        /// Company ID SIRET
        /// </summary>
        public string? CompanyIdSiret { get; set; }

        // === Credit Card Information ===
        
        /// <summary>
        /// Credit Card Address Verification
        /// </summary>
        public string? CreditCardAddressVerification { get; set; }

        /// <summary>
        /// Credit Card Address Verification Level
        /// </summary>
        public string? CreditCardAddressVerificationLevel { get; set; }

        /// <summary>
        /// Credit Card Address Verification Void
        /// </summary>
        public string? CreditCardAddressVerificationVoid { get; set; }

        /// <summary>
        /// Credit Card CVC
        /// </summary>
        public string? CreditCardCVC { get; set; }

        // === Intercompany Settings ===
        
        /// <summary>
        /// Intercompany Auto Create Orders
        /// </summary>
        public string? InterCompanyAutoCreateOrders { get; set; }

        /// <summary>
        /// Intercompany Direct Delivery
        /// </summary>
        public string? InterCompanyDirectDelivery { get; set; }

        // === Other Settings ===
        
        /// <summary>
        /// Memo
        /// </summary>
        public string? Memo { get; set; }

        /// <summary>
        /// Number Sequence Group
        /// </summary>
        public string? numberSequenceGroup { get; set; }

        /// <summary>
        /// Sales Calendar ID
        /// </summary>
        public string? SalesCalendarId { get; set; }

        /// <summary>
        /// Workflow State
        /// </summary>
        public string? WorkflowState { get; set; }

        /// <summary>
        /// Web Sales Order Display
        /// </summary>
        public string? WebSalesOrderDisplay { get; set; }

        /// <summary>
        /// Is Externally Maintained
        /// </summary>
        public string? IsExternallyMaintained { get; set; }

        /// <summary>
        /// Use Purchase Request
        /// </summary>
        public string? usePurchRequest { get; set; }

        /// <summary>
        /// Forecast DMP Include
        /// </summary>
        public string? ForecastDMPInclude { get; set; }

        /// <summary>
        /// Agency Location Code
        /// </summary>
        public string? AgencyLocationCode { get; set; }

        // === PDS (Product Data Management) Fields ===
        
        /// <summary>
        /// PDS Freight Accrued
        /// </summary>
        public string? PdsFreightAccrued { get; set; }

        /// <summary>
        /// PDS Rebate TMA Group
        /// </summary>
        public string? PdsRebateTMAGroup { get; set; }

        /// <summary>
        /// PDS Customer Rebate Group ID
        /// </summary>
        public string? PdsCustRebateGroupId { get; set; }

        // === OData Metadata ===
        
        /// <summary>
        /// OData ETag for concurrency control
        /// </summary>
        [JsonPropertyName("@odata.etag")]
        public string? ODataETag { get; set; }

        /// <summary>
        /// Packed Extensions (dynamic properties)
        /// </summary>
        public object? PackedExtensions { get; set; }
    }
}
