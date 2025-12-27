# Email Template Management - Frontend Components

## 📁 Component Structure

```
src/presentation/pages/template-email/
├── index.jsx                       # Main page with list and filters
├── components/
│   ├── EmailTemplateCard.jsx      # Template card display
│   ├── EmailTemplateForm.jsx      # Create/Edit template dialog
│   ├── EmailTemplatePreview.jsx   # Preview template dialog
│   ├── EmailComposeDialog.jsx     # Compose email from template
│   ├── TemplateEditor.jsx         # CKEditor wrapper
│   ├── VariableSelector.jsx       # Variable insertion dropdown
│   └── AttachmentManager.jsx      # File attachment manager
```

## 🎨 Components

### 1. **index.jsx** (Main Page)
Main entry point cho Email Template management.

**Features**:
- List tất cả templates với filtering
- Tabs: All / My Templates / Shared
- Search và category filter
- Create/Edit/Delete/Duplicate actions
- Preview template

**State Management**:
```javascript
const [templates, setTemplates] = useState([]);
const [searchTerm, setSearchTerm] = useState('');
const [categoryFilter, setCategoryFilter] = useState('all');
const [tabValue, setTabValue] = useState(0);
```

### 2. **EmailTemplateCard.jsx**
Card component hiển thị 1 template trong grid.

**Props**:
```javascript
{
  template: Object,
  onEdit: Function,
  onDelete: Function,
  onDuplicate: Function,
  onPreview: Function,
  currentUserId: Number
}
```

**Features**:
- Display template info (name, category, description)
- Show sharing status (Shared/Private)
- Usage statistics
- Action buttons (Edit/Delete/Duplicate/Preview)
- Permission-based actions

### 3. **EmailTemplateForm.jsx**
Dialog form để tạo mới hoặc edit template.

**Props**:
```javascript
{
  open: Boolean,
  onClose: Function,
  template: Object | null,
  onSave: Function
}
```

**Features**:
- Template name, category, description
- Subject với variable insertion
- Body với CKEditor
- Variable selector integration
- Attachment manager
- Signature settings
- Sharing toggle
- Form validation

### 4. **TemplateEditor.jsx**
Wrapper component cho CKEditor 5.

**Props**:
```javascript
{
  value: String,
  onChange: Function,
  placeholder: String
}
```

**CKEditor Configuration**:
- Toolbar: Heading, Bold, Italic, Link, Lists, Fonts, Colors, Images, Tables
- Min height: 300px
- Max height: 500px

### 5. **VariableSelector.jsx**
Dropdown để chọn và insert variables vào template.

**Props**:
```javascript
{
  onInsert: Function,
  variant: 'button' | 'chip'
}
```

**Features**:
- Search variables
- Group by entity type (user, lead, deal, contact, system)
- Show example values
- Icons for each entity type

**Variable Format**:
```javascript
{
  variableKey: '{{user_name}}',
  variableName: 'User Name',
  description: 'Full name of current user',
  entityType: 'user',
  exampleValue: 'Nguyễn Văn A'
}
```

### 6. **AttachmentManager.jsx**
Component để upload và quản lý file attachments.

**Props**:
```javascript
{
  attachments: Array,
  onChange: Function,
  disabled: Boolean
}
```

**Features**:
- Multi-file upload
- File type icons (PDF, DOC, Image)
- File size display
- Remove attachment
- Mock upload (replace với API call khi có backend)

### 7. **EmailTemplatePreview.jsx**
Dialog để preview template content.

**Props**:
```javascript
{
  open: Boolean,
  onClose: Function,
  template: Object
}
```

**Features**:
- Display template metadata
- Render HTML body
- Show signature
- List attachments
- Display usage statistics

### 8. **EmailComposeDialog.jsx**
Dialog để compose và send email từ template.

**Props**:
```javascript
{
  open: Boolean,
  onClose: Function,
  templateId: Number,
  entityType: String,
  entityId: Number,
  entityData: Object,
  onSend: Function
}
```

**Features**:
- Auto-render template với entity data
- Replace variables với giá trị thực
- Edit recipient (To, CC, BCC)
- Edit subject và body
- Show attachments
- Send email

