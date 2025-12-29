# ResAuthApi

Hệ thống **Authentication API** 
sử dụng kiến trúc **Clean Architecture** để quản lý xác thực người dùng qua **Azure AD** và cấp phát **JWT Access Token** + **Refresh Token** an toàn.  
Hỗ trợ cơ chế **Refresh Token Rotation**, thu hồi token, và dọn dẹp token hết hạn định kỳ.

---

## 📑 Mục lục
1. [Tính năng](#-tính-năng)
2. [Kiến trúc](#-kiến-trúc)
3. [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
4. [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
5. [Ghi chú bảo mật](#-ghi-chú-bảo-mật)
6. [Luồng xác thực Web & Mobile](#-luồng-xác-thực-web--mobile)
7. [Hướng dẫn cách chạy dev](#-hướng-dẫn-cách-chạy-dev)

---

## 🚀 Tính năng
- **Đăng nhập Azure AD** qua OpenID Connect Authorization Code Flow.
- **Phát hành Access Token (JWT)** ký bằng RSA SHA256.
- **Quản lý Refresh Token** với cơ chế:
  - Lưu trữ dưới dạng SHA256 hash.
  - Rotation khi làm mới token.
  - Thu hồi (Revoke) với lý do.
  - Tự động dọn dẹp token hết hạn mỗi giờ.
- **Public key endpoint** cho các service khác verify JWT.
- **Logging** bằng Serilog, lưu file log hàng ngày.
- **CORS** hỗ trợ SPA (React, Vue...) ở `localhost:3000`.
- **MemoryCached** cached lại token ở `GenerateInternalToken`
- **signalR** push thông báo logout

---

## 🏛 Kiến trúc
Dự án áp dụng **Clean Architecture** gồm 4 tầng:

1. **Domain**  
   - Chứa entity `RefreshToken`.
   - Không phụ thuộc vào framework hay thư viện bên ngoài.

2. **Application**  
   - Khai báo **Interfaces** (`IAzureAdService`, `IRefreshTokenRepository`).
   - DTOs (`RefreshResponse`).
   - Không chứa logic hạ tầng.

3. **Infrastructure**  
   - Implement repository với **Dapper** (`DapperRefreshTokenRepository`).
   - Factory kết nối SQL (`SqlConnectionFactory`).

4. **Api**  
   - Controllers (`AuthController`, `AuthControllerMobile`, `KeysController`).
   - Services (`AzureAdService`, `TokenService`, `RefreshCleanupService`, `LogoutNotifier`).
   - Utils (`TokenHasher`, `KeyLoader`).
   - Program.cs cấu hình DI, JWT, Swagger, Serilog, CORS.

---

## 📂 Cấu trúc thư mục
```plaintext
ResAuthApi.sln
 ├─ ResAuthApi.Api/
 │   ├─ Controllers/
 │   │   ├─ AuthController.cs
         ├─ AuthControllerMobile.cs
 │   │   └─ KeysController.cs
 │   ├─ Hub/
     │   └─ LogoutHub.cs
 │   ├─ Middlewares/
 │   │   └─ ApiKeyMiddleware.cs
 │   ├─ Services/
 │   │   ├─ AzureAdService.cs
 │   │   ├─ LogoutNotifier.cs
 │   │   ├─ TokenService.cs
 │   │   └─ RefreshCleanupService.cs
 │   ├─ Utils/
 │   │   ├─ KeyLoader.cs
 │   │   └─ TokenHasher.cs
 │   ├─ Program.cs
 │   ├─ appsettings.json
 │   └─ ResAuthApi.Api.csproj
 ├─ ResAuthApi.Application/
 │   ├─ Constants/
 │   │   └─ ClientTypes.cs
 │   ├─ Interfaces/
 │   │   ├─ IRefreshTokenRepository.cs
 │   │   └─ IAzureAdService.cs
 │   ├─ DTOs/
 │   │   └─ AuthDtos.cs
 │   └─ ResAuthApi.Application.csproj
 ├─ ResAuthApi.Domain/
 │   ├─ Entities/
 │   │   └─ RefreshToken.cs
 │   └─ ResAuthApi.Domain.csproj
 └─ ResAuthApi.Infrastructure/
     ├─ Persistence/
     │   └─ DapperRefreshTokenRepository.cs
     ├─ MySqlConnectionFactory.cs
     └─ ResAuthApi.Infrastructure.csproj
Sql/
 └─ Init.sql
Keys/
 ├─ private.key     (PKCS#8 PEM, RSA PRIVATE KEY)
 └─ public.key      (SubjectPublicKeyInfo PEM)
```

## 2. Cài đặt .NET SDK
Yêu cầu **.NET 8.0** trở lên.

## 3. Cấu hình CSDL
- Tạo database **MySql**.
- Chạy script trong `Sql/init.sql`.

## 4. Cấu hình Azure AD
Lấy các thông tin:
- **TenantId**
- **ClientId**
- **ClientSecret**
- **RedirectUri, RedirectUriMobile**

## 🛠 Công nghệ sử dụng
- **.NET 8.0**
- **Dapper** (SQL access)
- **Azure AD OpenID Connect**
- **JWT** (RS256)
- **Serilog**
- **Swagger**
- **MySql**
- **Redis** (chạy trên docker)
- **signalR**

## 🔒 Ghi chú bảo mật
- **Không commit** file `private.key` lên repo public.
- **Refresh token** được hash bằng **SHA256** trước khi lưu DB.
- Cookie `refresh_token` dùng **HttpOnly**, **Secure**, **SameSite=None**, **Domain='.local.com'**.
- Cần **HTTPS** khi chạy mới test được cookie theo domain.

## Flow
```plaintext
- Lần đầu User login Azure AD -> ResAuthApi đọc thông tin token lấy Email, Name của user. 
  - Tạo access_token (Exp 1h) nội bộ ký theo chuẩn RAS và cached lại trên MemoryCache.
  - Tạo refresh_token lưu vào DB (Exp 7d)
  - Tạo cookie cho refresh_token theo Domain (Domain = ".local.com")
  - Các FE vào check cookie bằng cách gọi api /refresh nếu ko có thì login

App A login -> nhận access_token + refresh_token -> lưu refresh_token (Secure Storage)
App B mở -> tìm refresh_token -> gọi Auth API /refresh -> nhận access_token mới -> dùng
App A quay lại -> cũng làm như App B -> SSO hoạt động
```
## 🔐 Luồng xác thực Web & Mobile
```plaintext
+----------------------+                 +-----------------------+
|Web: hr.local.com / crm |               | Mobile App (RN/Native)|
+----------+-----------+                 +-----------+-----------+
           |                                         |
(chưa token) |                                       |
    1. /refresh (cookie)                      1'. /refresh (body)
           |                                         |
           v                                         v
+----------+-----------+                 +-----------+-----------+
|   Auth Service @     |                 |  Auth Service @       |
| api-auth.local.com   |  (cùng 1 BE)    | api-auth.local.com    |
+----------+-----------+                 +-----------+-----------+
           |                                         |
  Đọc cookie refresh_token              Đọc body.refresh_token
           |                                         |
   OK -> cấp access_token                OK -> cấp access_token
           |                                         |
           v                                         v
Web dùng access_token                  Mobile dùng access_token  
(localStorage / memory)                (SecureStorage / Keychain)
```

- khi bắm logout thì sẽ logout hết các web hoặc ứng dụng (theo web/mobile), chưa force all

## Hướng dẫn cách chạy dev
1. Cài docker desktop để chạy Redis. Cài xong chạy lệnh bên dưới
```bash
   docker pull redis:latest
   docker run -d --name redis -p 6379:6379 redis:latest redis-server --requirepass Resredis@123
```
2. Tạo mkcert để validate FE
Bước 1 – Cài đặt mkcert

Vào GitHub tải bản cài đặt:
🔗 https://github.com/FiloSottile/mkcert/releases

Tải file .exe phù hợp với Windows (thường là mkcert-vX.X.X-windows-amd64.exe).

Đổi tên thành mkcert.exe, copy vào một thư mục trong PATH (vd: C:\Windows\System32) hoặc để ở project rồi chạy trực tiếp.

Bước 2 – Cài CA (Certificate Authority) local

Mở PowerShell (Run as administrator) và chạy:
```bash
mkcert -install
```

Lệnh này sẽ:

Tạo một CA gốc (root CA) trên máy bạn.

Import vào Windows Trusted Root Certificate Store.

Import vào store của các trình duyệt (Chrome, Edge, v.v.).

Bước 3 – Tạo wildcard certificate

Trong terminal tại thư mục project FE hoặc thư mục lưu cert, chạy:
```bash
mkcert "*.local.com"
```

Kết quả sẽ ra 2 file:
```bash
_wildcard.local.com.pem   (certificate)
_wildcard.local.com-key.pem (private key)
```

## Cách tạo api-auth.local.com.p12
```bash
mkcert api-auth.local.com
openssl pkcs12 -export \
  -out api-auth.local.com.p12 \
  -inkey api-auth.local.com-key.pem \
  -in api-auth.local.com.pem \
  -password pass:123456  
```
add host
```plaintext
127.0.0.1 hr.local.com
127.0.0.1 crm.local.com
127.0.0.1 api-auth.local.com
127.0.0.1 api-hr.local.com
127.0.0.1 api-crm.local.com
```

Test chạy lên copy link bên dưới dán vào trình duyệt
```plaintext
https://login.microsoftonline.com/{TenantId}/oauth2/v2.0/authorize
?client_id={ClientId}
&response_type=code
&redirect_uri=https://api-auth.local.com/signin-oidc
&response_mode=query
&scope=openid%20profile%20email
&state=12345
```

**Deploy server dev**
Tạo api-auth.staging.com.pfx bằng mkcert
```bash
mkcert api-auth.staging.com

openssl pkcs12 -export \
  -out api-auth.staging.com.pfx \
  -inkey api-auth.staging.com-key.pem \
  -in api-auth.staging.com.pem \
  -password pass:123456
```

file `appsettings.json`
```json
{
  "Kestrel": {
  "Endpoints": {
    "Https": {
      "Url": "https://0.0.0.0:7016",
      "Certificate": {
        "Path": "/var/www/resauthn/certs/api-auth.staging.com.pfx",
        "Password": "123456"
       }
     }
   }
 },
  "AzureAd": {
    "TenantId": "f286906e-f0af-4d95-8ac0-xxx",
    "ClientId": "badc369f-3f7a-4da3-8690-xxx",
    "ClientSecret": "key123",
    "RedirectUri": "https://api-auth.staging.com:7016/signin-oidc",
    "RedirectUriMobile": "https://api-auth.staging.com:7016/mobile/signin-oidc"
  },
  "Jwt": {
    "Issuer": "https://res-auth.local",
    "PrivateKeyPath": "keys/private.key",
    "PublicKeyPath": "keys/public.pem"
  },
  "XApiKey": "2af189aa-ac90-11ef-8906-xxx",
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=ResAuthDb;User=root;Password=ResDev@123!;SslMode=None;",
  },
  "Domain": ".local.com", // để xác thực cookie
  "Logging": { "LogLevel": { "Default": "Information" } },
  "AllowedHosts": "*"
}
```

Tạo service
```bash
sudo nano /etc/systemd/system/resauthn.service

[Unit]
Description=.NET 8 ResAuthN - App
After=network.target

[Service]
Environment=ASPNETCORE_URLS=https://0.0.0.0:7016
Environment=ASPNETCORE_Kestrel__Certificates__Default__Path=/var/www/resauthn/certs/api-auth.staging.com.pem
Environment=ASPNETCORE_Kestrel__Certificates__Default__KeyPath=/var/www/resauthn/certs/api-auth.staging.com-key.pem
WorkingDirectory=/var/www/resauthn/publish
ExecStart=/usr/bin/dotnet /var/www/resauthn/publish/ResAuthApi.Api.dll
Restart=always
RestartSec=10
KillSignal=SIGINT
SyslogIdentifier=resauthn
User=dotnetuser
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=DOTNET_PRINT_TELEMETRY_MESSAGE=false

[Install]
WantedBy=multi-user.target
```
Add user
```bash
sudo adduser --system --no-create-home --group dotnetuser
sudo chown -R dotnetuser:dotnetuser /var/www/resauthn
```
```bash
sudo systemctl daemon-reload
sudo systemctl enable resauthn
sudo systemctl start resauthn

sudo systemctl restart resauthn

# Xem log
journalctl -u resauthn -f
```

**Publish lên server**
- Lúc publish vào `Progam.cs` check lại `builder.WebHost.ConfigureKestrel` để đảm bảo cấu hình HTTPS đúng với đường dẫn cert
```csharp
builder.WebHost.ConfigureKestrel((context, options) =>
{
    options.Configure(context.Configuration.GetSection("Kestrel"));
});
```
- Publish xong copy thư mục publish lên `/var/www/resauthn/publish`
- Copy keys lên `/var/www/resauthn/publish/keys`
- Sửa file `appsettings.json` trên server như bên trên

```bash
sudo ufw allow 7016/tcp
```
Các máy khác cùng LAN muốn chạy thì add host
```plaintext
C:\Windows\System32\drivers\etc\hosts

192.168.1.23   api-auth.staging.com
```
Test link web copy link bên dưới dán vào trình duyệt -> trả về màn hình trắng
```plaintext
https://login.microsoftonline.com/f286906e-f0af-4d95-8ac0-76cbdfb897fa/oauth2/v2.0/authorize
?client_id=badc369f-3f7a-4da3-8690-4b26f3908070
&response_type=code
&redirect_uri=https://api-auth.local.com:7016/signin-oidc
&response_mode=query
&scope=openid%20profile%20email
&state=123456
```

Hoặc nếu muốn test mobile thì dùng link này -> trả ra json
```plaintext
https://login.microsoftonline.com/{TenantId}/oauth2/v2.0/authorize
?client_id={ClientId}
&response_type=code
&redirect_uri=https://api-auth.staging.com:7016/mobile/signin-oidc
&response_mode=query
&scope=openid%20profile%20email
&state=123456
```

# ResAuthZApi
## Kiến trúc tổng thể

 **ResAuthApi (Authentication Service)**
  - Chú thích thêm tích hợp SSO.
  - Cấp **JWT access token và refresh token** trên mobile, web thông cookie để refresh token.
  - Token chứa các thông tin cơ bản về user (sub, email, name claims "thô").

 **ResAuthZApi (Authorization Service)**
  - Chú thích thêm ánh xạ **Role → Permission → Resource**.
  - Có thể dùng mô hình:
    - **RBAC** (Role-Based Access Control)
    - **ABAC** (Attribute-Based Access Control, theo policy)
  - CompApi, QarmaApi khi nhận request sẽ **call ResAuthZApi** để **cache policy** để quyết định cho phép hay không.

 **Resource APIs (CompApi, QarmaApi, …)**
  - Chỉ verify token với ResAuthApi (qua public key).
  - Sau đó gọi **ResAuthZApi** để: "User X có được quyền action Y trên resource Z không?"
  - Hoặc: ResAuthApi **embed luôn claims/permissions** vào token sau khi gọi ResAuthZApi khi login (cách này nhánh hơn nhiều khi gọi thêm permission runtime).

**Giải thích Role → Permission → Resource - Action**
 - **Resource:** đối tượng bạn muốn bảo vệ → ví dụ: `Product`, `Order`, `Customer`.
 - **Action:** hành động trên resource → `GetAll`, `GetById`, `Add`, `Update`, `Delete`.
 - **Permission:** sự kết hợp giữa **Resource + Action** → ví dụ:
    - `"Product.ReadAll"` (trong trường hợp `GetAll`)
    - `"Product.ReadOne"` (trong trường hợp `GetById`)
    - `"Product.Create"`
    - `"Product.Update"`
    - `"Product.Delete"`
 - **Role:** tập hợp các permission. Ví dụ:
  - `Viewer` → chỉ có `Product.ReadAll`, `Product.ReadOne`.
  - `Editor` → có `Product.Create`, `Product.Update`.
  - `Admin` → tất cả permission.
 - **User:** gán 1 hoặc nhiều role → lấy theo các permission trong đó.

**2. Permission caching (hybrid)**
  **Token chứa các thông tin roles cơ bản.**
  **Resource API khi nhận request:**
    - Lấy `sub (userId)` từ token.
    - Gọi ResAuthZApi lấy thêm danh sách permission list → cache vào Redis/memory (khoảng 5-10 phút).
  **Các request sau chỉ cần dùng cache.**

 **Ưu điểm:**
  - Token gọn.
  - Linh hoạt update permission.
  - Performance tốt với cache.
 **Nhược điểm:**
  - Cần thêm Redis/memory layer.
 
## **ERD**
![ERD](./src/ResAuthZApi.Infrastructure/Sqls/ERD_ResAuthZ.png)

Từng bước theo DB 
👉 Flow chuẩn cho mô hình phân quyền **Role-Based Access Control (RBAC) + Resource/Action.**
**1. Tạo Resource với Action → sinh Permissions**
 - `resources:` mô tả từng tài nguyên (vd: `AllCompliance`, `DocumentType`, `Template`…)
 - `actions:` các hành động chung (`ReadAll`, `ReadOne`, `Create`, `Update`, `Delete`…)
 - `resource_actions:` để biết resource đó allow những action nào (vd: `AllCompliance` có `ReadAll, ReadOne`…)
 - `permissions:` bảng trung gian mapping **ResourceId + ActionId** → một permission cụ thể (vd: `DocumentType.ReadAll`)

**2. Tạo Roles có Permission nào**
 - `roles:` định nghĩa role theo ứng dụng (`AppId`)
 - `role_permissions:` gán role với danh sách permission
Ví dụ:
 - Role `ComplianceManager` → có `AllCompliance.ReadAll`, `DocumentType.Create`…

**3. Phân quyền User → Roles**
 - `users`: định danh user bằng `Email`
 - `user_roles`: gán user vào role cụ thể trong 1 app
Ví dụ:
 - User `thiennh@response.com.vn` → role `ComplianceManager` trong App `ComplianceSys`.

**4. Load Menus theo Roles mà User có**
 - `menus`: mô tả menu FE (có thể gán `ResourceId` nếu menu đó map tới BE resource)
 - Khi user login → lấy roles → lấy permissions → check xem permission nào có → trả về menu JSON (ẩn/hiện nút, menu con).
Menu cha (group) không map `ResourceId` → hiển thị nếu có ít nhất 1 menu con accessible.
Menu con có `ResourceId` → chỉ hiển thị nếu user có ít nhất một permission trên resource đó.

## Mockup giao diện quản lý phân quyền (RBAC + Resource/Action)
Resource List
Code			Name				Actions						#
DocumentType    Document Type	    ReadAll, ReadOne, Create    Edit Delete
Templates    	Templates	        ReadAll, ReadOne, Create    Edit Delete

---------------------------------------------------
Roles
---------------------------------------------------
| Name    | Description       | Permissions | Actions |
---------------------------------------------------
| Viewer  | Read only access  | 2           | [Edit]  |
| Editor  | Can edit data     | 2           | [Edit]  |
| Admin   | Full access       | 10          | [Edit]  |
---------------------------------------------------
[ + Add Role ]

**Add/Edit Cách 1**
Role: Viewer
Description: Read-only user

Permissions:
[✓] Product.ReadAll
[✓] Product.ReadOne
[ ] Product.Create
[ ] Product.Update
[ ] Product.Delete

**Add/Edit role Cách 2**

Role: Editor
-----------------------------------------------------------
Resource         ReadAll   ReadOne   Create   Update   Delete
-----------------------------------------------------------
AllCompliance    [✔]       [ ]       [✔]      [ ]      [ ]
DocumentType     [✔]       [ ]       [✔]      [ ]      [ ]
Template         [ ]       [ ]        [ ]      [ ]      [ ]


**List of Permission**

Permissions
---------------------------------------------------
| Code              | Resource | Action   | Actions |
---------------------------------------------------
| Product.ReadAll   | Product  | GetAll   | [Edit]  |
| Product.ReadOne   | Product  | GetById  | [Edit]  |
| Product.Create    | Product  | Add      | [Edit]  |
| Product.Update    | Product  | Update   | [Edit]  |
| Product.Delete    | Product  | Delete   | [Edit]  |
---------------------------------------------------
[ Auto Generate ]

**Add/Edit role Cách 2**

Role: ComplianceManager
---------------------------------------------------
| Resource      | ReadAll | ReadOne | Create | Update | Delete | Print | Download | All      |
| ------------- | ------- | ------- | ------ | ------ | ------ | ----- | -------- | -------- |
| AllCompliance | ✅      | ✅     | ✅     | ✅    | ✅     | ✅    | ✅      | ✅       |
| DocumentType  | ✅      | ✅     | ✅     | ✅    | ✅     | ✅    | ✅      | ✅       |
| Template      | ✅      | ✅     | ✅     | ✅    | ✅     | ✅    | ✅      | ✅       |

 - Mỗi ô checkbox tương ứng với 1 permission.
 - Khi user tick vào → generate `PermissionCode = Resource.Action`.
   - Ví dụ: `DocumentType.Create`, `AllCompliance.Print`.

**🗄️ Cách lưu DB**
 - `resources`: chỉ lưu `ResourceId`, `Code`, `Name`.
  - Ví dụ: DocumentType, Template.
 - `actions`: danh sách action chuẩn (ReadAll, ReadOne, Create…).
 - `permissions`: join ResourceId + ActionId → sinh ra `PermissionCode`.

Ví dụ (permissions table):
| PermissionId | ResourceId        | ActionId    | Code                  |
| ------------ | ----------------- | ----------- | --------------------- |
| 1            | 1 (AllCompliance) | 1 (ReadAll) | AllCompliance.ReadAll |
| 2            | 1                 | 2 (ReadOne) | AllCompliance.ReadOne |
| 3            | 2 (DocumentType)  | 1 (ReadAll) | DocumentType.ReadAll  |
| 4            | 3 (Template)      | 3 (Create)  | Template.Create       |

**🔑 Ưu điểm của thiết kế này**
**1. Dễ mở rộng** → thêm Action mới (`Export`, `Approve`) mà không cần sửa bảng permissions, chỉ cần seed thêm Action.
**2. Quản lý dễ hiểu** → UI tick/untick tương ứng với 1 record trong `role_permissions`.
**3. FE hiển thị trực quan** → load resource + actions → vẽ grid tick box.

 
## **Clean Architecture (.NET)**
✨ **Dependency trong Visual Studio project (.NET):**
- `Domain` → không reference ai hết.
- `Application` → reference `Domain`.
- `Infrastructure` → reference `Application` và `Domain`.
- `Api` → reference `Application` và `Infrastructure`.

---

🔧 **Cách tránh lỗi circular reference:**
- `Application` chỉ reference `Domain`.
- Không reference `Infrastructure`.
- `Infrastructure` mới reference `Application` + `Domain` để implement interface.

📌 **Ví dụ interface Authorization trong Clean Architecture:**
- `Application layer` chứa các interface (`IAuthorizationRepository` + `IAuthorizationService`).
- `Infrastructure` implement `IAuthorizationRepository` (truy vấn DB bằng Dapper).
- `Application Service` implement `IAuthorizationService` và gọi qua `IAuthorizationRepository`.
- `API` gọi `IAuthorizationService`.

✨ **1. Tại sao không dùng 1 IAuthorization mà phải tách:**
- `IAuthorizationRepository`
  - nằm trong `Application Layer` để gọi dữ liệu (DB, API ngoai...).
  - định nghĩa cách `Application` gọi để implement.
- `IAuthorizationService`
  - cũng nằm trong `Application Layer` như là business service.
  - implement business logic, có thể gọi repository khac, cache, combine nhiều dữ liệu, check rule.
  - được `API Layer` gọi.

---

🔧 **2. Nếu gộp lại 1 interface:**
- **Ưu điểm:**
  - ✅ Code gọn, không cần tạo 2 interface và change.
- **Nhược điểm:**
  - ❌ `Application service` sẽ "phụ thuộc trực tiếp" vào repo implement trong `infrastructure` → làm mờ ranh giới giữa `Business logic` và `Data access`.
  - ❌ Sau này nếu logic check permission thay đổi (ví dụ thêm cache, gọi external API khác) thì API phải sửa code trực tiếp ở `infrastructure`, mất vai trò "Application Service".



```plaintext
SharedLib.sln
 └─ Shared   
     ├─ Shared.AuthN          // IAuthNClient, AuthNClient
     ├─ Shared.AuthZ          // IAuthZClient, AuthZClient
     ├─ Shared.Dapper         // BaseRepository, DbConnectionFactory
     ├─ Shared.Core           // Exceptions, ApiResponse<T>, Utils


ComplianceApi.sln
 ├─ Compliance.Api
 ├─ Compliance.Application
 ├─ Compliance.Domain
 ├─ Compliance.Infrastructure
 └─ Shared (reference)

QarmaApi.sln
 ├─ Qarma.Api
 ├─ Qarma.Application
 ├─ Qarma.Domain
 ├─ Qarma.Infrastructure
 └─ Shared (reference)


            ┌───────────────────────┐
            │   ResAuthNApi (SSO)   │
            └──────────┬────────────┘
                       │ JWT
                       ▼
              ┌─────────────────┐
              │Shared Lib  
              │ ├─ Shared.AuthN  | (build thành Nuget -> dựng server Nuget riêng hoặc dùng github, github thì có 3 người 1 private res)           
              │ ├─ Shared.AuthZ  │ (AuthZClient, IAuthZClient)
              │ ├─ Shared.Dapper │ (BaseRepository)
              │ ├─ Shared.Core   │ (ApiResponse<T>, Exception, Utils)
              └─────────┬───────┘
                        │
      ┌─────────────────┼──────────────────┐
      ▼                 ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ ComplianceApi │  │ QarmaApi      │  │ ... (API khác)│
│  ├─ Api       │  │  ├─ Api       │  │  ├─ Api       │
│  ├─ App       │  │  ├─ App       │  │  ├─ App       │
│  ├─ Domain    │  │  ├─ Domain    │  │  ├─ Domain    │
│  └─ Infra     │  │  └─ Infra     │  │  └─ Infra     │
└───────────────┘  └───────────────┘  └───────────────┘
       │                  │                  │
       └────► ResAuthZApi-┴─────► ResAuthZApi┴───► ResAuthZApi



Ưu điểm:
  - Code AuthZ, BaseRepository, Middleware, Exception chỉ viết 1 lần.
  - Các API chỉ tập trung vào Domain + Business riêng.
  - Dễ maintain, dễ mở rộng nhiều API sau này.
```


```plaintext
🏗️ CI/CD deploy lên VM
🔹 Mô hình: Jenkins + Docker Registry + GitHub Free
    - Jenkins pull code từ GitHub.
    - Jenkins build → tạo Docker image → push vào Registry (tự host).
    - Jenkins dùng SSH/Agent script để pull image từ registry về VM rồi run container (hoặc chạy lệnh docker-compose up -d).

✅ Ưu điểm

    - Tự chủ hoàn toàn.
    - Jenkins có plugin SSH, Ansible, Docker, rất phù hợp để deploy lên VM.
    - Triển khai được cả môi trường ngoài Azure (on-premises, server khác cloud).

❌ Nhược điểm
    - Phải tự lo bảo mật (SSH key, user Jenkins, credential registry).
    - Tốn công maintain Jenkins (backup, update, fix plugin).    

🔹 Mô hình 2: GitHub Actions + Self-hosted Docker Registry (hoặc GitHub Container Registry)

   - GitHub Actions: native CI/CD, gắn liền với GitHub repo (team bạn đang dùng GitHub Free).
   - Dùng GitHub Container Registry (ghcr.io) hoặc registry tự host.
   - Dùng SSH Action để deploy image/container lên VM.

✅ Ưu điểm

   - Không cần Jenkins server → giảm maintain.
   - 2.000 phút build/tháng miễn phí cho private repo (Linux runner).
   - Tích hợp cực kỳ chặt với GitHub (PR, branch, tag → auto trigger).
   - Rất phù hợp cho team nhỏ vì setup nhanh, ít phức tạp.

❌ Nhược điểm

   - 2.000 phút free/tháng có thể không đủ cho 3–4 project build nhiều (nhưng có thể cài self-hosted runner để bypass).
   - Không có UI quản lý pipeline mạnh như Azure DevOps.
   - Phải tự lo bảo mật registry (nếu không dùng ghcr.io).

```