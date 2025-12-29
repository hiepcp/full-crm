## Kế hoạch CRUD Module (đa bảng theo DB_Schema) — OOP, MySQL

### 0) Phương pháp AI-first (Code AI First)
- Mục tiêu: tận dụng AI để sinh scaffolding, interface, validator, SQL khung; dev tập trung review, hoàn thiện nghiệp vụ và bảo mật.
- Quy ước làm việc với AI:
  - Prompt theo template (xem Phụ lục A), luôn nêu rõ bối cảnh dự án, path file đích, ràng buộc công nghệ (Dapper/EF), style và enum hợp lệ.
  - Sinh code từng mô-đun độc lập, commit nhỏ, chạy linter/build nhanh để feedback vòng ngắn.
  - Với file dài, yêu cầu AI tách phần tạo file và phần giải thích; chỉ nhận code/SQL hợp lệ, không nhận pseudo-code.
  - Bảo đảm an toàn: bắt buộc parameterized SQL, white-list cột order/filter, không chấp nhận string concat.
  - Reviewer (con người) chịu trách nhiệm: kiểm tra logic, bảo mật, index, hiệu năng và tính nhất quán naming.
  - AI Output must-run: Code sinh ra phải build được ngay hoặc có hướng dẫn cài deps cụ thể.

### 1) Mục tiêu
- Xây dựng các module CRUD cho nhiều bảng theo kiến trúc OOP, hỗ trợ:
  - Pagination (page, pageSize)
  - Filtering (theo nhiều trường và range)
  - Ordering (nhiều cột, ASC/DESC)
  - Top N record (giới hạn theo tiêu chí sắp xếp)
- Dữ liệu và schema dựa trên `rule/DB_Schema.csv` và các mock tương ứng (ví dụ: `mockLeads.json`, `mockCustomers.json`...).

### 2) Kiến trúc & Tổ chức mã nguồn (Clean Architecture, OOP)
- Domain (`CRM.Domain`)
  - Entity: `{Entity}` (kế thừa `BaseEntity` nếu phù hợp), tạo một entity cho mỗi bảng trong `DB_Schema.csv`.
    - Trường theo `DB_Schema.csv` (section của {Entity}).
  - Value Objects/Enums (nếu cần): ví dụ `{Entity}Status`, `{Entity}Source`.

- Application (`CRM.Application`)
  - DTOs
    - Request: `Create{Entity}Request`, `Update{Entity}Request`, `{Entity}QueryRequest` (pagination/filter/order/top), `BulkImport{Entity}Request` (tùy chọn)
    - Response: `{Entity}Response`, `PagedResult<T>`, `ApiResponse<T>`
  - Interfaces
    - `I{Entity}Repository`: CRUD + query có điều kiện
    - `I{Entity}Service`: nghiệp vụ cho {Entity}
  - Services
    - `{Entity}Service`: triển khai quy tắc nghiệp vụ, mapping DTO ↔ Entity; xử lý filter phức tạp.
  - Validators (FluentValidation)
    - `Create{Entity}RequestValidator`, `Update{Entity}RequestValidator`, `{Entity}QueryRequestValidator`

- Infrastructure (`CRM.Infrastructure`)
  - Repositories
    - `{Entity}Repository` (MySQL) triển khai `I{Entity}Repository`.
- SQL
    - `Sqls/Tables/{Entity}.sql`: DDL tạo bảng + index
    - Tách query `.sql` + SQL động tại repository với tham số hóa và white-list cột
      - `Sqls/Queries/{Entity}_SelectPaged.sql`
      - `Sqls/Queries/{Entity}_Count.sql`
  - DatabaseInit
    - Import seed từ mock tương ứng (ví dụ `mockLeads.json`, `mockCustomers.json`)

- API (`CRM.Api`)
  - Controller: `{Entity}Controller`
    - Endpoints REST: `GET /api/{entities}`, `GET /api/{entities}/{id}`, `POST /api/{entities}`, `PUT /api/{entities}/{id}`, `DELETE /api/{entities}/{id}`
    - Query nâng cao: chung trong `GET /api/{entities}` hoặc tách `/search`
  - Middleware: dùng `ValidationExceptionMiddleware`

