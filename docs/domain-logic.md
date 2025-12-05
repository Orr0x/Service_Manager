# Domain Logic & Customization Architecture

## Core Philosophy: Agnostic & Customizable
The Service Manager platform is designed as a white-label, tenant-agnostic SaaS. It allows service businesses of any type (cleaning, HVAC, landscaping, etc.) to configure the system to match their specific terminology, branding, and workflows.

## 1. Tenant Customization (The "Admin" Experience)
Each tenant (Service Business) must have granular control over their instance:

### Branding & UI
- **Identity**: Upload Logo, Set Company Name.
- **Theming**: Define Color Theme (Primary, Secondary, Accent colors) to match brand.
- **Layout**: Configure Navigation Items (Show/Hide/Rename modules).

### Data Configuration
- **Terminology**: Ability to rename core entities (e.g., rename "Job Sites" to "Properties" or "Locations").
- **Dropdowns & Enums**: Fully customizable lists for:
    - Service Categories
    - Job Statuses
    - Customer Types
    - Lead Sources
    - etc.

## 2. Core Entity Relationships

### Tenants (Service Providers)
- The top-level container for all data.
- Have a **Dashboard** for high-level analysis and KPIs.

### Customers
- **Types**:
    - Individuals (B2C)
    - Businesses (B2B)
    - **Other Service Providers**: A customer can be another tenant on the platform (enabling B2B network effects).
- **Relationships**:
    - Have many **Job Sites** (Locations where work happens).
    - Have many **Jobs**.
    - Have many **Checklists** (Requirements/Preferences).
    - Can have **Quotes** and **Contracts**.

### Jobs (The Central Unit of Work)
- **Linked to**:
    - **Customer** (Who requested it).
    - **Job Site** (Where it happens).
- **Resources**:
    - **Internal Workers**: Employees of the tenant.
    - **External Contractors**: Subcontractors (who might be other tenants).
- **Execution**:
    - **Checklists**: Specific tasks to complete for this job.
    - **Schedule**: Date, Time, and Duration.

### Job Sites
- Physical locations linked to a Customer.
- Jobs are dispatched to these sites.

## 3. Implied Network Logic
- Since "Customers" can be "Other Service Providers", the system supports a **Networked Architecture**.
- A Tenant (Provider A) can hire another Tenant (Provider B) as a Contractor.
- Provider B views Provider A as a "Customer".
