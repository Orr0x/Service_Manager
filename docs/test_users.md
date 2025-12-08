# Test Data & Users

A comprehensive set of test data has been seeded into the database for two distinct tenants. This allows for testing multi-tenant isolation and different business use cases.

**Global Password for all users:** `password123`

## Tenant 1: Sparkle Cleaners (Cleaning Business)
**Slug:** `sparkle-cleaners`
**Focus:** Cleaning, Janitorial, Sanitization

### Users
| Role | Name | Email | Permissions |
| :--- | :--- | :--- | :--- |
| **Owner (Admin)** | Sarah Sparkle | `owner@sparkle.com` | Full Access |
| **Manager (Lead)** | Liam Lead | `lead1@sparkle.com` | Manage Jobs, Workers |
| **Manager (Lead)** | Lisa Lead | `lead2@sparkle.com` | Manage Jobs, Workers |
| **Worker** | Clean Worker 1 | `worker1@sparkle.com` | View Assignments, Complete Checklists |
| **Worker** | Clean Worker 2 | `worker2@sparkle.com` | ... |
| ... | ... | ... | ... |
| **Worker** | Clean Worker 7 | `worker7@sparkle.com` | ... |

### Contractors (External)
- **Zap Electric** (Eddie Sparks) - `eddie@zap.com`
- **Flow Plumbing** (Mario Pipes) - `mario@flow.com`
- **WoodWorks** (Chip Sawyer) - `chip@wood.com`
- **SafeGas** (Gary Gas) - `gary@safegas.com`
- **FixAll Maintenance** (Bob Builder) - `bob@fixall.com`

---

## Tenant 2: FixIt Right (Maintenance Business)
**Slug:** `fixit-right`
**Focus:** Carpentry, Maintenance, Repairs

### Users
| Role | Name | Email |
| :--- | :--- | :--- |
| **Owner (Admin)** | Frank Fixit | `manager@fixit.com` |
| **Worker** | Tech Num 1 | `tech1@fixit.com` |
| **Worker** | Tech Num 2 | `tech2@fixit.com` |
| ... | ... | ... |
| **Worker** | Tech Num 5 | `tech5@fixit.com` |

## How to Apply Test Data
To reset your local database and apply this seed data, run:
```bash
npx supabase db reset
```
*Note: This will wipe all existing data.*