### 3) Đặc tả API (mẫu áp dụng cho mọi {Entity})
- GET `/api/{entities}`
  - Query params:
    - Pagination: `page` (mặc định 1), `pageSize` (mặc định 20, tối đa 100)
    - Search: `q` (full-text đơn giản, cấu hình theo từng {Entity})
    - Filters (AND logic, nhiều giá trị cho 1 trường dùng OR-in):
      - Ví dụ (Lead): `Status`, `Source`, `OwnerId`, `ScoreMin/Max`, `IsConverted`, `CreatedFrom/To`, `UpdatedFrom/To`
    - Ordering: `orderBy` (comma list), mặc định theo từng {Entity} (ví dụ Lead: `-UpdatedOn`)
    - Top: `top` (ưu tiên trên pagination: nếu `top` có giá trị thì trả về min(top, pageSize) ở trang 1)
  - Response: `PagedResult<{Entity}Response>` bọc trong `ApiResponse`

- GET `/api/{entities}/{id}` → bản ghi đơn lẻ
- POST `/api/{entities}` → tạo mới (validate unique theo policy từng {Entity})
- PUT `/api/{entities}/{id}` → cập nhật
- DELETE `/api/{entities}/{id}` → xóa mềm hoặc xóa cứng theo policy

### 4) Repository Contract (giả lập chữ ký, áp dụng chung)
```text
Task<PagedResult<{Entity}>> QueryAsync({Entity}Query query);
Task<{Entity}?> GetByIdAsync(long id);
Task<long> CreateAsync({Entity} entity);
Task<bool> UpdateAsync({Entity} entity);
Task<bool> DeleteAsync(long id);
```

`{Entity}Query` gồm: pagination, search, filters, ordering, top.

### 5) Mapping CSV/Mocks → Entity
- Nguồn: `rule/DB_Schema.csv` (section theo từng {Entity}) và mock tương ứng.
- Ánh xạ chính: theo cột trong schema; ví dụ với Lead: `Email`, `Phone`, `FirstName`, `LastName`, `Company`, `Domain`, `Source`, `Status`, `OwnerId`, `Score`, ...
- Với mock không đủ trường, set mặc định hợp lý (null/0/enum default) theo từng {Entity}.

### 6) Thiết kế MySQL DDL (mẫu; ví dụ bảng Lead)
```sql
CREATE TABLE IF NOT EXISTS crm_lead (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(320) NULL,
  phone VARCHAR(64) NULL,
  firstName VARCHAR(128) NULL,
  lastName VARCHAR(128) NULL,
  company VARCHAR(255) NULL,
  domain VARCHAR(253) NULL,
  source ENUM('web','event','referral','ads','facebook','other') NULL,
  status ENUM('working','qualified','unqualified') NULL,
  ownerId BIGINT NULL,
  score INT NULL,
  isConverted TINYINT(1) NOT NULL DEFAULT 0,
  convertedAt DATETIME NULL,
  customerId BIGINT NULL,
  contactId BIGINT NULL,
  dealId BIGINT NULL,
  isDuplicate TINYINT(1) NOT NULL DEFAULT 0,
  duplicateOf BIGINT NULL,
  note TEXT NULL,
  followUpDate DATE NULL,
  createdOn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  createdBy VARCHAR(255) NULL,
  updatedOn DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  updatedBy VARCHAR(255) NULL,

  INDEX idx_crm_lead_email (email),
  INDEX idx_crm_lead_domain (domain),
  INDEX idx_crm_lead_owner (ownerId),
  INDEX idx_crm_lead_status (status),
  INDEX idx_crm_lead_source (source),
  INDEX idx_crm_lead_score (score),
  INDEX idx_crm_lead_created_on (createdOn),
  INDEX idx_crm_lead_updated_on (updatedOn)
);
```

Lưu ý:
- Tối ưu filter phổ biến bằng index: `idx_crm_lead_status`, `idx_crm_lead_source`, `idx_crm_lead_owner`, `idx_crm_lead_score`, `idx_crm_lead_created_on`, `idx_crm_lead_updated_on`.
- Full-text đơn giản: tạo index composite trên (`firstName`, `lastName`, `company`, `email`, `domain`) hoặc dùng `FULLTEXT` (MyISAM/InnoDB) nếu cần.

Áp dụng cho bảng khác: thay tên bảng, cột và index phù hợp theo `DB_Schema.csv`. Với các {Entity} khác, xác định set cột cần index dựa trên truy vấn điển hình của module đó.

