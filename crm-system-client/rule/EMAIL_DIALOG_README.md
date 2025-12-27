# Dialog Chọn Email - Component AddActivityForm

## Tổng quan
Dialog Chọn Email là một tính năng quan trọng trong component `AddActivityForm` cho phép người dùng đồng bộ và chọn email từ hộp thư đến để tạo hoạt động. Dialog này cung cấp tích hợp liền mạch giữa hệ thống email và hoạt động CRM.

## Cấu trúc Component

### Bố cục Dialog
```jsx
<Dialog
  open={emailDialog.emailDialogOpen}
  onClose={emailDialog.handleCloseEmailDialog}
  maxWidth="lg"
  fullWidth
>
```

### Các Phần của Dialog

#### 1. Header của Dialog
- **Tiêu đề**: "Select Email for Activity"
- **Phụ đề**: "Choose an email to create an activity from"
- **Mục đích**: Cung cấp ngữ cảnh rõ ràng về chức năng của dialog

#### 2. Nội dung Dialog
Chứa `EmailListComponent` với các tính năng quản lý email toàn diện:

```jsx
<EmailListComponent
  emails={emailDialog.emails}
  selectedEmail={emailDialog.selectedEmail}
  onEmailSelect={emailDialog.handleEmailSelect}
  loading={emailDialog.emailLoading}
  loadingMore={emailDialog.loadingMoreEmails}
  hasMore={emailDialog.hasMoreEmails}
  onLoadMore={emailDialog.loadMoreEmails}
  onConnectEmail={handleConnectEmail}
  tokenExpired={emailDialog.tokenExpired}
  notConnected={!isConnected}
  totalCount={emailDialog.totalEmails}
  folders={emailDialog.mailFolders}
  selectedFolderId={emailDialog.selectedFolderId}
  onFolderSelect={emailDialog.handleFolderSelect}
  foldersLoading={emailDialog.foldersLoading}
/>
```

#### 3. Overlay Loading
Trạng thái loading động với thông báo theo ngữ cảnh:

```jsx
{(emailDialog.emailLoading || emailDialog.confirmingEmail) && (
  <Box sx={{...}}>
    <CircularProgress size={40} sx={{ mb: 2 }} />
    <Typography variant="body1" sx={{ textAlign: 'center' }}>
      {emailDialog.confirmingEmail ? 'Loading Email Details...' : 'Loading Emails...'}
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 1 }}>
      {emailDialog.confirmingEmail ? 'Please wait while we fetch the email details' : 'Please wait while we load your emails'}
    </Typography>
  </Box>
)}
```

#### 4. Hành động Dialog
```jsx
<DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
  <Button onClick={emailDialog.handleCloseEmailDialog} variant="outlined">
    Cancel
  </Button>
  <Button
    onClick={handleConfirmEmail}
    variant="contained"
    disabled={!emailDialog.selectedEmail || emailDialog.confirmingEmail}
  >
    {emailDialog.confirmingEmail ? 'Loading Email...' : 'Use Selected Email'}
  </Button>
</DialogActions>
```

## Tính năng Chính

### 1. Đồng bộ Email
- **Kích hoạt**: Nút "Synchronize from your Email Inbox"
- **Chức năng**: `emailDialog.handleOpenEmailDialog(isConnected)`
- **Kiểm tra kết nối**: Xác thực trạng thái kết nối email trước khi mở dialog

### 2. Quản lý Kết nối Email
```jsx
const handleConnectEmail = async () => {
  emailDialog.setTokenExpired(false);
  emailDialog.setEmails([]);
  emailDialog.setEmailLoading(true);

  try {
    const result = await connect();
    if (result.success) {
      await emailDialog.loadMailFolders();
      await emailDialog.loadEmailsForActivityCreation();
    }
  } catch (error) {
    console.error('Error connecting email:', error);
  }
};
```

### 3. Chọn và Xác nhận Email
```jsx
const handleConfirmEmail = async () => {
  const result = await emailDialog.handleConfirmEmailSelection((emailData) => {
    // Update form with email data
    activityForm.updateFormData({
      activityCategory: 'email',
      subject: ` ${emailData.subject}`,
      emailFrom: emailData.sender?.address || emailData.sender?.emailAddress?.address || '',
      emailRecipient: emailData.recipients.map(r => r.emailAddress?.address || r.address || ''),
      conversationId: emailData.conversationId,
      person: [],
    });

    activityForm.setDescription(emailData.body);
  });
};
```

### 4. Quản lý Thư mục
- **Hiển thị thư mục**: Hiển thị các thư mục email có sẵn
- **Chọn thư mục**: Cho phép lọc email theo thư mục
- **Trạng thái loading**: Trạng thái loading riêng cho thao tác thư mục

