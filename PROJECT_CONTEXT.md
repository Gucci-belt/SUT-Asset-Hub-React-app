# SUT Asset Hub — Project Context Summary

---

## STEP 1 — Tech Stack & Architecture

### **Frontend**

- **React Native 0.81.5** with **Expo ~54.0.33**
- **Expo Router ~6.0.23** for file-based routing
- **NativeWind 4.2.2** + TailwindCSS 3.4.19 (utility-first styling)
- **Lucide React Native 0.577.0** for icons
- **React Native Reanimated ~4.1.1** + **Moti 0.30.0** for animations
- **React Navigation** (bottom-tabs, native-stack)
- **Expo Camera, Image Picker, Document Picker** for media
- **AsyncStorage 2.2.0** + **Expo SecureStore ~15.0.8** for token persistence
- **Axios 1.13.6** for HTTP requests

### **Backend**

- **Node.js** with **Express 5.2.1**
- **Prisma 6.19.2** ORM with **@prisma/client 6.19.2**
- **@prisma/adapter-pg 7.3.0** (PostgreSQL adapter)
- **PostgreSQL 8.18.0** driver via **pg**
- **JWT (jsonwebtoken 9.0.3)** for authentication
- **bcryptjs 3.0.3** for password hashing
- **Multer 2.1.1** for file uploads
- **CORS 2.8.5** for cross-origin requests
- **Prom-client 15.1.3** for Prometheus metrics
- **Nodemon 3.1.11** for dev auto-reload

### **Database & ORM**

- **PostgreSQL** (via environment variable `DATABASE_URL`)
- **Prisma Client** as primary ORM
- Database seeding via `prisma/seed.js`

### **Runtime**

- Development: Expo CLI with hot reload
- Deployment-ready: Express server on port 3000
- File uploads stored in `/server/uploads`

---

## STEP 2 — Database Schema Overview

### **Models & Relationships**

#### **User**

```
- id (Int, Primary Key, auto-increment)
- studentId (String, unique)
- passwordHash (String)
- role (String, default: "student") — enum: student, admin
- pin (String, optional) — recovery PIN
- firstName, lastName, phone, lineId, photo (all optional)
- createdAt (DateTime, default: now())
- transactions (One-to-Many: Transaction[])
```

#### **Asset**

```
- id (Int, Primary Key, auto-increment)
- name (String)
- serialNumber (String, unique)
- category (String)
- status (String, default: "available") — enum: available, borrowed, maintenance
- imagePath (String, optional)
- description (String, optional)
- createdAt (DateTime, default: now())
- transactions (One-to-Many: Transaction[])
```

#### **Transaction**

```
- id (Int, Primary Key, auto-increment)
- userId (Int, Foreign Key → User.id)
- assetId (Int, Foreign Key → Asset.id)
- user (User relation via userId)
- asset (Asset relation via assetId)
- borrowDate (DateTime, default: now())
- returnDate (DateTime, optional) — actual return date
- dueDate (DateTime, optional) — expected return date
- status (String, default: "pending") — enum: pending, approved, returned, rejected
- reason (String, optional) — reason for borrowing
```

### **Relationship Summary**

- **User ↔ Transaction**: One-to-Many (1 user can have many transactions)
- **Asset ↔ Transaction**: One-to-Many (1 asset can have many transactions)
- **User ↔ Asset**: Many-to-Many (through Transaction)

---

## STEP 3 — Core Features & App Flow

### **Authentication Flow**

1. **Login** (`/index.tsx`): Students enter `studentId` + `password`
2. **JWT Token Exchange**: Backend validates credentials, returns JWT + `role`
3. **Token Storage**: Stored in `AsyncStorage`, `SecureStore`, and `globalAuth.ts` (in-memory fallback)
4. **Authorization Header**: `Authorization: Bearer <token>` on all protected API calls
5. **Role-Based Redirect**: Admin → `/admin/dashboard`, Student → `/home`
6. **Password Reset** (`/reset.tsx`): PIN-based recovery flow