### 7) Seed dữ liệu (đa bảng)
- Công cụ seed đề xuất:
  - Viết script .NET/Node đọc các mock JSON theo {Entity} → sinh `INSERT`.
  - Chuẩn bị file `Sqls/SampleData/{Entity}SampleData.sql` chứa sample data cho development/testing.
  - Chuẩn bị file `Sqls/Tables/{Entity}.seed.sql` chứa `INSERT` sinh tự động cho production.
- Quy tắc map:
  - Chuẩn hóa các enum theo giá trị CSV từng {Entity}.
  - Thời gian: nếu thiếu `createdOn`/`updatedOn` thì dùng `NOW()`.
  - Xử lý null an toàn cho `ownerId`, `convertedAt`, `customerId`...
- Ví dụ (rút gọn):
```sql
INSERT INTO crm_lead (email, phone, firstName, lastName, company, domain, source, status, ownerId, score, isConverted, createdOn)
VALUES
('henrik.kristensen@ilva.dk', '+45 75 55 11 37', 'Henrik', 'Kristensen', 'ILVA A/S', 'ilva.dk', 'web', 'new', 101, 75, 0, '2025-10-01 08:30:00');
```

### 8) Chiến lược Query: pagination/filter/order/top (generic)
- Input chuẩn hóa ở `LeadService` → chuyển thành `LeadQuery`.
- Ưu tiên `top`: nếu có `top` (>0) thì:
  - Bỏ qua `page`, `pageSize` hoặc cưỡng bức `page=1`, `pageSize=min(top, pageSizeMax)`.
  - Áp dụng `ORDER BY` trước, sau đó `LIMIT top`.
- Pagination chuẩn: `LIMIT @pageSize OFFSET (@page-1)*@pageSize`.
- Filter an toàn:
  - Dùng parameterized queries (Dapper/EF Core) để chống SQL Injection.
  - Xây dựng điều kiện động theo trường có giá trị.
- Ordering:
  - Cho phép nhiều cột: parse `orderBy` thành danh sách (field + direction).
  - White-list trường có thể sắp xếp: `createdOn`, `updatedOn`, `score`, `firstName`, `lastName`, `company`.

### 8.2) Filter Domain (Odoo-like) — JSON expression
- Mục tiêu: cho phép client gửi biểu thức filter động, dễ đọc và parse được máy.
- Định dạng: mảng JSON cho điều kiện đơn hoặc nhóm logic lồng nhau.

1) Điều kiện đơn
```json
["fieldName", "operator", "value"]
```

2) Nhóm logic
- AND: mảng gồm nhiều điều kiện/nhóm (mặc định AND)
```json
[["status", "=", "new"], ["score", ">=", 50]]
```
- OR: dùng từ khóa "|" trước mỗi điều kiện được OR
```json
["|", ["status", "=", "new"], ["status", "=", "working"]]
```
- NOT: dùng từ khóa "!" trước điều kiện/nhóm
```json
["!", ["is_deleted", "=", true]]
```
- Lồng nhau
```json
["|", [["owner_id", "=", 101], ["owner_id", "=", 102]], ["score", ">", 80]]
```

3) Toán tử hỗ trợ (white-list)
- So sánh: `=`, `!=`, `<`, `>`, `<=`, `>=`
- Tập hợp: `in`, `not in` (value là mảng)
- Kiểu chuỗi: `like`, `ilike`, `startswith`, `istartswith`, `endswith`, `iendswith`, `contains`, `icontains`
- Null: `is`, `is not` với `null`
- Khoảng: `between` (value là `[min,max]`)

4) Giá trị & kiểu dữ liệu
- Hỗ trợ: string, number, boolean, null, date/datetime (ISO 8601), array (cho `in`/`between`).
- Ngày/giờ: parse về UTC trong service trước khi bind tham số SQL.

5) Ánh xạ sang SQL an toàn (Dapper.SqlBuilder)
- White-list cột hợp lệ theo {Entity} (từ `DB_Schema.csv`).
- White-list toán tử → fragment SQL tương ứng, luôn parameterized.
- Thuật toán biên dịch (rút gọn):
  - Duyệt cây Domain theo tiền tố `|` (OR), `!` (NOT) và mảng AND mặc định.
  - Mỗi nút điều kiện chuyển thành biểu thức SQL có tham số (`@p1`, `@p2`, ...).
  - Gom nhóm bằng ngoặc `(...)` khi kết hợp OR/AND/NOT.
  - Ví dụ mapping: `ilike` → `LOWER(field) LIKE LOWER(@p)`; `contains` → `field LIKE CONCAT('%', @p, '%')`.

