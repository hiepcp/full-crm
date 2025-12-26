# CoreOne CRM System - Client

## 📋 Tổng quan dự án

**CoreOne CRM Client** là ứng dụng frontend của hệ thống quản lý quan hệ khách hàng (CRM) được xây dựng với React và Material-UI. Hệ thống được thiết kế theo kiến trúc **Clean Architecture** với sự phân tách rõ ràng giữa các tầng: Domain, Application, Infrastructure và Presentation.

## 🚀 Tính năng hiện tại

### ✅ Đã hoàn thành (Frontend UI)
- **Dashboard**: Giao diện tổng quan với widgets thống kê
- **Deal Management**: Giao diện quản lý deals với pipeline visualization
- **Customer Management**: Danh sách và chi tiết khách hàng
- **Lead Management**: Quản lý khách hàng tiềm năng
- **Contact Management**: Danh sách và chi tiết liên hệ
- **Activity Management**: Theo dõi hoạt động
- **Authentication**: Tích hợp Azure AD login

### 🚧 Đang phát triển
- **Backend APIs**: Phát triển APIs cho tất cả modules (Customer, Lead, Deal, Contact, Activity, etc.)
- **Real-time Features**: SignalR integration cho real-time notifications
- **Advanced Analytics**: Báo cáo và phân tích nâng cao
- **Email Integration**: Hệ thống inbox và email management

### 🔄 Kiến trúc đã thiết kế
- **Pipeline Management**: Logic quản lý pipeline deals với các giai đoạn hoàn chỉnh
- **Role-based Access Control**: Hệ thống phân quyền chi tiết
- **Clean Architecture**: Tách biệt rõ ràng các tầng Domain, Application, Infrastructure

## 🛠️ Công nghệ sử dụng

- **Frontend**: React 18, Vite, Material-UI (MUI)
- **State Management**: Redux Toolkit
- **Authentication**: Azure MSAL
- **Real-time**: SignalR
- **HTTP Client**: Axios
- **Charts & Data Grid**: MUI X Charts & Data Grid
- **Drag & Drop**: @dnd-kit
- **Date Handling**: Day.js
- **Rich Text Editor**: Draft.js

## 📚 Tài liệu tham khảo

- [📋 Deals & Pipeline](DEAL_README.md) - Chi tiết về logic quản lý deals và pipeline
- [📊 Pipeline Logs](PIPELINE_README.md) - Hướng dẫn triển khai pipeline logs
- [🎨 UI Components](DEAL_UI_README.md) - Thiết kế giao diện pipeline
- [📄 Detail Pages](DETAIL_PAGES_README.md) - Thông tin về các trang chi tiết đã triển khai
- [📊 Development Estimate](README_ESTIMATE.md) - Ước tính thời gian và tình trạng phát triển

## ⚠️ Tình trạng dự án hiện tại

**🚨 QUAN TRỌNG**: Dự án hiện đang trong giai đoạn phát triển Backend APIs. Frontend UI đã được xây dựng hoàn chỉnh nhưng chưa thể hoạt động thực tế do thiếu APIs.

### 🔴 Các vấn đề cần giải quyết ngay:

1. **Backend APIs**: Cần phát triển đầy đủ APIs cho các modules:
   - Customer, Lead, Deal, Contact, Activity, Document, Quotation
   - Chỉ có Authentication API đã hoàn thành

2. **Database Integration**: Kết nối với cơ sở dữ liệu thực tế thay vì mock data

3. **Testing**: Cần testing kỹ lưỡng khi hoàn thành APIs

### 📋 Thứ tự ưu tiên phát triển:

1. **Customer API** (Cơ sở cho mọi hoạt động CRM)
2. **Lead API** (Quản lý khách hàng tiềm năng)
3. **Deal API** (Module quan trọng nhất cho kinh doanh)
4. **Contact API** (Thông tin liên hệ khách hàng)
5. **Activity API** (Theo dõi hoạt động)

**Chi tiết xem tại**: [README_ESTIMATE.md](README_ESTIMATE.md)

## 🚀 Hướng dẫn Development

### 📦 Cài đặt dependencies

```bash
npm install
```

### 🏃‍♂️ Chạy ứng dụng

#### Development Mode (mặc định)
```bash
npm start
```
Ứng dụng sẽ chạy tại: **https://crm.local.com:3000**

#### Sandbox Mode (cho testing)
```bash
npm run start:sandbox
```

#### Production Mode (local)
```bash
npm run start:prod
```

### 🔧 Build ứng dụng

#### Development Build
```bash
npm run build
```

#### Sandbox Build
```bash
npm run build:sandbox
```

#### Production Build
```bash
npm run build:prod
```

### 👀 Preview Build

Sau khi build, bạn có thể preview:

```bash
npm run preview
```

### 🎨 Code Quality

