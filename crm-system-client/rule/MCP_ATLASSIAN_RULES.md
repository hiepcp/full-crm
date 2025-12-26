# MCP Atlassian Rules - CRM System Integration

## 📋 Overview
This document outlines the rules and procedures for using MCP (Model Context Protocol) Atlassian tools to manage CRM system tasks in Jira and Confluence.

## 🎯 MCP Atlassian Tools Available

### Jira Tools
- `mcp_Atlassian_createJiraIssue` - Create new Jira issues
- `mcp_Atlassian_editJiraIssue` - Update existing Jira issues
- `mcp_Atlassian_getJiraIssue` - Retrieve Jira issue details
- `mcp_Atlassian_getTransitionsForJiraIssue` - Get available status transitions
- `mcp_Atlassian_transitionJiraIssue` - Change issue status
- `mcp_Atlassian_addCommentToJiraIssue` - Add comments to issues
- `mcp_Atlassian_searchJiraIssuesUsingJql` - Search issues using JQL
- `mcp_Atlassian_getVisibleJiraProjects` - List accessible projects
- `mcp_Atlassian_getJiraProjectIssueTypesMetadata` - Get project issue types
- `mcp_Atlassian_getJiraIssueTypeMetaWithFields` - Get issue type fields
- `mcp_Atlassian_lookupJiraAccountId` - Find user account IDs

### Confluence Tools
- `mcp_Atlassian_createConfluencePage` - Create new Confluence pages
- `mcp_Atlassian_updateConfluencePage` - Update existing pages
- `mcp_Atlassian_getConfluencePage` - Retrieve page content
- `mcp_Atlassian_getConfluenceSpaces` - List accessible spaces
- `mcp_Atlassian_getPagesInConfluenceSpace` - List pages in a space
- `mcp_Atlassian_searchConfluenceUsingCql` - Search using Confluence Query Language

### Universal Tools
- `mcp_Atlassian_search` - Universal search across Jira and Confluence
- `mcp_Atlassian_fetch` - Fetch content by ARI (Atlassian Resource Identifier)

## 📝 Task Creation Rules

## 🏢 Business Logic Rules

### Lead and Deal Management Rules

#### 1. Lead Creation Rules
**Rule: Primary Contact Auto-Attachment**
- **When creating a lead**: The contact field must be automatically populated based on the customer's primary contact
- **Logic**: When a customer is selected during lead creation, automatically fetch and attach the primary contact (`isPrimary = true`) from that customer's contact list
- **Implementation**: In the lead creation form, customer selection triggers an API call to get primary contact and auto-fill the contact field
- **Validation**: If customer has no primary contact, show warning but allow manual contact selection
- **Database Relationship**: `lead.contactId` ← `contact.id` WHERE `contact.customerId = lead.customerId` AND `contact.isPrimary = true`

#### 2. Deal Creation Rules
**Rule: Customer Selection with Lead Creation Fallback**
- **When creating a deal**: If customer selection returns "customer not found", display a prominent link/button to navigate to leads page
- **UI Implementation**: Show customer search dropdown with "Create New Lead" button when no matches found
- **Navigation Flow**: "Customer not found" → Click "Create Lead" → Navigate to `/leads/new` → After lead creation → Show dialog create deal
- **Business Logic**: Deal creation should be blocked until valid customer exists (either existing or newly created via lead process)
- **Error Message**: "Customer not found. Would you like to [Create Lead](link-to-leads-page) instead?"

#### Implementation Examples

**Lead Creation with Auto-Contact Attachment:**
```javascript
// Frontend - Lead Creation Component
const handleCustomerChange = async (customerId) => {
  if (customerId) {
    // Auto-fetch primary contact when customer is selected
    const primaryContact = await getPrimaryContactByCustomerId(customerId);

    if (primaryContact) {
      setFormData(prev => ({
        ...prev,
        contactId: primaryContact.id,
        contactName: `${primaryContact.firstName} ${primaryContact.lastName}`
      }));
    } else {
      // Show warning but allow manual selection
      showWarning("No primary contact found for this customer. Please select contact manually.");
    }
  }
};

// Backend API - Get Primary Contact
GET /api/customers/{customerId}/primary-contact
Response: { id: 301, firstName: "Henrik", lastName: "Kristensen", ... }
```