6) Truyền từ client
- Tham số query/body: `domain` là JSON string (URL-encoded nếu qua query string).
- Service parse `domain` → AST → SQL builder → WHERE fragment + params.

7) Ví dụ đầy đủ
```json
["|", [["status", "=", "new"], ["status", "=", "working"]], ["&", ["score", ">=", 70], ["createdOn", ">=", "2025-01-01T00:00:00Z"]]]
```
Gợi ý: thay `&` bằng mảng con để AND (chuẩn mặc định), hoặc cho phép ký hiệu `&` như Odoo nếu muốn tương thích cao.

8.1) Dapper không viết SQL trực tiếp trong C# (áp dụng chung)
- Dùng file `.sql` làm khung câu lệnh:
  - `{Entity}_SelectPaged.sql` ví dụ: `SELECT /*columns*/ FROM {table} /**where**/ /**orderby**/ LIMIT @take OFFSET @skip`
  - `{Entity}_Count.sql` ví dụ: `SELECT COUNT(1) FROM {table} /**where**/`
- Repository dùng `Dapper.SqlBuilder` để tiêm điều kiện động (đã white-list cột):
  - `sb.Where("status IN @status", new { status })`, `sb.Where("score BETWEEN @min AND @max", new { min, max })`
  - `sb.OrderBy("updated_on DESC")`
- CRUD đơn giản có thể dùng `Dapper.Contrib` để giảm SQL lặp lại.

### 8.3) Select Fields (Odoo-like) — Dynamic Field Selection
- Mục tiêu: cho phép client chỉ định các trường cần trả về, tối ưu bandwidth và performance.
- Định dạng: mảng string hoặc object JSON cho nested fields.

1) Cơ bản - Array of field names
```json
["id", "FirstName", "LastName", "email", "status", "score"]
```

2) Nested fields cho relations (nếu có)
```json
["id", "firstName", "lastName", "email", "owner.name", "owner.email"]
```

3) Wildcard cho tất cả fields
```json
["*"]
```

4) Exclude fields (prefix với !)
```json
["*", "!note", "!followUpDate"]
```

5) Group fields (virtual groups)
```json
["basic", "contact", "sales"]
```
Trong đó:
- `basic`: `["id", "firstName", "lastName", "company", "email"]`
- `contact`: `["phone", "domain", "source"]`
- `sales`: `["status", "score", "ownerId", "isConverted", "convertedAt"]`

6) Truyền từ client
- Query param: `fields=id,firstName,lastName,email` (comma-separated)
- Request body: `"fields": ["id", "firstName", "lastName", "email"]`

7) Validation & Security
- White-list fields hợp lệ theo entity
- Giới hạn số lượng fields tối đa (default: 50)
- Nested depth limit (default: 2 levels)
- Exclude sensitive fields tự động

8) Implementation
- Parse fields string/array → danh sách fields hợp lệ
- Build dynamic SELECT SQL với white-list
- Map response DTO động hoặc dùng Dictionary<string, object>
- Cache field metadata để performance

### 9) Controller hành vi (rút gọn, generic)
- GET `/api/{entities}` → nhận `{Entity}QueryRequest`, validate, gọi `{Entity}Service.QueryAsync` → trả `ApiResponse<PagedResult<{Entity}Response>>`.
- POST `/api/{entities}` → validate `Create{Entity}Request`, tạo {Entity}.
- PUT `/api/{entities}/{id}` → validate tồn tại, cập nhật các trường cho phép.
- DELETE `/api/{entities}/{id}` → xóa mềm (có thể thêm cột `isDeleted`) hoặc xóa cứng.

### 10) Validation chính (generic)
- `Create{Entity}Request`: validate format và business rule đặc thù {Entity} (ví dụ Lead: email format, score range, enum hợp lệ).
- `{Entity}QueryRequest`: `page ≥ 1`, `1 ≤ pageSize ≤ 100`, `orderBy` chỉ chứa trường hợp hợp lệ; `top` không âm.

### 11) Bảo mật & kiểm soát truy cập
- Áp dụng auth (JWT/OIDC) tại API.
- Ủy quyền theo `OwnerId`/role (Sales can view own leads, Admin can view all).
- Rate limiting nhẹ cho endpoint query nếu cần.

### 12) Kiểm thử
- Unit test `{Entity}Service` cho filter/order/top/pagination.
- Integration test repository với MySQL (test container/LocalDB) cho SQL động, index cover.
- API tests (Happy/Edge cases): tham số không hợp lệ, input trống, top + order, large page.