#### Kiểm tra lỗi ESLint
```bash
npm run lint
```

#### Tự động sửa lỗi ESLint
```bash
npm run lint:fix
```

#### Format code với Prettier
```bash
npm run prettier
```

### 🔒 SSL Certificates & Local Development

Để chạy ứng dụng trên **https://crm.local.com:3000**, bạn cần thiết lập certificates:

#### 1. Cài đặt mkcert
```bash
# Tải từ: https://github.com/FiloSottile/mkcert/releases
# Copy mkcert.exe vào thư mục project hoặc PATH
```

#### 2. Cài đặt Local CA
```bash
mkcert -install
```

#### 3. Tạo certificates cho local domains
```bash
# Tạo certificate cho frontend
mkcert "*.local.com"

# Tạo certificate cho Authentication API
mkcert api-auth.local.com
openssl pkcs12 -export -out api-auth.local.com.p12 -inkey api-auth.local.com-key.pem -in api-auth.local.com.pem -password pass:123456

# Tạo certificate cho CRM API (nếu cần)
mkcert api-crm.local.com
openssl pkcs12 -export -out api-crm.local.com.p12 -inkey api-crm.local.com-key.pem -in api-crm.local.com.pem -password pass:123456
```

#### 4. Cập nhật hosts file
Thêm vào `C:\Windows\System32\drivers\etc\hosts`:
```plaintext
127.0.0.1 crm.local.com
127.0.0.1 api-auth.local.com
127.0.0.1 api-crm.local.com
```

# 📘 Quy ước đặt tên

## 🏗️ Cấu trúc code

- **Thư mục**: `kebab-case` (ví dụ: `user-profile`, `customer-list`)
- **File React**: `PascalCase.jsx` (ví dụ: `CustomerList.jsx`, `DealDetail.jsx`)
- **Component**: `PascalCase` khớp với tên file
- **Biến/hàm/props**: `camelCase` (ví dụ: `handleClick`, `userId`, `isLoading`)
- **CSS Modules**: `PascalCase.module.css` (ví dụ: `CustomerList.module.css`)
- **Global CSS**: `kebab-case.css` (ví dụ: `main-layout.css`)
- **Test files**: `ComponentName.test.js`

## 📋 Constants & Configuration

### 🎯 Constants dùng chung

Dự án sử dụng constants tập trung để quản lý các giá trị dùng chung, tránh hard-code và dễ bảo trì:

**📁 `src/utils/constants.js`**

```javascript
// Lead Sources - Sử dụng trong LeadDetail và DealDetail
export const LEAD_SOURCES = [
  { value: 'Website', label: 'Website' },
  { value: 'Referral', label: 'Referral' },
  { value: 'Cold Call', label: 'Cold Call' },
  // ... các nguồn khác
];

// Lead Sources cho form tạo mới - Sử dụng trong CreateLeadModal và CreateDealModal
export const LEAD_SOURCES_CREATE = [
  { value: 'web', label: '🌐 Web' },
  { value: 'event', label: '🎪 Event' },
  { value: 'referral', label: '🤝 Referral' },
  // ... các nguồn khác với emoji
];

// Lead Statuses - Sử dụng trong LeadDetail và LeadFilters
export const LEAD_STATUSES = [
  { value: 'working', label: '🔄 Working', description: 'In progress' },
  { value: 'qualified', label: '✅ Qualified', description: 'Ready to convert' },
  { value: 'unqualified', label: '❌ Unqualified', description: 'Not a fit' },
  { value: 'cancelled', label: '🚫 Cancelled', description: 'Cancelled' }
];

// Lead Statuses với emoji và color - Sử dụng trong CreateLeadModal
export const LEAD_STATUSES_CREATE = [
  { value: 'working', label: '🔄 Working', description: 'In progress', color: 'warning' },
  { value: 'qualified', label: '✅ Qualified', description: 'Ready to convert', color: 'success' },
  { value: 'unqualified', label: '❌ Unqualified', description: 'Not a fit', color: 'error' },
  { value: 'cancelled', label: '🚫 Cancelled', description: 'Cancelled', color: 'error' }
];

// Activity Types - Sử dụng trong AddActivityForm
export const ACTIVITY_TYPES = [
  { value: 'appointment', label: '📅 Appointment' },
  { value: 'call', label: '📞 Call' },
  { value: 'email', label: '📧 Email' },
  { value: 'note', label: '📝 Note' }
];

// Priorities, Activity Statuses, etc.
```

**💡 Cách sử dụng:**

