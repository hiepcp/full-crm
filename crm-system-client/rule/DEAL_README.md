Tài liệu này mô tả business logic điều khiển stage của Deal dựa trên trạng thái Quotation lấy trực tiếp từ Dynamics 365 (`SalesQuotationHeadersV2.SalesQuotationStatus`). Không dùng bảng `crm_quotation` hay `crm_deal_quotation` nội bộ; `QuotationNumber` được dùng để tra trạng thái trên D365.

🧭 1. Vấn đề cốt lõi  
Một deal có nhiều Quotation (theo `QuotationNumber`) và mỗi Quotation có trạng thái riêng trên Dynamics 365. Deal chỉ có một stage tổng thể, nên cần chọn stage theo trạng thái ưu tiên cao nhất của các Quotation liên quan.

📑 2. Nguồn trạng thái từ Dynamics 365  
`SalesQuotationStatus` (D365) gồm: `Created, Sent, Confirmed, Lost, Cancelled, Reset, Modified, Submitted, Approved, Revised`.

⚙️ 3. Quy tắc xác định stage (ưu tiên cao → thấp)  
- Có ít nhất 1 Quotation ở trạng thái **Approved** hoặc **Confirmed** → Deal stage = **Closed Won** (chốt thắng).  
- Ngược lại, nếu **tất cả** Quotation nằm trong {**Lost**, **Cancelled**} → Deal stage = **Closed Lost** (mất).  
- Ngược lại, nếu có bất kỳ Quotation trong {**Sent**, **Submitted**, **Revised**, **Modified**} → Deal stage = **Proposal** (hoặc `Quotation`/`Negotiation` tùy naming, nhưng nhất quán trong hệ thống).  
- Còn lại (chỉ có `Created`, `Reset` hoặc chưa có Quotation active) → Deal stage = **Prospecting** (hoặc giữ nguyên nếu đã cao hơn và không được phép hạ cấp).

Lưu ý:  
- Nếu đồng thời tồn tại trạng thái thắng (Approved/Confirmed) và thua (Lost/Cancelled), ưu tiên **Closed Won**.  
- Chỉ chuyển stage khi có thay đổi thực sự; không hạ stage khi deal đã `Closed Won` hoặc `Closed Lost` trừ khi có quyết định override thủ công.

🔒 4. Lock sau khi chốt  
- Khi stage vào `Closed Won` hoặc `Closed Lost`: đánh dấu `is_closed = true`, khóa stage không tự động lùi xuống các stage thấp hơn.

⚡ 5. Trigger / Workflow gợi ý  
- Trigger khi `SalesQuotationStatus` trên D365 thay đổi cho bất kỳ `QuotationNumber` nào gắn với Deal.  
- Lấy tất cả status hiện tại của các Quotation của deal → áp dụng quy tắc ưu tiên ở mục 3 → cập nhật `deal.Stage` (và cờ đóng) nếu thay đổi.  
- Mỗi lần stage đổi, ghi log vào Pipeline_Log (xem [PIPELINE_README.md](./PIPELINE_README.md)).

🧩 6. Ví dụ minh họa  
- Q001 = `Sent`, Q002 = `Submitted`, Q003 = `Approved` → Deal → **Closed Won**.  
- Q001 = `Lost`, Q002 = `Cancelled` → Deal → **Closed Lost**.  
- Q001 = `Sent`, Q002 = `Revised` → Deal → **Proposal**.  
- Q001 = `Created` → Deal → **Prospecting** (nếu trước đó chưa cao hơn).

📋 7. Tóm tắt nhanh  
- Win: có `Approved` hoặc `Confirmed` → **Closed Won**  
- Lost: tất cả `Lost`/`Cancelled` → **Closed Lost**  
- Pending/đang xử lý: có `Sent`/`Submitted`/`Revised`/`Modified` → **Proposal**  
- Draft/reset/chưa gửi: chỉ `Created`/`Reset` → **Prospecting**

📖 **Xem thêm**:  
- [PIPELINE_README.md](./PIPELINE_README.md) về pipeline logs và cách triển khai  
- [DEAL_UI_README.md](./DEAL_UI_README.md) về giao diện pipeline (progress bar)

---

**Last Updated**: 2025-12-16