# Feature Specification: Activity Excel File Preview

**Feature Branch**: `001-activity-excel-preview`
**Created**: 2025-12-25
**Status**: Draft
**Input**: User description: "activity thêm preview file excel"

## Clarifications

### Session 2025-12-25

- Q: Where should the Excel preview be displayed within the activity detail page? → A: Modal/Dialog overlay
- Q: What is the maximum file size that the system will attempt to process for preview (even if showing partial content)? → A: 20MB hard limit
- Q: Should the system log preview failures and errors for monitoring purposes? → A: Yes, log all preview failures with file metadata (size, format, error type) for monitoring and troubleshooting
- Q: Should the system cache Excel preview data to improve performance for repeated access? → A: Yes, cache parsed preview data server-side with time-based expiration (e.g., 15 minutes) to benefit all users
- Q: What level of mobile device support is required for the Excel preview feature? → A: Full support with responsive design - preview works on all devices (desktop, tablet, mobile) with touch-optimized navigation

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Excel File Content Inline (Priority: P1)

As a CRM user, when I view an activity that has an attached Excel file (e.g., sales reports, customer data exports, quotation details), I want to preview the Excel file content directly within the activity view without downloading it, so I can quickly verify information and make informed decisions.

**Why this priority**: This is the core value proposition. Users need immediate access to Excel file content to review activity-related data (quotations, reports, analytics) without interrupting their workflow. This is critical for sales teams reviewing quotation spreadsheets and managers reviewing performance reports.

**Independent Test**: Can be fully tested by attaching an Excel file (.xlsx or .xls) to any activity record, opening the activity detail page, and verifying that the Excel content renders in a readable preview pane with visible cells, headers, and data.

**Acceptance Scenarios**:

1. **Given** a user is viewing an activity detail page with an attached Excel file (.xlsx), **When** the user clicks on the file attachment or preview button, **Then** the system displays a modal/dialog overlay centered on screen showing the Excel spreadsheet with visible rows, columns, headers, and cell data
2. **Given** a user is viewing an Excel file preview, **When** the Excel file contains multiple sheets, **Then** the system displays sheet tabs allowing the user to switch between different worksheets
3. **Given** a user is viewing an Excel file preview, **When** the spreadsheet has many rows or columns, **Then** the system provides scrolling capabilities to navigate through all content
4. **Given** a user views a large Excel file (over 1000 rows), **When** the preview loads, **Then** the system displays the content within 3 seconds or shows a loading indicator

---

### User Story 2 - Download Excel Files (Priority: P2)

As a CRM user viewing an Excel file preview, I want the option to download the original Excel file to my device, so I can perform detailed analysis, edit the data, or share it with others outside the CRM system.

**Why this priority**: While preview covers most viewing needs, users sometimes need to work with the actual file in Excel for advanced features (formulas, pivot tables, macros) or offline access. This is a complementary feature to preview.

**Independent Test**: Can be tested by opening any Excel file preview and clicking a download button, verifying the file downloads with the original filename and can be opened in Microsoft Excel or compatible applications.

**Acceptance Scenarios**:

1. **Given** a user is viewing an Excel file preview, **When** the user clicks the download button, **Then** the system downloads the original Excel file with its original filename and format
2. **Given** a user downloads an Excel file, **When** the download completes, **Then** the file opens successfully in Excel applications and retains all original formatting, formulas, and data
3. **Given** multiple users access the same Excel file, **When** they download it, **Then** each user receives an identical copy of the original file

---

### User Story 3 - Handle Unsupported Excel Features Gracefully (Priority: P3)

As a CRM user, when I preview an Excel file that contains advanced features (macros, complex formulas, charts, pivot tables), I want to see a clear indication of what's supported in the preview versus what requires downloading, so I understand the limitations and can take appropriate action.

**Why this priority**: Excel files can contain complex features that may not render in a web preview. Users need transparency about limitations to avoid confusion. This is lower priority because basic data viewing (P1) serves most use cases.

**Independent Test**: Can be tested by uploading Excel files with various advanced features (charts, macros, pivot tables) and verifying that the preview shows supported content and displays clear messages for unsupported elements.

**Acceptance Scenarios**:

1. **Given** an Excel file contains charts or graphs, **When** the user previews it, **Then** the system either renders the charts or displays a message: "Charts are not supported in preview. Download the file to view all content."
2. **Given** an Excel file contains macros or VBA code, **When** the user previews it, **Then** the system displays the spreadsheet data but shows a notice: "This file contains macros that will not execute in preview mode."
3. **Given** an Excel file contains complex formulas, **When** the user previews it, **Then** the system displays either the calculated values or the formula syntax, with an option to download for full Excel functionality

