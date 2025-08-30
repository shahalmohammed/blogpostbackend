## Tech Stack

- **Frontend:** Next.js, TypeScript, Tailwind CSS  
- **Backend:** Express.js, Node.js, Mongoose
- **Database:** MongoDB Atlas
- **Authentication:** JWT

---

## Setup & Installation

### 1. Clone the Repository
git clone <repo-url>
cd repo-root
```

### 2. Backend Setup
cd blog-backend
npm install
```

#### Create `.env` file inside `blog-backend/`:
```env
PORT=4000
JWT_SECRET=superlongrandomjwtsecret_change_me
JWT_EXPIRES_IN=7d
MONGODB_URI=mongodb+srv://helpdeskshaan7_db_user:C7PFyvRuM2n1rhgh@cluster0.nyilg8r.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
DB_NAME=blogapp
```

#### Start the backend:
npm run dev
---

### 3. Frontend Setup
cd blog-frontend
npm install
npm run dev
```

Frontend will be live at: https://blogpostfrontend-bzgc-qvwai2rwy-shahals-projects-2a647e79.vercel.app/
Backend will be live at:  https://blogpostbackend-fqyz.onrender.com/api
---

## API Endpoints (Backend)

### Authentication
- `POST /api/auth/register` → Register new user  
- `POST /api/auth/register-admin` → Create admin (only once, then admin-only)  
- `POST /api/auth/login` → Login & get JWT  
- `GET /api/auth/me` → Get current user  
- `PUT /api/auth/me` → Update profile (name/email)  
- `PUT /api/auth/me/password` → Change password  

---

### Posts
- `GET /api/posts` → List all posts (public)  
- `GET /api/posts/:id` → Get single post  
- `POST /api/posts` → Create post (**auth**)  
- `PUT /api/posts/:id` → Update post (owner/admin)  
- `DELETE /api/posts/:id` → Delete post (owner/admin)  

---

### Comments
- `GET /api/posts/:id/comments` → List comments  
- `POST /api/posts/:id/comments` → Add comment (**auth**)  
- `DELETE /api/comments/:id` → Delete comment (owner/admin)  

---

### Users (Admin only)
- `GET /api/users` → List users  
- `PUT /api/users/:id` → Update user (e.g., role)  
- `DELETE /api/users/:id` → Delete user  

---

## Deployment

- **Backend:** Hosted on Render  
- **Database:** MongoDB Atlas
- **Frontend:** Hosted on Vercel
