# Mock Data Documentation

Thư mục này chứa dữ liệu giả lập (mock data) cho CRM system dựa trên database schema và wireframe specification.

## 📁 Cấu trúc Files

- `mockLeads.json` - Dữ liệu giả lập cho bảng Leads
- `mockActivities.json` - Dữ liệu giả lập cho bảng Activities
- `mockCustomers.json` - Dữ liệu giả lập cho bảng Customers
- `mockContacts.json` - Dữ liệu giả lập cho bảng Contacts
- `mockDeals.json` - Dữ liệu giả lập cho bảng Deals
- `index.js` - Export và helper functions để truy xuất mock data

## 🚀 Cách sử dụng

### Import Basic Data

```javascript
import {
  mockLeads,
  mockActivities,
  mockCustomers,
  mockContacts,
  mockDeals
} from '@/data';

// Lấy tất cả leads
const allLeads = mockLeads.leads;

// Lấy metadata
const leadsMetadata = mockLeads.metadata;
```

### Sử dụng Helper Functions

```javascript
import { 
  getMockLeads,
  getMockLeadById,
  getMockLeadsByStatus,
  getMockActivitiesByRelation,
  getEnrichedLead,
  getDashboardStats
} from '@/data';

// Lấy tất cả leads
const leads = getMockLeads();

// Lấy lead theo ID
const lead = getMockLeadById(1);

// Lấy leads theo status
const newLeads = getMockLeadsByStatus('new');
const workingLeads = getMockLeadsByStatus('working');

// Lấy activities liên quan đến một lead
const leadActivities = getMockActivitiesByRelation('lead', 1);

// Lấy lead với đầy đủ thông tin liên quan (activities, customer, contact, deal)
const enrichedLead = getEnrichedLead(3);

// Lấy thống kê cho dashboard
const stats = getDashboardStats();
console.log(stats.leads.total); // Tổng số leads
console.log(stats.deals.totalExpectedRevenue); // Tổng doanh thu từ deals
```

### Trong React Components

```javascript
import React, { useState, useEffect } from 'react';
import { getMockLeads, getMockLeadsByStatus } from '@/data';

const LeadsPage = () => {
  const [leads, setLeads] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (filter === 'all') {
      setLeads(getMockLeads());
    } else {
      setLeads(getMockLeadsByStatus(filter));
    }
  }, [filter]);

  return (
    <div>
      <select onChange={(e) => setFilter(e.target.value)}>
        <option value="all">All Leads</option>
        <option value="new">New</option>
        <option value="working">Working</option>
        <option value="qualified">Qualified</option>
        <option value="unqualified">Unqualified</option>
      </select>
      
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Company</th>
            <th>Email</th>
            <th>Status</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {leads.map(lead => (
            <tr key={lead.id}>
              <td>{lead.firstName} {lead.lastName}</td>
              <td>{lead.company}</td>
              <td>{lead.email}</td>
              <td>{lead.status}</td>
              <td>{lead.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

## 📊 Data Structure

### Leads
- **Total**: 15 leads
- **Statuses**: working (5), qualified (3), unqualified (1)
- **Sources**: web (4), event (3), referral (3), ads (3), facebook (2), other (1)
- **Converted**: 2 leads đã được convert thành customers

### Customers
- **Total**: 5 customers
- **Types**: Customer (3), Prospect (1), Partner (1)

### Contacts
- **Total**: 8 contacts
- **Primary contacts**: 5
- **Distribution**: Mỗi customer có 1-2 contacts

### Deals
- **Total**: 8 deals
- **Stages**: Prospecting (2), Quotation (4), Negotiation (1), Closed Won (1)
- **Total Expected Revenue**: $361,000
- **Average Deal Size**: $45,125

### Activities
- **Total**: 15 activities
- **Types**: email (5), call (3), meeting (2), task (4), note (1)
- **Statuses**: open (3), in_progress (2), completed (10)
- **Priorities**: low (2), normal (5), high (8)

## 🔗 Relationships

### Lead to Customer Conversion
- Lead ID 3 → Customer ID 201, Contact ID 301, Deal ID 401
- Lead ID 12 → Customer ID 202, Contact ID 302, Deal ID 402

### Customer to Contacts
- Customer 201 (StartupXYZ) → Contacts 301, 303
- Customer 202 (Logistics Solutions) → Contacts 302, 307
- Customer 203 (Digital Marketing Pro) → Contact 304
- Customer 204 (Tech Solutions) → Contact 305
- Customer 205 (E-Commerce Ventures) → Contacts 306, 308

### Customer to Deals
- Customer 201 → Deals 401, 406
- Customer 202 → Deals 402, 407
- Customer 203 → Deal 403
- Customer 204 → Deal 404
- Customer 205 → Deals 405, 408

### Activities to Entities
- Activities liên kết với leads và deals thông qua `relationType` và `relationId`

## 🎯 Use Cases

### 1. Hiển thị Lead Timeline
```javascript
import { getEnrichedLead } from '@/data';