**Deal Creation with Customer Validation and Dialog Flow:**
```javascript
// Frontend - Deal Creation Component
const handleCustomerSearch = async (searchTerm) => {
  const customers = await searchCustomers(searchTerm);

  if (customers.length === 0) {
    setCustomerNotFound(true);
    setShowCreateLeadLink(true);
  } else {
    setCustomerNotFound(false);
    setShowCreateLeadLink(false);
  }
};

// Handle "Create Lead" navigation
const handleCreateLeadClick = () => {
  // Navigate to leads page with callback to show deal dialog
  navigate('/leads/new', {
    state: {
      returnTo: '/deals/new',
      showDealDialogAfterCreation: true,
      originalDealData: formData // Preserve any existing deal data
    }
  });
};

// UI Implementation
{customerNotFound && (
  <div className="customer-not-found-alert">
    <Alert severity="warning">
      Customer not found.
      <Button onClick={handleCreateLeadClick}>
        Create Lead
      </Button> instead?
    </Alert>
  </div>
)}

// Lead Creation Success Callback (in Leads component)
const handleLeadCreated = (newLead) => {
  // Check if we need to show deal creation dialog
  const { state } = location;
  if (state?.showDealDialogAfterCreation) {
    setShowDealDialog(true);
    setDealDialogData({
      ...state.originalDealData,
      customerId: newLead.customerId,
      contactId: newLead.contactId,
      leadId: newLead.id
    });
  }
};

// Deal Creation Dialog
{showDealDialog && (
  <DealCreationDialog
    open={showDealDialog}
    onClose={() => setShowDealDialog(false)}
    initialData={dealDialogData}
    onSuccess={() => navigate('/deals')}
  />
)}
```

**Database Queries:**
```sql
-- Get primary contact for customer
SELECT TOP 1 * FROM contacts
WHERE customerId = @customerId AND isPrimary = 1
ORDER BY createdOn DESC;

-- Lead creation with auto-attached contact
INSERT INTO leads (customerId, contactId, ...)
VALUES (@customerId, @primaryContactId, ...);

-- Deal creation validation
IF NOT EXISTS (SELECT 1 FROM customers WHERE id = @customerId)
BEGIN
  -- Return error with suggestion to create lead
  THROW 50000, 'Customer not found. Consider creating a lead first.', 1;
END
```

#### Testing Guidelines

**Lead Creation Testing:**
- ✅ Select customer → Primary contact auto-filled
- ✅ Customer without primary contact → Warning shown, manual selection allowed
- ✅ Lead creation succeeds with auto-attached contact
- ✅ Contact relationship properly saved in database

**Deal Creation Testing:**
- ✅ Valid customer → Deal creation proceeds normally
- ✅ Invalid customer → "Customer not found" message + "Create Lead" button
- ✅ Click "Create Lead" button → Navigate to `/leads/new` with state data
- ✅ After lead creation → Deal creation dialog automatically opens with pre-filled data
- ✅ Dialog contains customer/contact data from newly created lead
- ✅ Deal creation succeeds through dialog → Navigate to deals list
- ✅ Dialog can be closed without creating deal → Return to leads page
- ✅ Deal creation blocked until valid customer exists

### 3. Project Identification
```javascript
// First, get accessible Atlassian resources
const resources = await mcp_Atlassian_getAccessibleAtlassianResources({
  randomString: "get_cloud_id"
});

// Use the appropriate cloudId for your organization
// Example: "your-domain.atlassian.net"
```

### 2. Project and Issue Type Setup
```javascript
// Get visible projects
const projects = await mcp_Atlassian_getVisibleJiraProjects({
  cloudId: "your-cloud-id"
});

// Get issue types for the selected project
const issueTypes = await mcp_Atlassian_getJiraProjectIssueTypesMetadata({
  cloudId: "your-cloud-id",
  projectIdOrKey: "CRM"
});

// Get field metadata for the issue type
const fieldsMeta = await mcp_Atlassian_getJiraIssueTypeMetaWithFields({
  cloudId: "your-cloud-id",
  projectIdOrKey: "CRM",
  issueTypeId: "10001" // Task issue type ID
});
```

### 3. Issue Creation Template

#### Frontend Development Task
```javascript
const frontendTask = await mcp_Atlassian_createJiraIssue({
  cloudId: "your-cloud-id",
  projectKey: "CMS",
  issueTypeName: "Task",
  summary: "CMS-FE-001: Replace mock data with API integration",
  description: `*Requirements:*