### 13) Kế hoạch triển khai theo bước (áp dụng cho mỗi {Entity})
1. Domain (AI-first): dùng prompt Phụ lục A.1 để sinh `{Entity}` entity + enum/VO theo `rule/DB_Schema.csv`; review naming.
2. Application (AI-first): dùng prompt Phụ lục A.2 để sinh DTOs, validators, interfaces `I{Entity}Repository`, `I{Entity}Service`.
3. Infrastructure (AI-first + review):
   - Dùng prompt Phụ lục A.3 để sinh `Sqls/Tables/{Entity}.sql` (DDL) + index.
   - Dùng prompt Phụ lục A.10 để sinh `Sqls/SampleData/{Entity}SampleData.sql` từ mock data.
   - Dùng prompt Phụ lục A.4 để sinh `{Entity}_SelectPaged.sql`, `{Entity}_Count.sql`.
   - Dùng prompt Phụ lục A.5 để sinh `{Entity}Repository` (Dapper, `SqlBuilder`, tham số hóa, white-list order).
   - Dùng prompt Phụ lục A.6 để sinh seeder mock → `{Entity}.seed.sql` hoặc tool nhỏ.
4. API (AI-first): dùng prompt Phụ lục A.7 để sinh `{Entity}Controller` + DI; mapping AutoMapper Entity ↔ DTO.
5. Middleware/Errors: dùng `ValidationExceptionMiddleware` sẵn có.
6. Tests (AI-first + refine): dùng prompt Phụ lục A.8 để sinh test khung; refine theo nghiệp vụ {Entity}.
7. Hiệu năng & index: EXPLAIN truy vấn; cập nhật index (prompt A.9 hỗ trợ).

### 14) Vị trí file/dự án dự kiến
- Domain: `src/CRM.Domain/Entities/{Entity}.cs`
- Application:
  - `src/CRM.Application/Dtos/Request/{Create,Update,{Entity}Query}{Entity}Request.cs`
  - `src/CRM.Application/Dtos/Response/{Entity}Response.cs`
  - `src/CRM.Application/Interfaces/Repositories/I{Entity}Repository.cs`
  - `src/CRM.Application/Interfaces/Services/I{Entity}Service.cs`
  - `src/CRM.Application/Services/{Entity}Service.cs`
  - `src/CRM.Application/Validators/{Create,Update,{Entity}Query}{Entity}RequestValidator.cs`
- Infrastructure:
  - `src/CRM.Infrastructure/Repositories/{Entity}Repository.cs`
  - `src/CRM.Infrastructure/Sqls/Tables/{Entity}.sql`
  - `src/CRM.Infrastructure/Sqls/Tables/{Entity}.seed.sql`
  - `src/CRM.Infrastructure/Sqls/SampleData/{Entity}SampleData.sql`
  - `src/CRM.Infrastructure/Sqls/Queries/{Entity}_SelectPaged.sql`
  - `src/CRM.Infrastructure/Sqls/Queries/{Entity}_Count.sql`
  - `src/CRM.Infrastructure/DatabaseInit/DatabaseInitializer.cs` cập nhật để chạy DDL/seed
- API:
  - `src/CRM.Api/Controllers/{Entity}Controller.cs`
  - `src/CRM.Api/appsettings.json` thêm connection MySQL nếu chưa có

### 15) Ghi chú triển khai nhanh
- Tất cả bảng sử dụng tiền tố `crm_` (ví dụ: `crm_lead`, `crm_customer`, `crm_contact`, `crm_deal`...)
- Sample data cho development/testing ở folder `Sqls/SampleData/`; production seed ở `Sqls/Tables/*.seed.sql`
- Có thể tái sử dụng `ApiResponse` và pattern dịch vụ/repository hiện có trong dự án (`CRMCategory` làm mẫu cấu trúc).
- Với EF Core: dùng `IQueryable` + biểu thức động (System.Linq.Dynamic.Core) cho filter/order; Pagination bằng `Skip/Take`.
- Với Dapper: xây câu lệnh SQL động có white-list cột, tham số hóa.

### Phụ lục A) Prompt templates AI-first (rút gọn, dùng {Entity})

