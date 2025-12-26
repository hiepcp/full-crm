# Smart-Dumb Component Pattern Implementation

This directory implements the **Container–Presentational (Smart–Dumb) Component Pattern** for forms in the CRM system.

## Pattern Overview

### Presentational (Dumb) Components
- **`BaseForm`**: Handles UI rendering, layout, validation, and user input
- Receives form configuration and callbacks via props
- No business logic, purely presentational

### Container (Smart) Components
- **`CreateLeadModal`**: Handles data fetching, API submission, navigation, and side effects
- Uses BaseForm for UI concerns
- Contains all business logic

### Entity Creation Logic

When creating a Lead, the system provides flexibility for associated entities:

- **General Information** → **Contact** entity
  - User can choose to create a new contact or select an existing one
  - New contact: `firstName`, `lastName`, `email`, `phone` → Contact fields
  - Existing contact: Select from dropdown of available contacts

- **Company Information** → **Customer** entity
  - User can choose to create a new customer or select an existing one
  - New customer: `company`, `domain` → Customer fields
  - Uses contact's email/phone as primary contact info
  - Existing customer: Select from dropdown of available customers

- **Lead Details** → Creates the **Lead** entity
  - Links to the contact and customer (created or selected) via `contactId` and `customerId`

## File Structure

```
forms/
├── BaseForm.jsx           # Presentational component
├── LeadFormConfig.js      # Form configuration for leads
├── index.js              # Exports
└── README.md             # This file
```

## Usage

### 1. Create Form Configuration

```javascript
// LeadFormConfig.js
export const LeadFormConfig = {
  title: "Create New Lead",
  initialData: { /* default values */ },
  sections: [
    {
      id: 'general-info',
      title: 'General Information',
      icon: PersonIcon,
      fields: [
        {
          name: 'firstName',
          label: 'First Name',
          type: 'text',
          required: true,
          icon: PersonIcon
        }
        // ... more fields
      ]
    }
  ],
  actions: {
    cancel: { label: 'Cancel' },
    submit: { label: 'Create Lead' }
  }
};
```

### 2. Create Container Component

```javascript
// CreateLeadModal.jsx
const CreateLeadModal = ({ open, onClose, onSubmit }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      // Transform creates lead + associated contact/customer (or uses existing)
      const { lead, contact, customer } = transformLeadData(formData);

      let finalContactId = formData.selectedContactId;
      let finalCustomerId = formData.selectedCustomerId;

      // Create new contact if needed
      if (contact) {
        const createdContact = await api.createContact(contact);
        finalContactId = createdContact.id;
      }

      // Create new customer if needed
      if (customer) {
        const createdCustomer = await api.createCustomer(customer);
        finalCustomerId = createdCustomer.id;
      }

      // Create lead with proper entity links
      const createdLead = await api.createLead({
        ...lead,
        contactId: finalContactId,
        customerId: finalCustomerId
      });

      onSubmit({
        lead: createdLead,
        contact: contact || null,
        customer: customer || null,
        selectedContactId: formData.selectedContactId || null,
        selectedCustomerId: formData.selectedCustomerId || null
      });
      onClose();
    } catch (err) {
      setError('Failed to create lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={LeadFormConfig.title}>
      <BaseForm
        config={LeadFormConfig}
        initialData={LeadFormConfig.initialData}
        onSubmit={handleSubmit}
        onCancel={onClose}
        loading={loading}
        error={error}
      />
    </Modal>
  );
};
```

## Field Types Supported

- `text`: Text input field
- `email`: Email input with validation
- `textarea`: Multi-line text input
- `date`: Date picker input
- `select`: Dropdown selection
- `slider`: Range slider input
- `divider`: Visual separator

## Benefits

1. **Separation of Concerns**: UI logic separated from business logic
2. **Reusability**: BaseForm can be reused for any form type
3. **Maintainability**: Changes to form UI don't affect business logic
4. **Testability**: Presentational components are easy to test
5. **Consistency**: All forms follow the same patterns

## Extending the Pattern

To add a new form type with entity creation:

1. Create a new `FormConfig.jsx` file with your form configuration
2. Create transformation functions for associated entities (similar to `transformLeadData`)
3. Create a Container component that handles entity creation logic
4. Add exports to `index.js`
5. Use the container component in your pages

## Example: Adding a Deal Form

```javascript
// DealFormConfig.jsx
export const DealFormConfig = {
  title: "Create New Deal",
  sections: [
    {
      id: 'deal-info',
      title: 'Deal Information',
      fields: [
        // Deal fields...
      ]
    }
  ]
};

// Deal transformation functions
const createDealFromFormData = (formData) => ({
  // Create deal object
});

const createContactFromDealForm = (formData) => ({
  // Create contact if needed
});

// DealModal.jsx (Container)
const CreateDealModal = ({ open, onClose, onSubmit }) => {
  const handleSubmit = async (formData) => {
    const deal = createDealFromFormData(formData);
    const contact = createContactFromDealForm(formData);

    // Create entities and link them
    const createdContact = await api.createContact(contact);
    const createdDeal = await api.createDeal({
      ...deal,
      contactId: createdContact.id
    });

    onSubmit({ deal: createdDeal, contact: createdContact });
  };

  return (
    <Modal open={open} onClose={onClose}>
      <BaseForm config={DealFormConfig} onSubmit={handleSubmit} ... />
    </Modal>
  );
};
```