**Usage Example**:
```javascript
// In Lead Detail Page
<EmailComposeDialog
  open={composeOpen}
  onClose={() => setComposeOpen(false)}
  templateId={selectedTemplateId}
  entityType="lead"
  entityId={leadId}
  entityData={lead}
  onSend={handleEmailSent}
/>
```

## 🔄 Data Flow

### Create/Edit Template
```
User clicks "Create" or "Edit"
  ↓
EmailTemplateForm opens
  ↓
User fills in form (name, subject, body)
  ↓
User inserts variables via VariableSelector
  ↓
User uploads attachments via AttachmentManager
  ↓
User clicks "Save"
  ↓
Validate form
  ↓
Call onSave with template data
  ↓
Parent component calls API (TODO)
  ↓
Update local state
  ↓
Show success message
```

### Send Email from Template
```
User selects entity (Lead/Deal)
  ↓
User clicks "Send Email" → Choose template
  ↓
EmailComposeDialog opens
  ↓
Backend renders template (replaces variables)
  ↓
Dialog shows rendered email
  ↓
User reviews and edits if needed
  ↓
User clicks "Send"
  ↓
Call API to send email (TODO)
  ↓
Log template usage
  ↓
Close dialog
```

## 🎯 Mock Data

Mock data được define trong:
- `src/data/mockEmailTemplates.js`

**Structure**:
```javascript
export const mockEmailTemplates = [
  {
    id: 1,
    name: 'Lead Follow-up Template',
    subject: 'Following up - {{lead_company}}',
    body: '<p>Dear {{lead_name}}...</p>',
    category: 'Lead Follow-up',
    isShared: true,
    createdBy: 1,
    creatorName: 'Admin User',
    usageCount: 15,
    attachments: []
  }
];

export const mockEmailTemplateVariables = [
  {
    variableKey: '{{user_name}}',
    variableName: 'User Name',
    entityType: 'user',
    exampleValue: 'Nguyễn Văn A'
  }
];
```

## 🔌 API Integration (TODO)

Replace mock data với API calls:

```javascript
// In index.jsx
import emailTemplateApi from '../../../infrastructure/api/emailTemplateApi';

// Load templates
const data = await emailTemplateApi.getAll();

// Create template
const newTemplate = await emailTemplateApi.create(templateData);

// Update template
await emailTemplateApi.update(templateId, templateData);

// Delete template
await emailTemplateApi.delete(templateId);

// Render template
const rendered = await emailTemplateApi.render(templateId, entityType, entityId);

// Send email
await emailTemplateApi.send(emailData);
```

## 🎨 Styling

Sử dụng Material-UI (MUI) components và sx prop cho styling.

**Color Scheme**:
- Primary: Template-related actions
- Success: Shared templates
- Default: Private templates
- Error: Delete actions
- Info: Preview actions

## 📱 Responsive Design

- **Desktop (md+)**: Grid 3 columns
- **Tablet (sm)**: Grid 2 columns  
- **Mobile (xs)**: Grid 1 column

## 🚀 Next Steps

1. **Backend Integration**:
   - Replace mock data với API calls
   - Implement file upload
   - Implement email sending

2. **Enhanced Features**:
   - Template versioning
   - Template analytics dashboard
   - A/B testing templates
   - Template scheduling

3. **Integration**:
   - Add "Send Email" button vào Lead detail page
   - Add "Send Email" button vào Deal detail page
   - Quick template selector trong các detail pages

## 📖 Usage Examples

### Example 1: Use in Lead Detail Page
```javascript
import EmailComposeDialog from '../template-email/components/EmailComposeDialog';

function LeadDetail({ leadId }) {
  const [lead, setLead] = useState(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);

  return (
    <Box>
      <Button onClick={() => {
        setSelectedTemplateId(1); // Choose template
        setComposeOpen(true);
      }}>
        Send Email
      </Button>

      <EmailComposeDialog
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        templateId={selectedTemplateId}
        entityType="lead"
        entityId={leadId}
        entityData={lead}
        onSend={(emailData) => {
          console.log('Email sent:', emailData);
        }}
      />
    </Box>
  );
}
```

### Example 2: Template Selector Component
```javascript
function TemplateQuickSelector({ entityType, onSelect }) {
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    // Load templates for this entity type
    loadTemplates();
  }, [entityType]);

  return (
    <Select onChange={(e) => onSelect(e.target.value)}>
      {templates.map(t => (
        <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
      ))}
    </Select>
  );
}
```