### **Navigation Structure (BottomTabBar)**

- **HOME** (`/home`) — Dashboard with asset categories, new arrivals, full asset list
- **SEARCH** (`/search`) — Asset search/filter interface
- **SCANNER** (`/scanner`) — QR code scanner (center, elevated button)
- **HISTORY** (`/history`) — Transaction history (borrowing requests, approvals)
- **PROFILE** (`/profile`) — User info, logout, settings

### **Completed Screens**

| Screen          | Path                   | Feature                                               |
| --------------- | ---------------------- | ----------------------------------------------------- |
| Login           | `/index.tsx`           | JWT-based authentication, role detection              |
| Register        | `/register.tsx`        | New student account creation                          |
| Home            | `/home.tsx`            | Asset catalog, category filter, new arrivals carousel |
| Detail          | `/detail.tsx`          | Asset details, borrow request, image preview          |
| History         | `/history.tsx`         | Transaction list, approval status badges              |
| Scanner         | `/scanner.tsx`         | QR code capture → asset lookup                        |
| Profile         | `/profile.tsx`         | User info display, logout                             |
| Reset           | `/reset.tsx`           | Password recovery via PIN                             |
| Admin Dashboard | `/admin/dashboard.tsx` | Overview stats                                        |
| Admin Inventory | `/admin/inventory.tsx` | Manage assets, add/edit/delete                        |
| Admin Users     | `/admin/users.tsx`     | User management                                       |
| Admin Requests  | `/admin/requests.tsx`  | Approve/reject borrow requests                        |
| Admin Logs      | `/admin/logs.tsx`      | Activity audit logs                                   |

### **API Endpoints (Backend Routes)**

| Route                                 | Method     | Protected | Purpose             |
| ------------------------------------- | ---------- | --------- | ------------------- |
| `/api/auth/login`                     | POST       | ✗         | Student login       |
| `/api/auth/register`                  | POST       | ✗         | Account creation    |
| `/api/assets`                         | GET        | ✗         | List all assets     |
| `/api/assets/:id`                     | GET        | ✗         | Asset details       |
| `/api/assets`                         | POST       | ✓ Admin   | Create asset        |
| `/api/assets/:id`                     | PUT/DELETE | ✓ Admin   | Modify asset        |
| `/api/transactions/borrow`            | POST       | ✓         | Request borrow      |
| `/api/transactions/my-history`        | GET        | ✓         | User's transactions |
| `/api/admin/transactions`             | GET        | ✓ Admin   | All transactions    |
| `/api/admin/transactions/:id/approve` | POST       | ✓ Admin   | Approve request     |
| `/api/admin/transactions/:id/reject`  | POST       | ✓ Admin   | Reject request      |
| `/api/upload`                         | POST       | ✓         | Upload asset image  |

### **Data Flow Example: Borrowing an Asset**

1. Student scans QR → redirected to `/detail?id=123`
2. Student fills reason, clicks "Request Borrow"
3. POST `/api/transactions/borrow` with JWT token
4. Transaction created with `status: pending`
5. Admin sees badge count notification in Home header
6. Admin reviews in `/admin/requests`, approves/rejects
7. Student sees update in `/history` with approval status

---

## STEP 4 — Technical Rules & Known Constraints

### **UI Constraints**

- ✓ **NativeWind Only**: All styling via `className="..."` TailwindCSS utilities
- ✗ **NO SafeAreaView**: Never import from `react-native-safe-area-context` component. Use `<View className="pt-12">` or `pt-8` for padding instead
- ✓ **TopPadding Pattern**: `pt-12` on root screens to offset status bar + notches
- ✓ **Custom BottomTabBar**: Predefined tab bar component in `/mobile/components/BottomTabBar.tsx` — use this, don't rebuild

### **Interaction Rules**