```javascript
// Import constants cho detail/edit pages
import { LEAD_SOURCES } from '../../../utils/constants';

// Import constants cho create/modals
import { LEAD_SOURCES_CREATE } from '../../../utils/constants';

// Sử dụng trong Select components
{LEAD_SOURCES.map((source) => (
  <MenuItem key={source.value} value={source.value}>
    {source.label}
  </MenuItem>
))}

// Sử dụng trong Create forms với emoji
{LEAD_SOURCES_CREATE.map((source) => (
  <MenuItem key={source.value} value={source.value}>
    {source.label}
  </MenuItem>
))}

// Sử dụng Activity Types
import { ACTIVITY_TYPES } from '../../../utils/constants';

{ACTIVITY_TYPES.map((type) => (
  <MenuItem key={type.value} value={type.value}>
    {type.label}
  </MenuItem>
))}

// Sử dụng Lead Statuses trong form creation
import { LEAD_STATUSES_CREATE } from '../../../utils/constants';

{LEAD_STATUSES_CREATE.map((status) => (
  <MenuItem key={status.value} value={status.value}>
    <Stack direction="row" spacing={1} alignItems="center">
      <Chip label={status.label} size="small" color={status.color} sx={{ minWidth: 80 }} />
      <Typography variant="body2">{status.description}</Typography>
    </Stack>
  </MenuItem>
))}
```

**✅ Lợi ích:**
- **DRY Principle**: Tránh duplicate code
- **Maintainability**: Dễ cập nhật và mở rộng
- **Consistency**: Đảm bảo tính nhất quán giữa các components
- **Type Safety**: Hỗ trợ IDE autocomplete và error checking

**📋 Đã áp dụng cho các components:**
- ✅ `LeadDetail.jsx` - Lead detail/edit page (Sources & Statuses)
- ✅ `DealDetail.jsx` - Deal detail/edit page (Sources)
- ✅ `CreateLeadModal.jsx` - Create lead modal (Sources & Statuses)
- ✅ `CreateDealModal.jsx` - Create deal modal (Sources)
- ✅ `LeadFilters.jsx` - Lead filtering (Sources & Statuses)
- ✅ `AddActivityForm.jsx` - Create activity form (Activity Types)

## 📁 Tổ chức thư mục

```
src/
├── components/           # Reusable UI components
│   └── customer-card/    # Feature-specific component folder
│       ├── CustomerCard.jsx
│       ├── CustomerCard.module.css
│       └── CustomerCard.test.js
├── pages/               # Page components
│   ├── home.jsx
│   └── dashboard.jsx
├── utils/               # Helper functions & Constants
│   ├── constants.js     # Shared constants (LEAD_SOURCES, DEAL_STAGES, etc.)
│   ├── dateHelper.js    # Date formatting utilities
│   ├── authHelpers.js   # Authentication helpers
│   ├── formatDate.js    # Date formatting functions
│   ├── getColors.js     # Color utilities
│   └── tokenHelper.js   # Token management
└── data/                # Mock data and API functions
    └── index.js         # Centralized data exports
```

## 📚 Thông tin bổ sung

### 🔧 Cấu hình API Client

File `axiosInstance.js` trong tầng Infrastructure cung cấp các chức năng chính:

- **Token Management**: Tự động refresh token khi hết hạn
- **Authentication**: Thêm header Authorization và XApiKey cho mọi request
- **Error Handling**: Xử lý lỗi 401/403 và chuyển hướng đến trang unauthorized
- **Request/Response Interceptors**: Tùy chỉnh Content-Type và responseType
- **Concurrent Request Management**: Tránh gọi refresh token nhiều lần đồng thời

### 🧪 Development Tips

1. **Mock Data**: Dự án sử dụng mock data trong `src/data/` để phát triển frontend độc lập với backend
2. **Environment Variables**: Sử dụng `.env` files để cấu hình API endpoints và các biến môi trường
3. **Hot Reload**: Vite hỗ trợ hot reload nhanh chóng trong development mode
4. **Code Splitting**: Ứng dụng hỗ trợ lazy loading các routes để tối ưu performance

### 🚀 Deployment

Ứng dụng có thể được build và deploy bằng các lệnh:
```bash
npm run build        # Build cho development
npm run build:prod   # Build cho production
npm run preview      # Preview build locally
```

## 🎯 Lộ trình phát triển tiếp theo

### Giai đoạn 1: Hoàn thiện Backend APIs (Ưu tiên cao nhất)
- Phát triển đầy đủ các APIs cho Customer, Lead, Deal, Contact, Activity
- Integration với cơ sở dữ liệu thực tế
- Testing và tối ưu hóa performance

### Giai đoạn 2: Tính năng nâng cao
- Real-time notifications với SignalR
- Advanced search và filtering
- Data export/import functionality
- Mobile responsiveness optimization

### Giai đoạn 3: Tích hợp và mở rộng
- Third-party integrations (SharePoint, Dynamics, etc.)
- Advanced reporting và analytics
- Multi-language support
- Performance monitoring và optimization

---

**Last Updated**: 2025-10-21
**Version**: 1.0.0
**Status**: 🚧 **Đang phát triển Backend APIs**