- Replace all mock data calls with real API endpoints
- Implement proper error handling for API failures
- Add loading states during API calls
- Update data transformation logic

*Acceptance Criteria:*
- All lead data comes from backend API
- Error messages display when API fails
- Loading indicators show during data fetching
- Form submissions work with real endpoints

*Estimate:* 3 days
*Priority:* Highest`,
  assigneeAccountId: "user-account-id"
});
```

#### Backend Development Task
```javascript
const backendTask = await mcp_Atlassian_createJiraIssue({
  cloudId: "your-cloud-id",
  projectKey: "CMS",
  issueTypeName: "Task",
  summary: "CMS-BE-001: Create Lead Entity and Repository",
  description: `*Requirements:*
- Create Lead entity with all necessary fields
- Implement LeadRepository with CRUD operations
- Add data validation and business rules
- Create database migrations

*Database Schema:*
\`\`\`sql
CREATE TABLE Leads (
  Id INT PRIMARY KEY IDENTITY,
  FirstName NVARCHAR(100) NOT NULL,
  LastName NVARCHAR(100) NOT NULL,
  Email NVARCHAR(255),
  Phone NVARCHAR(20),
  Company NVARCHAR(200),
  Domain NVARCHAR(255),
  Source NVARCHAR(50),
  Status NVARCHAR(50),
  Score INT DEFAULT 50,
  OwnerId INT,
  ContactId INT,
  CustomerId INT,
  CreatedOn DATETIME2 DEFAULT GETUTCDATE(),
  UpdatedOn DATETIME2 DEFAULT GETUTCDATE(),
  CreatedBy NVARCHAR(100),
  IsConverted BIT DEFAULT 0,
  ConvertedAt DATETIME2,
  DealId INT
);
\`\`\`

*Acceptance Criteria:*
- Lead entity matches frontend requirements
- Repository implements all CRUD operations
- Data validation is implemented
- Unit tests pass

*Estimate:* 2 days
*Priority:* Highest`,
  assigneeAccountId: "backend-developer-id"
});
```

### 4. Task Status Management

#### Status Transition Rules
```javascript
// Get available transitions
const transitions = await mcp_Atlassian_getTransitionsForJiraIssue({
  cloudId: "your-cloud-id",
  issueIdOrKey: "CMS-123"
});

// Common transitions:
// "To Do" -> "In Progress" -> "In Review" -> "Done"
// "Blocked" for impediments
// "Cancelled" for cancelled tasks