---

### Edge Cases

- What happens when an Excel file is corrupted or password-protected?
  - System should display an error message: "Unable to preview this file. The file may be corrupted or password-protected. Try downloading it instead."

- What happens when an Excel file exceeds the maximum file size limit (over 20MB)?
  - System should refuse to preview and display a message: "This file is too large to preview (exceeds 20MB limit). Please download the file to view it."

- What happens when an Excel file is between 10MB and 20MB or exceeds 10,000 rows?
  - System should display a partial preview (e.g., first 10,000 rows) with a message: "Showing first 10,000 rows. Download the file to view all content."

- How does the system handle Excel files with non-standard formats (old .xls format, CSV saved as .xlsx, etc.)?
  - System should attempt to preview standard formats (.xlsx, .xls) and show an appropriate error for truly incompatible formats

- What happens when the Excel file contains special characters, formulas referencing external files, or linked data sources?
  - System displays cell values where possible and shows error indicators for broken references

- How does the system handle concurrent users viewing the same Excel file?
  - Each user should get their own independent preview instance; no locking or conflicts

- What happens on mobile devices, tablets, or small screen devices?
  - Preview must be fully responsive with adaptive layout for all screen sizes (desktop, tablet, mobile)
  - Touch-optimized navigation with swipe gestures for scrolling and sheet switching
  - Modal adjusts size appropriately for smaller screens while maintaining readability
  - Download option remains accessible on all devices

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to preview Excel file attachments (.xlsx and .xls formats) in a modal/dialog overlay when accessed from the activity detail view
- **FR-002**: System MUST display Excel content in a readable format showing cells, rows, columns, headers, and data values
- **FR-003**: System MUST provide navigation controls (scrolling, sheet tabs) to explore multi-sheet workbooks and large datasets
- **FR-004**: System MUST support switching between different worksheets/tabs within a single Excel file preview
- **FR-005**: System MUST preserve the visual structure of the spreadsheet including column widths, row heights, and basic cell formatting (bold, italic, colors)
- **FR-006**: System MUST provide a download option to retrieve the original Excel file from the preview interface
- **FR-007**: System MUST display loading indicators when processing Excel files, with preview rendering within 3 seconds for files under 5MB
- **FR-008**: System MUST handle errors gracefully (corrupted files, password-protected files, unsupported formats) with clear user-facing error messages
- **FR-009**: System MUST refuse to preview Excel files larger than 20MB and display a clear error message directing users to download instead
- **FR-010**: System MUST display partial previews (first 10,000 rows) for Excel files between 10MB-20MB or exceeding 10,000 rows, with a notification indicating limited preview
- **FR-011**: System MUST show notifications or warnings when Excel files contain unsupported features (macros, charts, pivot tables, external links)
- **FR-012**: System MUST retrieve Excel files from the existing SharePoint integration (as documented in CLAUDE.md)
- **FR-013**: System MUST maintain security by only allowing authorized users (those with permission to view the activity) to preview attached Excel files
- **FR-014**: Users MUST be able to close the modal/dialog preview using a close button or backdrop click to return to the activity detail view
- **FR-015**: System MUST support both legacy Excel format (.xls) and modern format (.xlsx)
- **FR-016**: System MUST log all preview failures and errors including file metadata (filename, size, format, error type, timestamp, user ID) for monitoring and troubleshooting purposes
- **FR-017**: System MUST cache parsed Excel preview data on the server-side with time-based expiration (15 minutes) to improve performance for repeated access by any user
- **FR-018**: System MUST provide fully responsive preview interface that works on all devices (desktop, tablet, mobile) with adaptive layout and touch-optimized navigation
- **FR-019**: System MUST support touch gestures (swipe, pinch-to-zoom where appropriate) for navigating Excel content on mobile and tablet devices

### Key Entities

- **Activity**: The CRM entity that can have file attachments. Activities track customer interactions, meetings, calls, tasks, and related documents.
- **File Attachment**: Represents a file attached to an activity, including metadata (filename, file size, format, upload date, SharePoint location).
- **Excel File**: A specific type of file attachment in .xlsx or .xls format containing spreadsheet data, potentially with multiple sheets, formulas, formatting, and other Excel features.

### Non-Functional Requirements