### 5. Hỗ trợ Phân trang
- **Tải thêm**: `onLoadMore={emailDialog.loadMoreEmails}`
- **Có thêm**: `hasMore={emailDialog.hasMoreEmails}`
- **Đang tải thêm**: Chỉ báo trực quan cho việc tải thêm email

### 6. Lọc bỏ Chữ ký Email
- **Tự động phát hiện**: Phát hiện các separator như "---", "--", "___"
- **Pattern chữ ký**: Nhận diện "Best regards", "Regards", thông tin liên hệ, v.v.
- **Lọc nội dung**: Chỉ lấy phần nội dung chính, loại bỏ phần chữ ký và thông tin liên hệ

## Luồng Dữ liệu

### Quy trình Chọn Email
1. **Người dùng click** "Synchronize from your Email Inbox"
2. **Dialog mở** với danh sách email đang tải
3. **Thư mục tải** và người dùng có thể chọn thư mục cụ thể
4. **Email tải** trong thư mục đã chọn với phân trang
5. **Người dùng chọn** một email từ danh sách
6. **Người dùng click** "Use Selected Email"
7. **Dữ liệu email** điền vào form hoạt động
8. **Dialog đóng** và form hoạt động sẵn sàng để lưu

### Ánh xạ Dữ liệu Email
Khi một email được chọn, dữ liệu sau sẽ được ánh xạ vào form hoạt động:

```javascript
{
  activityCategory: 'email',
  subject: ` ${emailData.subject}`,
  emailFrom: emailData.sender?.address || emailData.sender?.emailAddress?.address || '',
  emailRecipient: emailData.recipients.map(r => r.emailAddress?.address || r.address || ''),
  conversationId: emailData.conversationId,
  person: [],
}
```

**Mô tả**: `emailData.body` được xử lý qua `extractEmailContent()` để lọc bỏ chữ ký và chỉ lấy phần nội dung chính, sau đó được đặt làm mô tả hoạt động.

## Quản lý Trạng thái

### Các Trạng thái Dialog Email
- `emailDialogOpen`: Kiểm soát hiển thị dialog
- `emails`: Mảng các đối tượng email
- `selectedEmail`: Email hiện đang được chọn
- `emailLoading`: Trạng thái loading cho việc tải email ban đầu
- `loadingMoreEmails`: Trạng thái loading cho phân trang
- `hasMoreEmails`: Boolean chỉ ra có thêm email khả dụng
- `confirmingEmail`: Trạng thái loading trong quá trình xác nhận email
- `tokenExpired`: Trạng thái token xác thực
- `totalEmails`: Tổng số lượng email
- `mailFolders`: Các thư mục email có sẵn
- `selectedFolderId`: Thư mục hiện đang được chọn
- `foldersLoading`: Trạng thái loading cho việc tải thư mục

## Xử lý Lỗi

### Vấn đề Kết nối
- **Chưa kết nối**: Hiển thị lời nhắc kết nối trong EmailListComponent
- **Token hết hạn**: Hiển thị thông báo token hết hạn
- **Lỗi kết nối**: Được ghi log vào console với phản hồi người dùng

### Trạng thái Loading
- **Nhiều Overlay Loading**: Thông báo khác nhau cho các trạng thái loading khác nhau
- **Vô hiệu hóa nút**: Ngăn chặn hành động trong khi loading/xác nhận
- **Giảm cấp nhẹ nhàng**: Tiếp tục hoạt động ngay cả khi có lỗi một phần

## Điểm Tích hợp

### Context Kết nối Email
```jsx
import { useEmailConnection } from '@app/contexts/EmailConnectionContext';
const { isConnected, connect } = useEmailConnection();
```

### Hook Dialog Email
```jsx
import { useEmailDialog } from './hooks/useEmailDialog';
const emailDialog = useEmailDialog();
```

### Tích hợp Form Hoạt động
- **Cập nhật Form**: Dữ liệu email điền vào các trường form
- **Thiết lập danh mục**: Tự động đặt danh mục thành 'email'
- **Đồng bộ mô tả**: Nội dung email trở thành mô tả hoạt động

## Logic nghiệp vụ

### Tạo Hoạt động Email
1. **Kiểm tra cuộc trò chuyện**: Xác thực xem cuộc trò chuyện đã có hoạt động chưa
2. **Ngăn ngừa trùng lặp**: Cập nhật hoạt động hiện có thay vì tạo trùng lặp
3. **Lọc nội dung email**: Sử dụng `extractEmailContent()` để loại bỏ chữ ký và thông tin liên hệ
4. **Tạo bản ghi email**: Tạo mục trong bảng `crm_email`
5. **Liên kết hoạt động**: Liên kết email với hoạt động qua `conversationId`