- ✓ **TouchableOpacity ONLY**: Use exclusively for all pressable surfaces
- ✗ **NO Pressable**: Never use `<Pressable>` with dynamic styles for visual feedback
- ✓ **activeOpacity**: Set to `0.7` or `0.8` for consistent tap feedback
- ✓ **Haptics**: Optional — `expo-haptics` available but not enforced

### **Data Handling Rules**

- ✓ **Real API Fetching**: All data from backend via `fetch()` or `axios`
- ✗ **ZERO Mock Data**: No hardcoded dummy arrays, no `.map()` over fake data
- ✓ **API_BASE_URL Pattern**: Detect debugger host dynamically (Expo tunneling support):
  ```typescript
  const debuggerHost = Constants.expoConfig?.hostUri;
  let API_BASE_URL = "http://10.0.2.2:3000/api"; // Android default
  if (debuggerHost) {
    API_BASE_URL = `http://${debuggerHost.split(":")[0]}:3000/api`;
  }
  ```
- ✓ **Optional Chaining (?.)**: Use everywhere to prevent crashes:
  ```typescript
  const name = data?.user?.firstName ?? "User";
  ```
- ✓ **Authorization Header**: `Authorization: Bearer ${token}` on all protected routes
- ✓ **Token From SecureStore**: Fetch token via `await SecureStore.getItemAsync('token')`

### **Asset Image Handling**

- Images uploaded to `/server/uploads` via `/api/upload` endpoint
- `imagePath` stored in database as `/uploads/asset-<timestamp>.<ext>`
- Frontend constructs full URL:
  ```typescript
  const fullUrl = imagePath.startsWith("http")
    ? imagePath
    : `${API_BASE_URL.replace("/api", "")}${imagePath}`;
  ```

### **Error Handling Patterns**

- Check `response.ok` before parsing JSON
- Wrap async operations in try/catch
- Alert users with `Alert.alert('Title', 'Message')` on failure
- Log errors to console for debugging

### **State Management**

- ✓ **useState** for local component state
- ✓ **useCallback** for memoized fetch functions
- ✓ **In-Memory Global Auth** (`globalAuth.ts`) as fallback if AsyncStorage fails
- ✓ **AsyncStorage** + **SecureStore** for persistence across sessions

### **Performance Notes**

- Notification badge auto-refreshes every 30 seconds
- FlatList used for long asset lists (scrollEnabled=false in Home for embedded list)
- Image caching handled by `expo-image`

### **Admin Panel Access**

- Only users with `role: 'admin'` bypass `/admin/*` routes
- Admin redirect: `if (role === 'admin') router.replace('/admin/dashboard')`
- `authorizeAdmin` middleware enforces server-side role check

### **Deployment Checklist**

- [ ] Environment variables set: `DATABASE_URL`, `JWT_SECRET`, `PORT`
- [ ] PostgreSQL database initialized with `prisma migrate deploy`
- [ ] Seed data loaded via `prisma db seed`
- [ ] `/uploads` directory writable on server
- [ ] CORS origins configured in Express
- [ ] Prometheus metrics endpoint exposed at `/metrics`

---

## Summary Table

| Aspect                 | Choice                         |
| ---------------------- | ------------------------------ |
| **Frontend Framework** | React Native + Expo            |
| **Styling**            | NativeWind + TailwindCSS       |
| **Routing**            | Expo Router (file-based)       |
| **Backend**            | Node.js + Express              |
| **Database**           | PostgreSQL + Prisma            |
| **Auth**               | JWT (Bearer tokens)            |
| **Password Security**  | bcryptjs hashing               |
| **File Storage**       | Local disk (/uploads)          |
| **Icons**              | Lucide React Native + Ionicons |
| **Animations**         | React Native Reanimated + Moti |
| **Analytics**          | Prometheus metrics             |
| **Persistence**        | AsyncStorage + SecureStore     |
