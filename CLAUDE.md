# SUT Asset Hub — Comprehensive Project Guide

**Last Updated:** 2026-05-15  
**Project Type:** React Native + Node.js Full-Stack  
**Repository:** SUT-Asset-Hub

---

## 📋 Quick Overview

**SUT Asset Hub** is a university asset management system featuring:

- 📱 **Mobile App** (React Native/Expo): Students browse, search, and borrow equipment via QR codes
- 🖥️ **Admin Dashboard**: Asset inventory management, transaction approvals, user management
- 🔐 **Secure Authentication**: JWT-based with role-based access control (Student/Admin)
- 🗄️ **PostgreSQL Database**: Prisma ORM for data management

**Core Use Case:** Students scan QR codes to request equipment loans; admins approve/reject requests in real-time.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    SUT ASSET HUB                             │
├──────────────────────────┬──────────────────────────────────┤
│                          │                                  │
│  📱 MOBILE (React Native)│     🖥️ BACKEND (Node.js)        │
│  ├─ Expo Router          │     ├─ Express Server           │
│  ├─ NativeWind/Tailwind  │     ├─ Prisma ORM               │
│  ├─ Lucide Icons         │     ├─ JWT Auth                 │
│  └─ Reanimated           │     ├─ Multer (Uploads)         │
│                          │     └─ Prometheus Metrics        │
│  User Flows:             │     API Routes:                 │
│  └─ Login → Home → Scan  │     ├─ /api/auth/*             │
│     → Detail → Borrow    │     ├─ /api/assets/*            │
│                          │     ├─ /api/transactions/*       │
│                          │     ├─ /api/admin/*             │
│                          │     └─ /api/upload              │
├──────────────────────────┴──────────────────────────────────┤
│              🗄️ PostgreSQL + Prisma                          │
│  ├─ Users (studentId, role, pin)                            │
│  ├─ Assets (name, serialNumber, category, status)           │
│  └─ Transactions (borrowing requests, approval flow)        │
└─────────────────────────────────────────────────────────────┘
```

---

## 📂 Project Structure

```
SUT-Asset-Hub/
├── mobile/                          # React Native Expo App
│   ├── app/
│   │   ├── _layout.tsx             # Root layout (Stack navigator)
│   │   ├── index.tsx               # Login screen
│   │   ├── register.tsx            # Account creation
│   │   ├── home.tsx                # Dashboard (categories, assets)
│   │   ├── detail.tsx              # Asset detail + borrow button
│   │   ├── history.tsx             # Transaction history
│   │   ├── scanner.tsx             # QR code scanner
│   │   ├── profile.tsx             # User profile
│   │   ├── reset.tsx               # Password recovery
│   │   └── admin/                  # Admin-only routes
│   │       ├── dashboard.tsx       # Admin overview
│   │       ├── inventory.tsx       # Asset management
│   │       ├── users.tsx           # User management
│   │       ├── requests.tsx        # Approve/reject borrowing
│   │       ├── logs.tsx            # Activity logs
│   │       └── add-asset.tsx       # Create new asset
│   ├── components/
│   │   └── BottomTabBar.tsx        # Navigation bar (5 tabs)
│   ├── globalAuth.ts               # In-memory token storage
│   ├── global.css                  # TailwindCSS + NativeWind
│   ├── app.json                    # Expo config
│   ├── package.json                # Dependencies
│   └── tsconfig.json               # TypeScript config
│
├── server/                          # Node.js + Express Backend
│   ├── src/
│   │   ├── index.js                # Express app, routes setup
│   │   ├── prismaClient.js         # Shared Prisma instance
│   │   ├── middleware/
│   │   │   └── authMiddleware.js   # JWT verification, role checks
│   │   ├── controllers/
│   │   │   ├── authController.js   # Login, register, password reset
│   │   │   ├── assetController.js  # Asset CRUD
│   │   │   ├── userController.js   # User management
│   │   │   └── transactionController.js  # Borrow/approval logic
│   │   └── routes/
│   │       ├── authRoutes.js       # /api/auth/*
│   │       ├── assetRoutes.js      # /api/assets/*
│   │       ├── userRoutes.js       # /api/users/*
│   │       └── transactionRoutes.js # /api/transactions/*, /api/admin/transactions/*
│   ├── prisma/
│   │   ├── schema.prisma           # Database schema (models, relations)
│   │   └── seed.js                 # Seed data for development
│   ├── uploads/                    # Asset images stored here
│   ├── scripts/                    # Helper scripts
│   ├── package.json                # Dependencies
│   └── .env                        # Environment variables (DATABASE_URL, JWT_SECRET, PORT)
│
└── .git/                           # Version control
```

---

## 🗄️ Database Schema (Prisma)

### User Model

```prisma
model User {
  id          Int     @id @default(autoincrement())
  studentId   String  @unique              # Student ID (B6767...)
  passwordHash String                       # bcryptjs hash
  role        String  @default("student")  # "student" or "admin"
  pin         String?                       # Recovery PIN
  firstName   String?
  lastName    String?
  phone       String?
  lineId      String?
  photo       String?
  createdAt   DateTime @default(now())

  transactions Transaction[]  # Relation: User has many Transactions
}
```

### Asset Model

```prisma
model Asset {
  id          Int     @id @default(autoincrement())
  name        String
  serialNumber String @unique
  category    String  # IoT, Laptops, Cameras, Sensors, Network, Audio
  status      String  @default("available")  # available, borrowed, maintenance
  imagePath   String?                         # /uploads/asset-timestamp.jpg
  description String?
  createdAt   DateTime @default(now())

  transactions Transaction[]  # Relation: Asset has many Transactions
}
```

### Transaction Model

```prisma
model Transaction {
  id          Int     @id @default(autoincrement())
  userId      Int
  assetId     Int
  borrowDate  DateTime @default(now())
  returnDate  DateTime?                      # When actually returned
  dueDate     DateTime?                      # Expected return date
  status      String  @default("pending")   # pending, approved, returned, rejected
  reason      String?                        # Why borrowing

  user        User    @relation(fields: [userId], references: [id])
  asset       Asset   @relation(fields: [assetId], references: [id])
}
```

### Key Relationships

- **1 User → Many Transactions** (one student can borrow multiple times)
- **1 Asset → Many Transactions** (one asset can be borrowed multiple times)
- **User ↔ Asset** (many-to-many through Transaction)

---

## 🔐 Authentication & Authorization Flow

### Login Flow

```
1. Student enters: studentId + password
   ↓
2. Backend (POST /api/auth/login):
   - Find user by studentId
   - Compare password with bcryptjs hash
   - Generate JWT token (sign with JWT_SECRET)
   ↓
3. Response: { token, role, studentId, firstName }
   ↓
4. Mobile app stores:
   - globalAuthToken (in-memory)
   - AsyncStorage (persistent)
   - SecureStore (encrypted)
   ↓
5. Role-based redirect:
   - role="admin" → /admin/dashboard
   - role="student" → /home
```

### Protected API Calls

```typescript
// Every protected request includes:
Authorization: Bearer <JWT_token>

// Backend middleware authenticates:
1. Extract token from header
2. Verify signature with JWT_SECRET
3. Extract user data (id, role, studentId)
4. Attach to req.user
5. Next middleware/controller
```

### Admin Authorization

```javascript
// In routes:
if (req.user.role !== "admin") {
  return res.status(403).json({ error: "Admin access required" });
}
```

---

## 🎨 UI/UX Technical Rules

### ✅ **DO**

- Use **NativeWind** for ALL styling (`className="..."`)
- Use **TouchableOpacity** for ALL pressable surfaces
- Add `pt-12` padding to root screens (SafeArea workaround)
- Use **Optional Chaining** everywhere (`data?.user?.name ?? 'default'`)
- Fetch from REAL API (no mock data)
- Check `response.ok` before parsing JSON
- Store tokens in **SecureStore** + **AsyncStorage** (redundancy)

### ❌ **DON'T**

- Never import SafeAreaView from `react-native-safe-area-context`
- Never use `<Pressable>` with dynamic styles
- Never hardcode dummy data
- Never skip Authorization header on protected routes
- Never trust AsyncStorage for sensitive data alone

### Example: Correct Component Pattern

```typescript
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export default function DetailScreen() {
  const router = useRouter();
  const [asset, setAsset] = useState(null);

  useEffect(() => {
    const fetchAsset = async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        const res = await fetch(`${API_BASE_URL}/assets/123`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setAsset(data);
      } catch (err) {
        Alert.alert('Error', err.message);
      }
    };
    fetchAsset();
  }, []);

  return (
    <View className="flex-1 bg-white pt-12">
      {asset && (
        <TouchableOpacity
          className="bg-blue-500 py-3 px-4 rounded-lg"
          onPress={() => handleBorrow()}
          activeOpacity={0.7}
        >
          <Text className="text-white font-bold text-center">
            Borrow {asset?.name}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
```

---

## 🔄 API Endpoints Reference

### **Authentication**

```
POST /api/auth/login
Body: { studentId, password }
Response: { token, role, studentId, firstName }
Status: 200 OK | 401 Unauthorized

POST /api/auth/register
Body: { studentId, password, firstName, lastName? }
Response: { token, role, studentId }
Status: 201 Created | 400 Bad Request

POST /api/auth/reset-password
Body: { studentId, pin, newPassword }
Response: { message: "Password reset successful" }
Status: 200 OK | 403 Invalid PIN
```

### **Assets**

```
GET /api/assets
Query: category?, status?
Response: Asset[]
Status: 200 OK

GET /api/assets/:id
Response: Asset
Status: 200 OK | 404 Not Found

POST /api/assets (Admin only)
Body: { name, serialNumber, category, description?, image }
Response: Asset
Status: 201 Created

PUT /api/assets/:id (Admin only)
Body: { name?, category?, status?, description? }
Response: Asset
Status: 200 OK

DELETE /api/assets/:id (Admin only)
Response: { message: "Asset deleted" }
Status: 200 OK
```

### **Transactions (Borrowing)**

```
POST /api/transactions/borrow (Protected)
Body: { assetId, dueDate?, reason? }
Response: { id, status: "pending", borrowDate }
Status: 201 Created

GET /api/transactions/my-history (Protected)
Response: Transaction[]
Status: 200 OK

PATCH /api/transactions/:id/extend (Protected)
Body: { newDueDate }
Response: { message: "Due date extended successfully", transaction }
Status: 200 OK | 400 Bad Request | 403 Forbidden | 404 Not Found

GET /api/admin/transactions (Admin only)
Query: status?, studentId?
Response: Transaction[]
Status: 200 OK

POST /api/admin/transactions/:id/approve (Admin only)
Body: { returnDateExpected? }
Response: { status: "approved" }
Status: 200 OK

POST /api/admin/transactions/:id/reject (Admin only)
Body: { reason? }
Response: { status: "rejected" }
Status: 200 OK
```

### **File Upload**

```
POST /api/upload (Protected)
Headers: Content-Type: multipart/form-data
Body: FormData with 'image' field
Response: { imagePath: "/uploads/asset-1234567890.jpg" }
Status: 200 OK
```

---

## 🚀 Setup & Running Locally

### **Prerequisites**

- Node.js 18+ (Backend)
- PostgreSQL 14+ (Database)
- Expo CLI (`npm install -g expo-cli`)
- Android emulator or physical device

### **Database Setup**

```bash
# 1. Create .env in /server
DATABASE_URL="postgresql://user:password@localhost:5432/sut_asset_hub"
JWT_SECRET="your-super-secret-key-change-this-in-production"
PORT=3000

# 2. Apply schema
cd server
npx prisma migrate deploy

# 3. Seed initial data
npx prisma db seed
```

### **Backend**

```bash
cd server
npm install
npm run dev
# Server runs on http://localhost:3000
# Metrics on http://localhost:3000/metrics
```

### **Mobile App**

```bash
cd mobile
npm install
npm start

# Choose:
# Press 'a' for Android
# Press 'i' for iOS
# Press 'w' for Web (testing only)
```

### **Accessing the App**

- **Login**: Use any seeded student account (check `server/prisma/seed.js`)
- **API Base URL**: Auto-detected via Expo debugger host
  - Android emulator: `http://10.0.2.2:3000/api`
  - Tunneling: Auto-detected from `Constants.expoConfig?.hostUri`

---

## 📊 Common Tasks & How-To

### Task: Add a New Asset Category

1. Update `/mobile/app/home.tsx` → `CATS` array
2. No database change needed (categories stored as strings)
3. Update `/mobile/app/home.tsx` icon imports if needed

### Task: Create a New Admin Screen

1. Create file `/mobile/app/admin/new-page.tsx`
2. Import BottomTabBar? (No — admin screens don't have bottom nav)
3. Wrap in `pt-12` for safe area
4. Add role check in controllers if API endpoint needed
5. Test with admin account

### Task: Add Password Reset Flow

1. ✅ Already implemented via `/reset.tsx`
2. Uses PIN recovery (admin sets PIN for users)
3. API: `POST /api/auth/reset-password`

### Task: Upload Asset Image

```typescript
const pickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    aspect: [4, 3],
    quality: 0.8,
  });

  if (!result.canceled) {
    const formData = new FormData();
    formData.append("image", {
      uri: result.assets[0].uri,
      type: "image/jpeg",
      name: "asset.jpg",
    });

    const token = await SecureStore.getItemAsync("token");
    const res = await fetch(`${API_BASE_URL}/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const { imagePath } = await res.json();
    // Use imagePath in asset creation
  }
};
```

### Task: Implement Real-Time Notifications

**Current:** Badge count refreshes every 30 seconds  
**To improve:** Implement WebSocket or server-sent events (future enhancement)

---

## 🐛 Troubleshooting

### **"AsyncStorage is not available" Warning**

- **Cause:** Native module crash on simulator
- **Fix:** Gracefully ignored; tokens fallback to in-memory (`globalAuth.ts`) or SecureStore
- **Expected:** App still works, just less persistent

### **"API Not Reachable" / Network Error**

- Check `API_BASE_URL` is correct:
  - Android Emulator: Must be `http://10.0.2.2:3000/api` (not `localhost`)
  - Physical Device: Use actual machine IP (e.g., `http://192.168.x.x:3000/api`)
- Ensure backend is running: `npm run dev` in `/server`
- Check firewall allows port 3000

### **QR Scanner Won't Work**

- Ensure camera permissions granted on device
- Try restarting the app
- Check `expo-camera` is installed: `npm list expo-camera`

### **JWT Token Expired**

- Tokens stored in SecureStore/AsyncStorage persist across app launches
- Manual logout clears tokens (not yet implemented in UI)
- To force logout: `SecureStore.deleteItemAsync('token')`

### **Admin Routes Inaccessible**

- Verify `role: 'admin'` on login response
- Check server middleware: `authorizeAdmin` function in `authMiddleware.js`
- Test with seed data admin account

---

## 📈 Performance Optimizations

### Implemented

- **FlatList** for asset lists (not ScrollView + map)
- **Notification badge** debounced to 30s refresh (not polling every second)
- **Category filtering** done client-side (assets already loaded)
- **Image caching** via `expo-image` (built-in)

### Future Improvements

- Implement **pagination** for large asset lists (currently loads all)
- Add **offline-first** caching (currently requires network)
- Use **React Query** or **SWR** for advanced cache management
- Implement **virtualization** for very large lists

---

## 🔒 Security Checklist

- ✅ Passwords hashed with bcryptjs (never stored plaintext)
- ✅ JWT tokens signed with secret key (verify on each request)
- ✅ Admin endpoints protected by `authorizeAdmin` middleware
- ✅ CORS enabled for mobile app origin
- ✅ Sensitive tokens stored in SecureStore (encrypted)
- ⚠️ TODO: Rate limiting on auth endpoints
- ⚠️ TODO: HTTPS enforced in production
- ⚠️ TODO: File upload validation (type, size)

---

## 📝 Development Workflow

### Making Changes

1. Create feature branch: `git checkout -b feature/descriptive-name`
2. Make changes to mobile or server
3. Test locally (mobile emulator + backend)
4. Commit: `git add .` → `git commit -m "Clear message"`
5. Push: `git push origin feature/descriptive-name`
6. Create Pull Request on GitHub

### Testing Before Commit

```bash
# Mobile
npm run lint

# Backend
npm run dev  # Auto-restarts on file changes
curl http://localhost:3000/metrics  # Check health
```

### Environment Variables Template

```
# /server/.env
DATABASE_URL="postgresql://user:pass@localhost:5432/sut_asset_hub"
JWT_SECRET="change-me-in-production"
PORT=3000
NODE_ENV=development
```

---

## 📚 Key Files Explained

| File                                      | Purpose                              |
| ----------------------------------------- | ------------------------------------ |
| `mobile/app/_layout.tsx`                  | Root navigator, defines screen stack |
| `mobile/app/home.tsx`                     | Main dashboard, asset listing logic  |
| `mobile/components/BottomTabBar.tsx`      | Navigation bar, tab routing          |
| `mobile/globalAuth.ts`                    | Fallback token storage               |
| `server/src/index.js`                     | Express app initialization           |
| `server/src/middleware/authMiddleware.js` | JWT verification                     |
| `server/prisma/schema.prisma`             | Database schema (source of truth)    |
| `server/prisma/seed.js`                   | Development data                     |

---

## 🎯 Next Steps for Future Development

1. **Implement Search Feature** (`/search.tsx` screen)
2. **Add Real-Time Notifications** (WebSocket or FCM)
3. **Implement History Filtering** (by date, status, category)
4. **Add Admin Analytics** (dashboard charts, stats)
5. **Implement Pagination** (for large asset lists)
6. **Add User Activity Logs** (audit trail)
7. **Implement Email Notifications** (approval alerts)
8. **Add Two-Factor Authentication** (optional)

---

## 📞 Getting Help

- **API Issues?** Check `server/src/routes/` for endpoint definitions
- **UI Not Rendering?** Verify NativeWind classes in tailwind config
- **Auth Problems?** Check `authMiddleware.js` and JWT_SECRET env variable
- **Database Issues?** Run `npx prisma studio` to inspect data
- **Build Failing?** Clear node_modules: `rm -rf node_modules && npm install`

---

## Version History

| Version | Date       | Changes                                                      |
| ------- | ---------- | ------------------------------------------------------------ |
| 1.0.0   | 2026-05-15 | Initial release: Auth, Assets, Transactions, Admin Dashboard |

---

**Last reviewed:** 2026-05-15  
**Maintained by:** Development Team  
**For questions:** Refer to PROJECT_CONTEXT.md for tech stack details