// Move task to In Progress
await mcp_Atlassian_transitionJiraIssue({
  cloudId: "your-cloud-id",
  issueIdOrKey: "CMS-123",
  transition: { id: "21" } // "Start Progress" transition ID
});
```

### 5. Progress Tracking

#### Daily Status Updates
```javascript
await mcp_Atlassian_addCommentToJiraIssue({
  cloudId: "your-cloud-id",
  issueIdOrKey: "CMS-123",
  commentBody: `*Daily Update - ${new Date().toLocaleDateString()}*
- ✅ Completed: Database schema design
- 🔄 In Progress: Repository implementation
- 📋 Next: Unit test creation
- 🚧 Blockers: None
- 📊 Progress: 60% complete`
});
```

#### Code Review Comments
```javascript
await mcp_Atlassian_addCommentToJiraIssue({
  cloudId: "your-cloud-id",
  issueIdOrKey: "CMS-123",
  commentBody: `🔍 *Code Review Feedback*
✅ *Approved:*
- Clean architecture implementation
- Good error handling
- Comprehensive unit tests

🔄 *Suggestions:*
- Consider adding more logging
- Add input validation decorators

🚀 *Ready for merge*`
});
```

## 📚 Documentation Rules

### 1. Technical Documentation
```javascript
// Create technical documentation page
const techDoc = await mcp_Atlassian_createConfluencePage({
  cloudId: "your-cloud-id",
  spaceId: "TECH",
  title: "Lead Management API Documentation",
  parentId: "api-docs-parent-id",
  body: `# Lead Management API

## Overview
This document describes the Lead Management API endpoints for the CRM system.

## Endpoints

### GET /api/leads
Retrieves a paginated list of leads with optional filtering.

**Parameters:**
- \`page\` (int, optional): Page number (default: 1)
- \`pageSize\` (int, optional): Items per page (default: 25)
- \`status\` (string, optional): Filter by lead status
- \`source\` (string, optional): Filter by lead source

**Response:**
\`\`\`json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 25,
    "total": 150,
    "totalPages": 6
  }
}
\`\`\`

### POST /api/leads
Creates a new lead.

**Request Body:**
\`\`\`json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@company.com",
  "phone": "+1234567890",
  "company": "ABC Corp",
  "source": "web",
  "ownerId": 1
}
\`\`\``
});
```

### 2. User Documentation
```javascript
// Create user guide page
const userGuide = await mcp_Atlassian_createConfluencePage({
  cloudId: "your-cloud-id",
  spaceId: "USERGUIDE",
  title: "How to Create and Manage Leads",
  parentId: "user-guides-parent-id",
  body: `# Creating and Managing Leads

## Overview
This guide explains how to create and manage leads in the CRM system.

## Creating a New Lead

### Step 1: Access Lead Management
1. Navigate to the **Leads** section from the main menu
2. Click the **"New Lead"** button

### Step 2: Fill Lead Information
Fill in the following required information:
- **Customer**: Select existing or create new customer
- **Contact**: Select existing or create new contact
- **Lead Details**: Source, status, score, owner
- **Additional Info**: Notes, follow-up date

### Step 3: Save the Lead
Click **"Save"** to create the lead.

## Managing Lead Status

### Status Progression
Leads follow this workflow:
1. **Working** → Initial qualification phase
2. **Nurturing** → Building relationship
3. **Qualified** → Ready for conversion
4. **Converted** → Successfully converted to deal

### Converting Leads to Deals
1. Open the lead detail page
2. Click **"Convert"** button
3. Fill deal information
4. Click **"Convert to Deal"**

## Best Practices
- Always set realistic follow-up dates
- Update lead scores regularly
- Add detailed notes for context
- Convert qualified leads promptly`
});
```

## 🔍 Search and Discovery

### Universal Search
```javascript
// Search across Jira and Confluence
const searchResults = await mcp_Atlassian_search({
  query: "lead management api"
});

// Fetch specific content by ARI
const content = await mcp_Atlassian_fetch({
  id: "ari:cloud:jira:cloud-id:issue/12345"
});
```

### JQL Search Examples
```javascript
// Find high priority frontend tasks
const highPriorityTasks = await mcp_Atlassian_searchJiraIssuesUsingJql({
  cloudId: "your-cloud-id",
  jql: "project = CRM AND issuetype = Task AND priority = High AND labels = frontend"
});

