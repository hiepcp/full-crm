# AddActivityForm - Refactored Structure

## Overview
Component form để tạo và chỉnh sửa activities trong CRM system. Đã được refactor để dễ bảo trì và mở rộng hơn.

## Cấu trúc thư mục

```
ActivityForms/
├── AddActivityForm.jsx          # Component chính (giảm từ 1727 dòng xuống ~600 dòng)
├── hooks/                       # Custom hooks để quản lý business logic
│   ├── useEmailDialog.js        # Quản lý email dialog state & operations
│   ├── useAppointmentDialog.js  # Quản lý appointment dialog state & operations
│   ├── useActivityForm.js       # Quản lý form state & validation
│   └── index.js                 # Export hooks
├── components/                  # UI components nhỏ hơn
│   ├── ActivityCategoryFields.jsx  # Render category-specific fields
│   ├── DescriptionEditor.jsx      # Rich text editor
│   ├── FileUploadSection.jsx      # File upload & attachment management
│   └── index.js                   # Export components
├── utils/                       # Helper functions
│   ├── emailHelpers.js          # Email mapping & utilities
│   ├── activityHelpers.js       # Activity data construction
│   └── index.js                 # Export utils
└── README.md                    # Documentation (this file)
```

## Custom Hooks

### useEmailDialog
Quản lý toàn bộ logic liên quan đến email dialog:
- Load emails từ mail server
- Pagination & filtering
- Mail folder selection
- Email confirmation & selection

**State:**
- `emailDialogOpen`, `emails`, `selectedEmail`, `confirmedEmail`
- `emailLoading`, `tokenExpired`, `hasMoreEmails`
- `mailFolders`, `selectedFolderId`, `confirmingEmail`

**State Setters:** (exposed for direct manipulation when needed)
- `setEmailDialogOpen`, `setEmails`, `setTokenExpired`, etc.

**Actions:**
- `loadEmailsForActivityCreation()`, `loadMoreEmails()`
- `handleOpenEmailDialog()`, `handleCloseEmailDialog()`
- `handleEmailSelect()`, `handleConfirmEmailSelection()`
- `resetEmailDialog()`

### useAppointmentDialog
Quản lý toàn bộ logic liên quan đến appointment dialog:
- Load appointments từ calendar
- Pagination & filtering
- Appointment confirmation & selection

**State:**
- `appointmentDialogOpen`, `appointments`, `selectedAppointment`
- `appointmentLoading`, `hasMoreAppointments`, `tokenExpired`

**State Setters:** (exposed for direct manipulation when needed)
- `setAppointmentDialogOpen`, `setAppointments`, `setTokenExpired`, etc.

**Actions:**
- `loadAppointmentsForActivityCreation()`, `loadMoreAppointments()`
- `handleOpenAppointmentDialog()`, `handleCloseAppointmentDialog()`
- `handleAppointmentSelect()`, `handleConfirmAppointmentSelection()`
- `resetAppointmentDialog()`

### useActivityForm
Quản lý form state và validation:
- Form data state management
- Initial data loading (khi edit)
- Form validation
- Reset form

**State:**
- `formData`, `description`, `uploadedFiles`

**Actions:**
- `updateFormData()`, `resetForm()`, `validate()`
- `setDescription()`, `setUploadedFiles()`

## Components

### ActivityCategoryFields
Render các fields dựa trên activity category:
- Meeting fields (start time, end time, duration)
- Email fields (from, recipients)
- Auto-calculation logic (end time based on duration)

### DescriptionEditor
Rich text editor sử dụng CKEditor:
- Toolbar configuration
- Disabled state handling

### FileUploadSection
File upload với drag & drop:
- Drag & drop zone
- File list management
- File removal

## Utils

### emailHelpers.js
- `mapEmailToCreateEmailRequest()`: Map email data sang format cho API

### activityHelpers.js
- `constructActivityData()`: Construct activity data từ form data

## Lợi ích của việc refactor

### 1. **Separation of Concerns**
- Business logic tách ra khỏi UI (hooks)
- UI components nhỏ hơn, dễ test
- Helper functions tách riêng

### 2. **Reusability**
- Hooks có thể reuse ở components khác
- UI components có thể reuse
- Helper functions có thể reuse

### 3. **Maintainability**
- Dễ tìm và fix bugs
- Dễ thêm features mới
- Code dễ đọc hơn

### 4. **Testability**
- Hooks có thể test riêng
- Components có thể test riêng
- Utils có thể test riêng

### 5. **Performance**
- Lazy loading data khi cần
- Memoization dễ dàng hơn
- Re-render optimization

## Usage Example

```jsx
import AddActivityForm from './ActivityForms/AddActivityForm';

function MyComponent() {
  const formRef = useRef();

  const handleSubmit = (activityData, options) => {
    console.log('Activity saved:', activityData);
    if (options?.isEmailUpdate) {
      console.log('This was an email update');
    }
  };

  const handleValidate = () => {
    const { valid, errors } = formRef.current.validate();
    if (!valid) {
      console.error('Validation errors:', errors);
    }
  };

  return (
    <AddActivityForm
      ref={formRef}
      relationType="deal"
      relationId={123}
      dealName="Big Deal"
      defaultAssignee="user@example.com"
      onSubmit={handleSubmit}
      onCancel={() => console.log('Cancelled')}
      showActions={true}
    />
  );
}
```

## Migration Notes

Nếu bạn đang sử dụng version cũ của AddActivityForm:
- API không thay đổi (props giống nhau)
- Ref methods không thay đổi (`getActivityData()`, `validate()`)
- Behavior giống nhau, chỉ code structure thay đổi
- Không cần update code sử dụng component này

## Future Improvements

1. **Add unit tests** cho hooks và utils
2. **Add Storybook stories** cho components
3. **Add TypeScript** để type safety
4. **Optimize re-renders** với useMemo/useCallback
5. **Add error boundaries** cho better error handling
6. **Add analytics tracking** cho user interactions