**Observability**:
- **NFR-001**: System MUST log all Excel preview attempts (successful and failed) with relevant context: user ID, activity ID, filename, file size, format, timestamp, and outcome
- **NFR-002**: System MUST log detailed error information for preview failures including error type, error message, stack trace (if applicable), and file metadata
- **NFR-003**: System MUST track preview performance metrics including file processing time, rendering time, and total time-to-display

**Performance**:
- **NFR-004**: Preview must render within 3 seconds for files under 5MB (as specified in SC-001)
- **NFR-005**: Partial preview must render within 5 seconds for files between 10MB-20MB (as specified in SC-005)
- **NFR-006**: Sheet navigation must respond within 1 second (as specified in SC-003)
- **NFR-007**: Cached preview data must be served within 500ms for repeat access to the same file
- **NFR-008**: Mobile/tablet preview must render within the same time constraints as desktop (3 seconds for <5MB files)

**Security**:
- **NFR-009**: Preview functionality must respect existing activity-level permissions (users can only preview files attached to activities they have access to)
- **NFR-010**: File retrieval from SharePoint must use secure authenticated connections
- **NFR-011**: Preview processing must not expose file contents to unauthorized users through caching or logging mechanisms
- **NFR-012**: Cached preview data must be isolated per file and must respect permission changes (if user loses access to activity, they cannot access cached preview)

**Accessibility & Device Support**:
- **NFR-013**: Preview interface must be fully functional on modern browsers (Chrome, Firefox, Edge, Safari) on all device types
- **NFR-014**: Touch interactions must be optimized for mobile and tablet devices (minimum tap target size, gesture support)
- **NFR-015**: Modal sizing must adapt to screen dimensions while maintaining minimum readability standards

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view Excel file content within the activity page in under 3 seconds for files up to 5MB
- **SC-002**: 90% of Excel file previews display successfully without errors for standard .xlsx and .xls files
- **SC-003**: Users can navigate between different sheets in a multi-sheet Excel file with immediate response (under 1 second per sheet switch)
- **SC-004**: System handles Excel files up to 20MB, refusing preview for files exceeding this limit with clear messaging
- **SC-005**: System provides partial preview (first 10,000 rows) for files between 10MB-20MB or exceeding 10,000 rows within 5 seconds
- **SC-006**: Reduce the number of Excel file downloads by 60% as users can view content inline without needing to download
- **SC-007**: 95% of users successfully preview Excel attachments on first attempt without requiring technical support
- **SC-008**: Error messages for unsupported files or features are clear enough that users understand next steps without contacting support
- **SC-009**: Cached previews are served within 500ms for repeat access, improving performance by at least 80% compared to initial load
- **SC-010**: Excel preview works successfully on mobile and tablet devices with 90% user satisfaction for touch navigation and readability

## Assumptions *(optional)*

- Excel files are already stored in SharePoint via the existing integration documented in CLAUDE.md
- The activity module has an existing file attachment mechanism that can be extended
- Users have modern web browsers with JavaScript enabled (Chrome, Firefox, Edge, Safari)
- Most Excel files in the CRM system are standard business documents (reports, quotations, customer lists) rather than highly complex workbooks with extensive macros or advanced features
- The system will use a client-side or server-side Excel parsing library to render preview content
- Preview is read-only; users cannot edit Excel files through the preview interface
- File access permissions are already enforced at the activity level (if user can view activity, they can view attachments)

## Dependencies *(optional)*

- **SharePoint Integration**: Excel files must be retrievable from the existing SharePoint document management system
- **Authentication & Authorization**: Existing user authentication and activity-level permissions must be in place
- **Activity Module**: The activity detail page must be implemented and functional
- **File Attachment Infrastructure**: Basic file attachment and retrieval mechanisms must exist

## Out of Scope *(optional)*

The following are explicitly NOT included in this feature:

- **Editing Excel files**: Users cannot modify cell values, formulas, or formatting through the preview interface
- **Creating new Excel files**: This feature only previews existing attachments, not creation tools
- **Advanced Excel features**: Full rendering of charts, pivot tables, macros, complex conditional formatting, or VBA code
- **Collaborative editing**: Multiple users cannot edit the same Excel file simultaneously
- **Version control**: No tracking of Excel file changes or revision history
- **Other file formats**: This feature focuses exclusively on Excel files (.xlsx, .xls), not Word, PDF, PowerPoint, or other formats
- **Excel formula execution**: Formulas may display as values or syntax, but complex formula recalculation is not guaranteed
- **External data connections**: Excel files with external database connections or linked data sources will show errors for broken links