// Find tasks assigned to specific user
const myTasks = await mcp_Atlassian_searchJiraIssuesUsingJql({
  cloudId: "your-cloud-id",
  jql: "assignee = currentUser() AND status != Done"
});
```

## 📊 Current Jira Tasks Tracking

### Project Information
- **Project Key**: CMS
- **Project Name**: CRM-management-system
- **Cloud ID**: c71ed5d6-d8e9-464f-8726-e49849f792e2
- **Total Tasks**: 50 issues (27 Done, 7 In Progress, 16 To Do)
- **Date Range**: 2025-10-24 to 2025-12-15
- **Latest Update**: 2025-12-16

### Current Task Status Overview

#### ✅ Completed Tasks (27)
| Task ID | Title | Type | Status | Created |
|---------|-------|------|--------|---------|
| CMS-1 | Requirement Analysis | Task | ✅ Done | 2025-10-20 |
| CMS-2 | System Design | Task | ✅ Done | 2025-10-20 |
| CMS-8 | Requirements & Design | Epic | ✅ Done | 2025-10-24 |
| CMS-17 | Lead management | Story | ✅ Done | 2025-10-24 |
| CMS-20 | Customer management | Story | ✅ Done | 2025-10-24 |
| CMS-21 | Home dashboard | Story | ✅ Done | 2025-10-24 |
| CMS-24 | Dynamics APIs | Story | ✅ Done | 2025-10-24 |
| CMS-27 | Lead Create a new by manually | Task | ✅ Done | 2025-10-24 |
| CMS-28 | Database structure | Task | ✅ Done | 2025-10-28 |
| CMS-29 | System workflow | Task | ✅ Done | 2025-10-28 |
| CMS-30 | Feature analyze | Task | ✅ Done | 2025-10-28 |
| CMS-39 | Lead List & Filter | Subtask | ✅ Done | 2025-10-28 |
| CMS-40 | Lead Detail View | Subtask | ✅ Done | 2025-10-28 |
| CMS-41 | Outlook → Lead Activity Sync | Subtask | ✅ Done | 2025-10-28 |
| CMS-42 | Lead Create Form | Subtask | ✅ Done | 2025-10-28 |
| CMS-43 | Lead Activity Log | Subtask | ✅ Done | 2025-10-28 |
| CMS-44 | Deal Create Form | Subtask | ✅ Done | 2025-10-28 |
| CMS-49 | Deal Activity Management | Subtask | ✅ Done | 2025-10-28 |
| CMS-50 | Dashboard Layout & Routing | Subtask | ✅ Done | 2025-10-28 |
| CMS-51 | Activity Snapshot | Subtask | ✅ Done | 2025-10-28 |
| CMS-52 | Pipeline Value Chart | Subtask | ✅ Done | 2025-10-28 |
| CMS-53 | Lead Funnel Mini-Chart | Subtask | ✅ Done | 2025-10-28 |
| CMS-54 | Lead List & Filter | Task | ✅ Done | 2025-10-28 |
| CMS-55 | Lead Detail View | Task | ✅ Done | 2025-10-28 |
| CMS-56 | Lead Activity Sync (Outlook) | Task | ✅ Done | 2025-10-28 |
| CMS-57 | Lead Activity Log | Task | ✅ Done | 2025-10-28 |
| CMS-58 | Deal Detail View | Task | ✅ Done | 2025-10-28 |

#### 🔄 In Progress Tasks (7)
| Task ID | Title | Type | Status | Updated |
|---------|-------|------|--------|---------|
| CMS-9 | Frontend Development | Epic | 🔄 In Progress | 2025-12-16 |
| CMS-18 | Deal management | Story | 🔄 In Progress | 2025-12-16 |
| CMS-22 | Customer dashboard | Story | 🔄 In Progress | 2025-12-16 |
| CMS-23 | Activity management | Story | 🔄 In Progress | 2025-12-16 |
| CMS-25 | CRM APIs | Story | 🔄 In Progress | 2025-12-16 |
| CMS-47 | Deal Stage & Pipeline Update | Subtask | 🔄 In Progress | 2025-12-16 |
| CMS-48 | Deal-Quotation Integration | Subtask | 🔄 In Progress | 2025-12-16 |

#### 🚧 Epic Tasks (7)
| Task ID | Title | Type | Status | Priority |
|---------|-------|------|--------|----------|
| CMS-8 | Requirements & Design | Epic | ✅ Done | Medium |
| CMS-9 | Frontend Development | Epic | 🔄 In Progress | Medium |
| CMS-10 | Backend & API Development | Epic | To Do | Highest |
| CMS-11 | Master Data Preparation | Epic | To Do | Medium |
| CMS-12 | Testing & QA | Epic | To Do | Medium |
| CMS-13 | Deployment & Launch | Epic | To Do | Medium |
| CMS-36 | System demo | Epic | To Do | Medium |

#### 📋 Story Tasks (14)
| Task ID | Title | Type | Status | Priority |
|---------|-------|------|--------|----------|
| CMS-17 | Lead management | Story | ✅ Done | Highest |
| CMS-18 | Deal management | Story | 🔄 In Progress | Highest |
| CMS-19 | Pipeline management | Story | To Do | High |
| CMS-20 | Customer management | Story | ✅ Done | High |
| CMS-21 | Home dashboard | Story | ✅ Done | Highest |
| CMS-22 | Customer dashboard | Story | 🔄 In Progress | Medium |
| CMS-23 | Activity management | Story | 🔄 In Progress | Medium |
| CMS-24 | Dynamics APIs | Story | ✅ Done | Medium |
| CMS-25 | CRM APIs | Story | 🔄 In Progress | Medium |
| CMS-31 | Create a test case for lead management | Story | To Do | Medium |
| CMS-32 | Create a test case for deal management | Story | To Do | Medium |
| CMS-33 | Create a test case for customer management | Story | To Do | Medium |
| CMS-34 | Prepare web server for the system | Story | To Do | Medium |
| CMS-35 | Setup connection between CRM and Dynamics Live | Story | To Do | Medium |

#### 📝 Sub-Tasks (18)
| Task ID | Title | Type | Status | Priority | Start Date | Due Date |
|---------|-------|------|--------|----------|------------|----------|
| CMS-43 | Lead Activity Log | Subtask | ✅ Done | Medium | - | - |
| CMS-44 | Deal Create Form | Subtask | ✅ Done | Medium | 2025-12-01 | 2025-12-03 |
| CMS-45 | Deal List & Filters | Subtask | To Do | Medium | 2025-12-01 | 2025-12-05 |
| CMS-46 | Deal Detail View | Subtask | To Do | Medium | 2025-12-04 | 2025-12-08 |
| CMS-47 | Deal Stage & Pipeline Update | Subtask | 🔄 In Progress | Medium | 2025-12-09 | 2025-12-11 |
| CMS-48 | Deal-Quotation Integration | Subtask | 🔄 In Progress | Medium | 2025-12-12 | 2025-12-15 |
| CMS-49 | Deal Activity Management | Subtask | ✅ Done | Medium | 2025-12-16 | 2025-12-16 |
| CMS-50 | Dashboard Layout & Routing | Subtask | ✅ Done | Medium | - | - |
| CMS-51 | Activity Snapshot | Subtask | ✅ Done | Medium | - | - |
| CMS-52 | Pipeline Value Chart | Subtask | ✅ Done | Medium | - | - |
| CMS-53 | Lead Funnel Mini-Chart | Subtask | ✅ Done | Medium | - | - |
| CMS-59 | Deal Create Form | Task | To Do | Medium | 2025-12-01 | 2025-12-05 |
| CMS-60 | Deal List & Filters | Task | To Do | Medium | 2025-12-01 | 2025-12-05 |
| CMS-61 | Deal Stage & Pipeline Update | Task | To Do | Medium | 2025-12-09 | 2025-12-11 |
| CMS-62 | Deal-Quotation Integration | Task | To Do | Medium | 2025-12-12 | 2025-12-15 |
| CMS-64 | Dashboard Layout & Routing | Task | To Do | Medium - | - |
| CMS-65 | Activity Snapshot | Task | To Do | Medium | - | - |
| CMS-66 | Pipeline Value Chart | Task | To Do | Medium | - | - |
| CMS-67 | Lead Funnel Mini-Chart | Task | To Do | Medium | - | - |

#### 📅 Demo Tasks (2)
| Task ID | Title | Type | Status | Priority | Due Date |
|---------|-------|------|--------|----------|----------|
| CMS-37 | First demo 14-Nov-2025 | Task | ✅ Done | Medium | 2025-11-14 |
| CMS-38 | Second demo 15-Dec-2025 | Task | To Do | Medium | 2025-12-15 |

### Quick Search Commands

#### Find Tasks by Status
```javascript
// All completed tasks
const completedTasks = await mcp_Atlassian_searchJiraIssuesUsingJql({
  cloudId: "c71ed5d6-d8e9-464f-8726-e49849f792e2",
  jql: "project = CMS AND status = Done"
});
// All in progress tasks
const inProgressTasks = await mcp_Atlassian_searchJiraIssuesUsingJql({
  cloudId: "c71ed5d6-d8e9-464f-8726-e49849f792e2",
  jql: "project = CMS AND status = 'In Progress'"
});
```

#### Find Tasks by Type
```javascript
// All Epic tasks
const epics = await mcp_Atlassian_searchJiraIssuesUsingJql({
  cloudId: "c71ed5d6-d8e9-464f-8726-e49849f792e2",
  jql: "project = CMS AND issuetype = Epic"
});

