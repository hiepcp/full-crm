# Pipeline Logs - Implementation Guide

## 📋 Tổng Quan

Pipeline Logs là hệ thống ghi lại lịch sử thay đổi stage (giai đoạn) của các deal trong CRM. Điều này giúp theo dõi tiến trình bán hàng và phân tích hiệu quả của quy trình kinh doanh.

**🔄 Thay đổi từ phiên bản trước**: Hệ thống giờ sử dụng trạng thái quotation trực tiếp từ Dynamics 365 thay vì bảng `crm_quotation` nội bộ. Business rules được cập nhật theo Dynamics 365 statuses (Approved/Confirmed/Lost/Cancelled/Sent/Submitted/Revised/Modified/Created/Reset).

## 🗂️ Cấu Trúc Database

### Pipeline_Log Table
```sql
CREATE TABLE pipeline_log (
    id INT PRIMARY KEY IDENTITY(1,1),
    dealId INT NOT NULL,
    oldStage NVARCHAR(50) NOT NULL,
    newStage NVARCHAR(50) NOT NULL,
    changedBy NVARCHAR(100) NOT NULL,
    changedAt DATETIME2 NOT NULL,
    notes NVARCHAR(500),
    createdOn DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (dealId) REFERENCES deal(id)
);
```

## 🎯 Các Stage trong Pipeline

Các stage chuẩn trong quy trình bán hàng:
- **Prospecting**: Tìm kiếm và xác định khách hàng tiềm năng
- **Quotation**: Chuẩn bị báo giá chi tiết
- **Negotiation**: Thương lượng giá cả và điều khoản
- **Closed Won**: Chốt deal thành công
- **Closed Lost**: Mất deal

## 📊 Mock Data Structure

### File: `mockPipelineLogs.json`

```javascript
{
  "pipelineLogs": [
    {
      "id": 1,
      "dealId": 401,
      "oldStage": "Prospecting",
      "newStage": "Quotation",
      "changedBy": "sales@crm.com",
      "changedAt": "2025-10-01T10:00:00Z",
      "notes": "Initial quotation prepared for customer review"
    }
  ],
  "metadata": {
    "total": 13,
    "byDeal": {
      "401": 3,
      "402": 2
    },
    "byStageChange": {
      "Prospecting → Quotation": 4,
      "Quotation → Negotiation": 2
    }
  }
}
```

## 🔧 Helper Functions

### Các hàm cơ bản:
```javascript
import {
  getMockPipelineLogs,
  getMockPipelineLogById,
  getMockPipelineLogsByDeal,
  getMockPipelineLogsByStageChange
} from './src/data';

// Lấy tất cả pipeline logs
const allLogs = getMockPipelineLogs();

// Lấy pipeline log theo ID
const log = getMockPipelineLogById(1);

// Lấy tất cả pipeline logs của một deal cụ thể (sắp xếp theo thời gian giảm dần)
const dealLogs = getMockPipelineLogsByDeal(401);

// Lấy pipeline logs theo sự thay đổi stage
const stageChangeLogs = getMockPipelineLogsByStageChange('Prospecting', 'Quotation');
```

### Integration với Enriched Deal:
```javascript
import { getEnrichedDeal } from './src/data';

const enrichedDeal = getEnrichedDeal(401);
// enrichedDeal.pipelineLogs sẽ chứa lịch sử pipeline của deal đó
```

## 📈 Pipeline Logic Implementation

### Nguồn dữ liệu từ Dynamics 365

Pipeline logic sử dụng trạng thái quotation trực tiếp từ Dynamics 365 (`SalesQuotationHeadersV2.SalesQuotationStatus`) thay vì bảng nội bộ. Các quotation numbers được lưu trong bảng `crm_deal_quotation` để mapping với deals.

### Quy tắc tự động cập nhật stage (ưu tiên cao → thấp):

1. **Closed Won - Có ít nhất 1 quotation ở trạng thái thắng**:
   - Nếu có bất kỳ quotation nào có status = "Approved" hoặc "Confirmed"
   - Deal stage = "Closed Won"
   - Notes: "Stage updated based on Dynamics 365 quotation statuses: [list of statuses]"

2. **Closed Lost - Tất cả quotations đều thất bại**:
   - Nếu **tất cả** quotations có status = "Lost" hoặc "Cancelled"
   - Deal stage = "Closed Lost"
   - Notes: "Stage updated based on Dynamics 365 quotation statuses: [list of statuses]"

3. **Proposal - Có quotations đang xử lý active**:
   - Nếu có bất kỳ quotation nào có status trong {"Sent", "Submitted", "Revised", "Modified"}
   - Deal stage = "Proposal"
   - Notes: "Stage updated based on Dynamics 365 quotation statuses: [list of statuses]"

4. **Prospecting - Tất cả quotations ở trạng thái draft**:
   - Còn lại (chỉ có "Created", "Reset" hoặc chưa có quotation active)
   - Deal stage = "Prospecting"
   - Notes: "Stage updated based on Dynamics 365 quotation statuses: [list of statuses]"

### Workflow tự động:

```csharp
// Trigger từ webhook hoặc API call
public async Task EvaluateAndUpdateDealStageAsync(long dealId, string userEmail)
{
    // 1. Lấy quotation numbers từ bảng crm_deal_quotation
    var quotationNumbers = await GetQuotationNumbersByDealIdAsync(dealId);

    // 2. Query Dynamics 365 để lấy statuses
    var statuses = new List<string>();
    foreach (var quoteNum in quotationNumbers)
    {
        var status = await GetQuotationStatusFromDynamicsAsync(quoteNum);
        if (!string.IsNullOrEmpty(status)) statuses.Add(status);
    }

    // 3. Áp dụng business rules
    string newStage;
    if (statuses.Any(s => s == "Approved" || s == "Confirmed"))
        newStage = "Closed Won";
    else if (statuses.All(s => s == "Lost" || s == "Cancelled"))
        newStage = "Closed Lost";
    else if (statuses.Any(s => new[] {"Sent", "Submitted", "Revised", "Modified"}.Contains(s)))
        newStage = "Proposal";
    else
        newStage = "Prospecting";

    // 4. Cập nhật deal nếu stage thay đổi
    if (deal.Stage != newStage)
    {
        await UpdateDealStageAsync(dealId, newStage, userEmail);

        // 5. Ghi pipeline log
        await _pipelineLogService.LogStageChangeAsync(
            dealId, oldStage, newStage, userEmail,
            $"Stage updated based on Dynamics 365 quotation statuses: {string.Join(", ", statuses)}"
        );
    }
}
```

### Trigger Points:

1. **Webhook từ Dynamics 365**: Khi `SalesQuotationStatus` thay đổi
   ```
   POST /api/webhooks/dynamics/quotation-status-changed
   {
     "quotationNumber": "QT-001",
     "oldStatus": "Sent",
     "newStatus": "Approved"
   }
   ```

2. **Manual Evaluation**: API để force evaluate
   ```
   POST /api/deals/{dealId}/evaluate-pipeline
   ```

3. **Background Job**: Periodic check cho tất cả active deals

## 🎨 UI Components

### Pipeline Timeline Component
```jsx
import React from 'react';
import { getEnrichedDeal } from '../data';

const DealPipeline = ({ dealId }) => {
  const deal = getEnrichedDeal(dealId);

  return (
    <div className="pipeline-timeline">
      {deal.pipelineLogs.map(log => (
        <div key={log.id} className="pipeline-item">
          <div className="stage-change">
            {log.oldStage} → {log.newStage}
          </div>
          <div className="timestamp">
            {new Date(log.changedAt).toLocaleDateString()}
          </div>
          <div className="notes">{log.notes}</div>
          <div className="changedBy">By: {log.changedBy}</div>
        </div>
      ))}
    </div>
  );
};
```

## 📊 Dashboard Analytics

### Pipeline Performance Metrics:
- Thời gian trung bình ở mỗi stage
- Tỷ lệ chuyển đổi giữa các stage
- Stage bottleneck analysis
- Sales velocity tracking

### Sample Queries:
```sql
-- Thời gian trung bình ở mỗi stage
SELECT
    oldStage,
    AVG(DATEDIFF(day, changedAt, LEAD(changedAt) OVER(PARTITION BY dealId ORDER BY changedAt))) as avgDaysInStage
FROM pipeline_log
GROUP BY oldStage;

-- Tỷ lệ chuyển đổi từ Prospecting sang Closed Won
SELECT
    COUNT(CASE WHEN newStage = 'Closed Won' THEN 1 END) as wonDeals,
    COUNT(*) as totalDeals,
    CAST(COUNT(CASE WHEN newStage = 'Closed Won' THEN 1 END) AS FLOAT) / COUNT(*) * 100 as conversionRate
FROM pipeline_log
WHERE oldStage = 'Prospecting';

-- Pipeline efficiency theo Dynamics 365 status triggers
SELECT
    COUNT(*) as totalUpdates,
    COUNT(CASE WHEN notes LIKE '%Dynamics 365%' THEN 1 END) as dynamicsTriggered,
    COUNT(CASE WHEN notes LIKE '%dynamics-webhook%' THEN 1 END) as webhookTriggered
FROM pipeline_log
WHERE changedAt >= DATEADD(month, -1, GETDATE());
```

## 🚀 Best Practices

1. **Automated Logging**: Luôn ghi log tự động khi stage thay đổi
2. **Rich Notes**: Bao gồm lý do thay đổi và ngữ cảnh trong notes
3. **Performance Tracking**: Theo dõi thời gian ở mỗi stage
4. **Audit Trail**: Giữ lại lịch sử đầy đủ để phân tích và báo cáo
5. **User Attribution**: Ghi rõ ai thực hiện thay đổi

## 🔍 Troubleshooting

### Common Issues:
1. **Missing logs**: Đảm bảo trigger được kích hoạt đúng cách
2. **Performance**: Tối ưu query với index phù hợp
3. **Data consistency**: Validate stage transitions theo business rules

## ✅ Testing Checklist

### Backend Implementation
- [ ] `IDealQuotationStatusService` interface được implement đầy đủ
- [ ] `DealQuotationStatusService` logic xử lý đúng business rules
- [ ] API endpoint `/api/deals/{dealId}/evaluate-pipeline` hoạt động
- [ ] Webhook endpoint `/api/webhooks/dynamics/quotation-status-changed` nhận được
- [ ] Dynamics 365 integration gọi đúng OData queries
- [ ] Pipeline logs được tạo với notes chứa Dynamics statuses
- [ ] Deal stage updates theo đúng ưu tiên (Approved > Lost > Active > Draft)

### Integration Testing
- [ ] Webhook từ D365 trigger pipeline update thành công
- [ ] Multiple quotations per deal được xử lý đúng
- [ ] Error handling khi D365 API unavailable
- [ ] Concurrent updates không conflict

### Frontend/UI Testing
- [ ] Pipeline logs hiển thị đúng thứ tự thời gian
- [ ] Stage transitions hiển thị với notes từ Dynamics statuses
- [ ] UI phản ánh real-time changes từ D365
- [ ] Timeline component hoạt động với enriched deal data

---

**Created**: 2025-10-15
**Last Updated**: 2025-12-16
**Status**: ✅ Updated for Dynamics 365 Integration