1) A.1 — Sinh Domain Entity `{Entity}`
```text
Ngữ cảnh: Dự án CRM .NET, kiến trúc theo file `plan.md`. Tạo `src/CRM.Domain/Entities/{Entity}.cs`.
Yêu cầu: Entity {Entity} theo `rule/DB_Schema.csv` (section {Entity}) và mục 6) DDL. Thêm enum/VO cần thiết. Nullable hợp lý. Không thêm logic vượt quá entity. Code C# build được.
Ràng buộc: Tuân thủ naming C#, DateTime UTC, dùng long cho BIGINT.
```

2) A.2 — DTOs, Validators, Interfaces
```text
Sinh các file:
- `src/CRM.Application/Dtos/Request/{Create,Update,{Entity}Query}{Entity}Request.cs`
- `src/CRM.Application/Dtos/Response/{Entity}Response.cs`
- `src/CRM.Application/Interfaces/Repositories/I{Entity}Repository.cs`
- `src/CRM.Application/Interfaces/Services/I{Entity}Service.cs`
- `src/CRM.Application/Validators/{Create,Update,{Entity}Query}{Entity}RequestValidator.cs`
Yêu cầu: Theo mục 2) & 10) của plan, dùng FluentValidation, `PagedResult<T>`, `ApiResponse<T>` có sẵn. Không dùng pseudo-code.
```

3) A.3 — DDL `{Entity}.sql`
```text
Tạo `src/CRM.Infrastructure/Sqls/Tables/{Entity}.sql` theo mục 6). Tên bảng sử dụng tiền tố `crm_{Entity}` (viết thường). Đảm bảo index và ENUM đúng giá trị. Không thêm trigger.
```

4) A.4 — Query khung `{Entity}_SelectPaged.sql`, `{Entity}_Count.sql`
```text
Tạo `src/CRM.Infrastructure/Sqls/Queries/{Entity}_SelectPaged.sql` và `{Entity}_Count.sql` theo mục 8.1). Tên bảng: `crm_{Entity}`. Có /**where**/, /**orderby**/, LIMIT @take OFFSET @skip.
```

5) A.5 — `{Entity}Repository` (Dapper)
```text
Tạo `src/CRM.Infrastructure/Repositories/{Entity}Repository.cs` triển khai `I{Entity}Repository`.
Yêu cầu: Dapper `SqlBuilder`, parameterized, white-list order theo {Entity}. Map DTO→Entity. CRUD cơ bản có thể dùng Dapper.Contrib.
```

6) A.6 — Seeder từ mock JSON
```text
Sinh tool .NET nhỏ hoặc script để đọc mock JSON theo {Entity} (ví dụ `mockLeads.json`) → tạo `{Entity}.seed.sql` chèn data hợp lệ (theo enum). Tên bảng: `crm_{Entity}`. Lưu ở `src/CRM.Infrastructure/Sqls/Tables/{Entity}.seed.sql`.
```

7) A.7 — API Controller
```text
Tạo `src/CRM.Api/Controllers/{Entity}Controller.cs` với endpoints mục 3). Wire DI. Mapping AutoMapper. Trả `ApiResponse<PagedResult<{Entity}Response>>`.
```

8) A.8 — Tests khung
```text
Sinh unit tests cho `{Entity}Service` (filter/order/top/pagination), integration tests cho repository (MySQL test container), API tests cơ bản.
```

9) A.9 — Tối ưu index
```text
Dựa vào EXPLAIN truy vấn phổ biến, đề xuất thêm/bớt index; sinh SQL ALTER tương ứng, kèm lưu ý chi phí write.
```

10) A.10 — Sample Data Script
```text
Tạo `src/CRM.Infrastructure/Sqls/SampleData/{Entity}SampleData.sql` với INSERT statements từ mock JSON.
Yêu cầu: Tên bảng `crm_{Entity}`, xử lý NULL đúng cách, format datetime cho MySQL, disable/enable foreign key checks. Include USE database statement và success message.
```

11) A.11 — Compiler Domain Filter
```text
Tạo `src/CRM.Application/Filtering/{DomainFilterCompiler,IDomainFilterCompiler,DomainFilterResult}.cs`.
Yêu cầu: Nhận `domain` (JSON string/JSON object), danh sách allowedFields, map field→column. Trả về where-clause an toàn và tham số. Hỗ trợ toán tử: =, !=, <, >, <=, >=, in, not in, between, like/ilike/startswith/istartswith/endswith/iendswith/contains/icontains, is/is not null/boolean, nhóm | (OR), ! (NOT), & (AND) và AND mặc định theo mảng.
```
