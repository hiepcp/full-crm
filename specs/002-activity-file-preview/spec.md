# Feature Specification: Activity File Preview

**Feature Branch**: `002-activity-file-preview`
**Created**: 2025-12-23
**Status**: Draft
**Input**: User description: "init spec/002-activity-file-preview"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Preview Image Files Inline (Priority: P1)

Users can preview image attachments directly within the activity feed without leaving the page or opening external windows. When an activity contains image files (PNG, JPG, GIF, SVG, WebP), users can click on the attachment to see a full-size preview in a modal dialog.

**Why this priority**: Image previews provide immediate visual context for activity attachments, reducing friction in workflows where users need to quickly review screenshots, diagrams, or photos attached to activities. This is the most common use case for file previews.

**Independent Test**: Can be fully tested by attaching image files to an activity, clicking on the attachment, and verifying the preview modal displays the image correctly. Delivers immediate value by eliminating the need to download or open files in separate tabs.

**Acceptance Scenarios**:

1. **Given** an activity has an attached image file, **When** user clicks on the image attachment, **Then** a modal dialog opens displaying the full-size image
2. **Given** the image preview modal is open, **When** user clicks outside the modal or presses ESC key, **Then** the modal closes and returns to the activity feed
3. **Given** an activity has multiple image attachments, **When** user clicks on any image, **Then** the preview modal opens with navigation controls to view next/previous images
4. **Given** an image fails to load, **When** the preview modal opens, **Then** an appropriate error message is displayed instead of a broken image

---

### User Story 2 - Preview Document Files (Priority: P2)

Users can preview common document formats (PDF, TXT, CSV) directly within the application. Document previews render in a modal dialog with appropriate viewers, allowing users to read document contents without downloading.

**Why this priority**: Document previews are valuable for reviewing contracts, reports, and text files, but less frequently needed than image previews. This enhances productivity for knowledge workers who need to reference documents quickly.

**Independent Test**: Can be fully tested by attaching PDF/TXT/CSV files to activities and verifying the preview modal renders the document content correctly. Delivers value by providing quick document access without external applications.

**Acceptance Scenarios**:

1. **Given** an activity has an attached PDF file, **When** user clicks on the PDF attachment, **Then** a modal dialog opens displaying the PDF content with page navigation
2. **Given** an activity has an attached text file (TXT, CSV), **When** user clicks on the text file, **Then** a modal dialog opens displaying the formatted text content
3. **Given** a document preview is open, **When** user uses scroll or page controls, **Then** the document content navigates smoothly through pages or sections
4. **Given** a document is too large to preview, **When** user attempts to preview it, **Then** system displays a message offering download instead

---

### User Story 3 - Quick Thumbnail Previews (Priority: P3)

Users see small thumbnail previews of image and document attachments directly in the activity feed cards without clicking. Thumbnails provide visual cues about attachment content, helping users identify relevant activities faster.

**Why this priority**: Thumbnails improve scanability of the activity feed but are not essential for core functionality. This is a visual enhancement that improves user experience but can be implemented after basic preview functionality works.

**Independent Test**: Can be fully tested by viewing the activity feed with various file types attached and verifying thumbnails render correctly in the collapsed/expanded card states. Delivers value by making the feed more visually informative.

**Acceptance Scenarios**:

1. **Given** an activity card is expanded with image attachments, **When** the attachments section is visible, **Then** small thumbnail previews (64x64px) display for each image file
2. **Given** an activity has PDF attachments, **When** the attachments section is visible, **Then** first page thumbnails display for PDF files
3. **Given** a user clicks on a thumbnail, **When** the click event triggers, **Then** the full-size preview modal opens
4. **Given** thumbnails are loading, **When** the image is still downloading, **Then** a loading spinner displays in the thumbnail placeholder

---

### Edge Cases

- What happens when an image file is corrupt or unsupported format? System should display an error message and offer download option
- How does system handle very large files (>50MB)? System should warn users and offer download instead of attempting preview
- What happens when a file URL is expired or inaccessible? System should display appropriate error message and suggest refresh
- How does system handle video/audio files? Display appropriate file icon and offer download (preview support for media files is out of scope)
- What happens on mobile devices with limited screen size? Modal should be responsive and fullscreen on mobile devices
- How does system handle password-protected PDFs? Display message indicating file is protected and offer download option

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST detect file types based on file extension and MIME type to determine preview capability
- **FR-002**: System MUST support inline preview for image formats: PNG, JPG, JPEG, GIF, SVG, WebP, BMP
- **FR-003**: System MUST support inline preview for document formats: PDF, TXT, CSV
- **FR-004**: System MUST display a modal dialog when user clicks on a previewable attachment
- **FR-005**: System MUST provide close button and ESC key support to dismiss preview modals
- **FR-006**: System MUST display navigation controls (next/previous arrows) when activity has multiple previewable attachments
- **FR-007**: System MUST show loading indicators while files are being fetched for preview
- **FR-008**: System MUST display error messages when files fail to load or are unsupported
- **FR-009**: System MUST offer download option as fallback for all file types
- **FR-010**: System MUST generate thumbnail previews (64x64px) for images in the activity feed
- **FR-011**: System MUST handle files from both local uploads and external sources (SharePoint)
- **FR-012**: System MUST prevent preview modal from triggering activity card click events
- **FR-013**: System MUST scale images to fit viewport while maintaining aspect ratio in preview modal
- **FR-014**: System MUST provide zoom controls (zoom in, zoom out, reset) for image previews
- **FR-015**: System MUST render PDF documents with page navigation controls
- **FR-016**: System MUST display file metadata (name, size, format) in the preview modal header
- **FR-017**: System MUST skip preview and offer direct download for files larger than 50MB
- **FR-018**: System MUST be responsive and adapt preview modals for mobile devices (fullscreen on small screens)

### Key Entities *(include if feature involves data)*

- **Attachment**: File associated with an activity, containing name, URL, size, MIME type, and source (local or SharePoint)
- **Preview Modal**: UI component displaying file content with controls for navigation, zoom, and close actions
- **Thumbnail**: Small preview image (64x64px) representing an attachment's visual content

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can preview supported file types within 2 seconds of clicking on an attachment
- **SC-002**: 95% of image and PDF previews render successfully on first attempt
- **SC-003**: Users can navigate between multiple attachments in a preview modal without closing and reopening
- **SC-004**: Mobile users experience fullscreen previews that adapt to device orientation changes
- **SC-005**: Preview modals render correctly across all supported browsers (Chrome, Firefox, Safari, Edge)
- **SC-006**: Users can zoom images up to 400% magnification without loss of clarity
- **SC-007**: Error states provide clear guidance with download fallback options available within one click
- **SC-008**: Thumbnail generation completes within 3 seconds for standard image files