### Tổ chức Dựa trên Thư mục
- **Thư mục mặc định**: Inbox hoặc thư mục chính
- **Lọc thư mục**: Email được lọc theo thư mục đã chọn
- **Lưu trữ thư mục**: Duy trì lựa chọn thư mục qua các phiên

## Cân nhắc UI/UX

### Trạng thái Loading
- **Loading Tiến triển**: Tải ban đầu, sau đó phân trang
- **Thông báo Theo ngữ cảnh**: Thông báo khác nhau cho các thao tác khác nhau
- **Phản hồi Trực quan**: Chỉ báo vòng tròn với văn bản mô tả

### Khả năng Tiếp cận
- **Điều hướng Bàn phím**: Dialog hỗ trợ tương tác bàn phím
- **Đọc màn hình**: Nhãn ARIA và HTML ngữ nghĩa phù hợp
- **Quản lý Tiêu điểm**: Tiêu điểm bị mắc kẹt trong dialog trong tương tác

### Thiết kế Phản hồi
- **Đầy chiều rộng**: Dialog sử dụng prop `fullWidth`
- **Chiều rộng tối đa lớn**: `maxWidth="lg"` để hiển thị nội dung tối ưu
- **Bố cục Linh hoạt**: Thích ứng với các kích thước màn hình khác nhau

## Tối ưu hóa Hiệu suất

### Phân trang
- **Lazy Loading**: Email được tải theo từng phần
- **Quản lý Bộ nhớ**: Ngăn tải tất cả email cùng lúc
- **Cập nhật UI Tăng dần**: UI cập nhật khi dữ liệu tải

### Hiệu quả Kết nối
- **Tái sử dụng Token**: Tái sử dụng kết nối hiện có khi có thể
- **Khôi phục Lỗi**: Xử lý nhẹ nhàng các lỗi kết nối
- **Lưu trữ Trạng thái**: Duy trì trạng thái qua các lần kết nối lại

## Cải tiến Tương lai

### Cải thiện Tiềm năng
1. **Chức năng Tìm kiếm**: Thêm tìm kiếm email trong dialog
2. **Chọn Hàng loạt**: Cho phép chọn nhiều email
3. **Xem trước Email**: Xem trước email nâng cao trong dialog
4. **Xử lý Đính kèm**: Nhập trực tiếp đính kèm từ email
5. **Mẫu Email**: Mẫu hoạt động được định nghĩa trước dựa trên nội dung email

### Phần mở rộng Tích hợp
1. **Đồng bộ Lịch**: Tích hợp cuộc hẹn nâng cao
2. **Nhận diện Liên hệ**: Liên kết liên hệ tự động từ địa chỉ email
3. **Phân loại Email**: Phân loại email dựa trên AI
4. **Lập lịch Theo dõi**: Tạo hoạt động theo dõi tự động

## Phụ thuộc

### Thư viện Bên ngoài
- **Material-UI**: Các component Dialog, Button, Typography
- **Email Connection Context**: Quản lý tích hợp email
- **Email Dialog Hook**: Quản lý trạng thái dialog

### Component Nội bộ
- **EmailListComponent**: Hiển thị và chọn email
- **Activity Form**: Tích hợp form cha
- **Email Helpers**: Tiện ích ánh xạ dữ liệu

## Cân nhắc Kiểm thử

### Kịch bản Kiểm thử
1. **Trạng thái Kết nối**: Đã kết nối, chưa kết nối, token hết hạn
2. **Tải Email**: Tải ban đầu, phân trang, trạng thái lỗi
3. **Luồng Chọn**: Chọn email, xác nhận, điền form
4. **Quản lý Thư mục**: Tải thư mục, chọn, lọc
5. **Xử lý Lỗi**: Lỗi mạng, lỗi xác thực

### Kiểm thử Tích hợp
1. **Luồng End-to-End**: Quy trình hoàn chỉnh tạo hoạt động từ email
2. **Lưu trữ Dữ liệu**: Dữ liệu email được lưu đúng vào cơ sở dữ liệu
3. **Tính nhất quán UI**: Hành vi dialog trên các thiết bị khác nhau
4. **Hiệu suất**: Thời gian tải và sử dụng bộ nhớ

Dialog chọn email này đại diện cho sự tích hợp tinh vi giữa hệ thống email và hoạt động CRM, cung cấp cho người dùng cách liền mạch để chuyển đổi giao tiếp email thành hoạt động có thể theo dõi trong hệ thống CRM.