// All Story tasks
const stories = await mcp_Atlassian_searchJiraIssuesUsingJql({
  cloudId: "c71ed5d6-d8e9-464f-8726-e49849f792e2",
  jql: "project = CMS AND issuetype = Story"
});
```

#### Get Task Details
```javascript
// Get specific task details
const taskDetails = await mcp_Atlassian_getJiraIssue({
  cloudId: "c71ed5d6-d8e9-464f-8726-e49849f792e2",
  issueIdOrKey: "CMS-17"
});
```

## 📊 Reporting and Analytics

### Sprint Progress Report
```javascript
// Create sprint report page
const sprintReport = await mcp_Atlassian_createConfluencePage({
  cloudId: "c71ed5d6-d8e9-464f-8726-e49849f792e2",
  spaceId: "REPORTS",
  title: `Sprint ${sprintNumber} Progress Report - CMS Project`,
  body: `# Sprint ${sprintNumber} Progress Report - CMS Project

## Sprint Summary
- **Period**: ${startDate} - ${endDate}
- **Goal**: Complete CRM System MVP
- **Team**: Frontend (2), Backend (2), QA (1)
- **Project**: CMS (CRM-management-system)

## Current Project Status
- **Total Tasks**: 50 (27 Done, 7 In Progress, 16 To Do)
- **Completed**: 27 (54.0%)
- **In Progress**: 7 (14.0%)
- **To Do**: 16 (32.0%)

## Completed Tasks
| Task ID | Title | Type | Status |
|---------|-------|------|--------|
| CMS-1 | Requirement Analysis | Task | ✅ Done |
| CMS-2 | System Design | Task | ✅ Done |
| CMS-40 | Lead Detail View | Subtask | ✅ Done |

## In Progress Tasks
| Task ID | Title | Type | Status | Last Updated |
|---------|-------|------|--------|--------------|
| CMS-9 | Frontend Development | Epic | 🔄 In Progress | 2025-12-16 |
| CMS-18 | Deal management | Story | 🔄 In Progress | 2025-12-16 |
| CMS-22 | Customer dashboard | Story | 🔄 In Progress | 2025-12-16 |
| CMS-23 | Activity management | Story | 🔄 In Progress | 2025-12-16 |
| CMS-25 | CRM APIs | Story | 🔄 In Progress | 2025-12-16 |
| CMS-47 | Deal Stage & Pipeline Update | Subtask | 🔄 In Progress | 2025-12-16 |
| CMS-48 | Deal-Quotation Integration | Subtask | 🔄 In Progress | 2025-12-16 |

## Active Epics
| Epic ID | Title | Stories | Status |
|---------|-------|---------|--------|
| CMS-8 | Requirements & Design | Multiple | ✅ Done |
| CMS-9 | Frontend Development | Multiple | 🔄 In Progress |
| CMS-10 | Backend & API Development | Multiple | To Do |
| CMS-11 | Master Data Preparation | Multiple | To Do |
| CMS-12 | Testing & QA | Multiple | To Do |
| CMS-13 | Deployment & Launch | Multiple | To Do |
| CMS-36 | System demo | 2 | To Do |

## Active Stories
| Story ID | Title | Status | Priority |
|----------|-------|--------|----------|
| CMS-17 | Lead management | ✅ Done | Highest |
| CMS-18 | Deal management | 🔄 In Progress | Highest |
| CMS-19 | Pipeline management | To Do | High |
| CMS-20 | Customer management | ✅ Done | High |
| CMS-21 | Home dashboard | ✅ Done | Highest |
| CMS-22 | Customer dashboard | 🔄 In Progress | Medium |
| CMS-23 | Activity management | 🔄 In Progress | Medium |
| CMS-24 | Dynamics APIs | ✅ Done | Medium |
| CMS-25 | CRM APIs | 🔄 In Progress | Medium |
| CMS-31 | Create a test case for lead management | To Do | Medium |
| CMS-32 | Create a test case for deal management | To Do | Medium |
| CMS-33 | Create a test case for customer management | To Do | Medium |
| CMS-34 | Prepare web server for the system | To Do | Medium |
| CMS-35 | Setup connection between CRM and Dynamics Live | To Do | Medium |

## Sprint Burndown
[Burndown chart placeholder]

## Key Metrics
- **Completion Rate**: 54.0% (27/50 tasks)
- **In Progress Rate**: 14.0% (7/50 tasks)
- **Epic Coverage**: 7 total epics (1 done, 1 in progress: Frontend Development, 5 to do)
- **Story Coverage**: 14 active stories (4 in progress)
- **Demo Planning**: 2 demo tasks scheduled (Nov 14, Dec 15, 2025)
- **Priority Distribution**: 1 Highest (active), 2 High, 9 Medium priority stories
- **Quality**: Database structure ✅, system workflow ✅, feature analysis ✅ completed

## Next Sprint Planning
Based on current progress, next sprint should focus on:

### 📅 **Current Development Focus**
- **Core Features In Progress**:
  - **CMS-18**: Deal management (In Progress) - Priority: Highest
  - **CMS-22**: Customer dashboard (In Progress) - Priority: Medium
  - **CMS-23**: Activity management (In Progress) - Priority: Medium
  - **CMS-25**: CRM APIs (In Progress) - Priority: Medium

- **Recently Completed Features** ✅:
  - **CMS-17**: Lead management - Priority: Highest
  - **CMS-20**: Customer management - Priority: High
  - **CMS-21**: Home dashboard - Priority: Highest
  - **CMS-27**: Manual lead creation - Priority: Medium

- **Backend API Development** (Priority: Highest - Foundation Required):
  - **CMS-10**: Backend & API Development (To Do) - Priority: Highest
  - **Customer API**: 40-60 hours (Foundation for all CRM operations)
  - **Lead API**: 35-50 hours (Customer potential management)
  - **Deal API**: 50-70 hours (Core business functionality)

- **Deal Management Implementation** (Timeline: 2025-12-01 → 2025-12-16):
  - **Foundation Tasks** (Week 1): CMS-44, CMS-59, CMS-60 (Create Forms & List/Filters - Mostly Done)
  - **Core Tasks** (Week 1-2): CMS-58 (Detail View ✅ Done)
  - **Advanced Tasks** (Week 2): CMS-47, CMS-48 (Pipeline & Integration - In Progress)

- **System Foundation** ✅ **COMPLETED**:
  - **CMS-28**: Database structure ✅ Done
  - **CMS-29**: System workflow ✅ Done
  - **CMS-30**: Feature analyze ✅ Done

### 🎯 **Key Priorities**
- **URGENT - Backend API Development**: Implement Customer, Lead, Deal APIs (foundation required for system functionality)
- **Complete Current In-Progress Features**: Finish deal management, customer dashboard, activity management, and CRM APIs
- **System Foundation**: ✅ COMPLETED - Database structure, system workflow, and feature analysis done
- **Prepare Demo Environment**: Setup for second demo on 2025-12-15
- **Expand Feature Set**: Start pipeline management and advanced features after backend APIs
- **API Integration**: Complete remaining CRM APIs and system integration

### 📊 **Timeline Summary**
- **Active Development**: 7 tasks currently in progress, 7 epics, 14 stories
- **Demo Milestones**: First demo ✅ Done (2025-11-14), Second demo (2025-12-15)
- **Backend Priority**: Customer API → Lead API → Deal API (255-375 hours total)
- **Frontend Status**: UI completed, needs API integration
- **Infrastructure**: Database structure and system workflow completed
- **Critical Path**: Backend API completion required for system functionality`
});
```

## ⚡ Automation Rules

### 1. Task Creation Automation
- All frontend tasks should be prefixed with `CMS-FE-`
- Backend tasks prefixed with `CMS-BE-`
- QA tasks prefixed with `CMS-QA-`
- Integration tasks prefixed with `CMS-INT-`

### 2. Status Automation
- Tasks automatically move to "In Progress" when assigned
- Tasks move to "In Review" when pull request is created
- Tasks move to "Done" when code is merged

### 3. Notification Rules
- Notify team when high-priority tasks are created
- Notify assignee when task is assigned or status changes
- Notify product owner when tasks are completed

## 🛠️ Tool Configuration

### Required Setup
1. **Cloud ID**: Obtain from Atlassian admin or use domain URL
2. **API Permissions**: Ensure proper permissions for project access
3. **Project Keys**: Use consistent project key (CRM) across all tasks
4. **Issue Types**: Standardize on Task, Bug, Story, Epic issue types

### Best Practices
- Always include acceptance criteria in task descriptions
- Use story points for estimation (1, 2, 3, 5, 8, 13)
- Add relevant labels (frontend, backend, urgent, etc.)
- Link related tasks and documents
- Keep documentation updated with code changes

## 📞 Support

For questions about MCP Atlassian usage:
- Check this document first
- Review Atlassian API documentation
- Contact DevOps team for tool setup issues
- Create support ticket for technical issues

---
*Last Updated: 2025-12-16*
*Version: 2.1*
*Author: CRM Development Team*
*Latest Update: Major update with live Jira data sync. Updated all task statuses from current Jira project state: 27 tasks completed (54%), 7 in progress (14%), 16 remaining (32%). Updated epics (7 total: 1 done, 1 in progress, 5 to do), stories (14 total: 3 done, 4 in progress, 7 to do), and subtasks status. Corrected Next Sprint Planning, Key Priorities, and Key Metrics to reflect completed vs in-progress work. Updated timeline summary and priority distribution.*