const LeadDetail = ({ leadId }) => {
  const lead = getEnrichedLead(leadId);
  
  return (
    <div>
      <h2>{lead.firstName} {lead.lastName}</h2>
      <div>
        <h3>Activities Timeline</h3>
        {lead.activities.map(activity => (
          <div key={activity.id}>
            <p>{activity.subject}</p>
            <small>{activity.createdOn}</small>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 2. Dashboard Statistics
```javascript
import { getDashboardStats } from '@/data';

const Dashboard = () => {
  const stats = getDashboardStats();
  
  return (
    <div>
      <div>Total Leads: {stats.leads.total}</div>
      <div>Total Revenue: ${stats.deals.totalExpectedRevenue.toLocaleString()}</div>
      <div>Avg Deal Size: ${stats.deals.averageExpectedDealSize.toLocaleString()}</div>
    </div>
  );
};
```

### 3. Customer với đầy đủ thông tin
```javascript
import { getEnrichedCustomer } from '@/data';

const CustomerDetail = ({ customerId }) => {
  const customer = getEnrichedCustomer(customerId);
  
  return (
    <div>
      <h2>{customer.name}</h2>
      <div>
        <h3>Contacts ({customer.contacts.length})</h3>
        {customer.contacts.map(contact => (
          <div key={contact.id}>
            {contact.firstName} {contact.lastName} - {contact.jobTitle}
          </div>
        ))}
      </div>
      <div>
        <h3>Deals ({customer.deals.length})</h3>
        {customer.deals.map(deal => (
          <div key={deal.id}>
            {deal.name} - {deal.stage} - ${deal.expectedRevenue}
          </div>
        ))}
      </div>
    </div>
  );
};
```

## 🔄 Migration to Real API

Khi sẵn sàng migrate sang real API, chỉ cần thay đổi import statements:

**Before (Mock Data):**
```javascript
import { getMockLeads } from '@/data';
const leads = getMockLeads();
```

**After (Real API):**
```javascript
import { getLeads } from '@/api';
const leads = await getLeads();
```

## 📝 Notes

- Tất cả dates sử dụng format ISO 8601 (YYYY-MM-DDTHH:mm:ssZ)
- Phone numbers có format Vietnam (+84)
- Email addresses đều valid format
- IDs là unique integers
- Foreign key relationships được maintain đúng theo database schema
- Mock data bao gồm cả metadata để dễ dàng testing và development

## 🛠️ Development Tips

1. **Testing Components**: Sử dụng mock data để test components mà không cần backend
2. **Prototyping**: Dùng để build UI/UX nhanh chóng
3. **Demo**: Dùng cho việc demo features cho stakeholders
4. **Unit Tests**: Import mock data vào unit tests
5. **Storybook**: Sử dụng với Storybook để document components

---

Generated based on `db.sql` schema and `Wireframe.md` specifications.

