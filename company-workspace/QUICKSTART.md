# Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Backend
```bash
npx nx serve backend
```
✅ Backend running at [http://localhost:3000](http://localhost:3000)

### 3. Start the Frontend (in a new terminal)
```bash
npx nx serve frontend
```
✅ Frontend running at [http://localhost:4200](http://localhost:4200)

---

## 📋 Useful Commands

| Command | Description |
|---------|-------------|
| `npx nx serve backend` | Run backend in dev mode |
| `npx nx serve frontend` | Run frontend in dev mode |
| `npx nx test backend` | Run backend tests |
| `npx nx test frontend` | Run frontend tests |
| `npx nx build backend` | Build backend for production |
| `npx nx build frontend` | Build frontend for production |
| `npx nx graph` | View dependency graph |
| `npx nx lint backend` | Lint backend code |
| `npx nx lint frontend` | Lint frontend code |

---

## 🗄️ Database Setup

### SQLite (Default - No Setup Required)
The application uses SQLite by default. Database file will be created automatically.

### PostgreSQL (Optional)
1. Install PostgreSQL on your system
2. Create a database:
   ```bash
   createdb company_db
   ```
3. Update `.env` file:
   ```env
   DB_TYPE=postgres
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=yourpassword
   DB_NAME=company_db
   ```

---

## 🎯 Next Steps

1. **Create your first entity** - See [SETUP.md](SETUP.md#-typeorm-entities)
2. **Add a new feature** - See [SETUP.md](SETUP.md#-creating-new-features)
3. **Explore TailwindCSS** - See [SETUP.md](SETUP.md#-tailwindcss-usage)

---

## 📁 Project Structure

```
company-workspace/
├── apps/
│   ├── backend/          → NestJS API
│   └── frontend/         → Angular App
├── .env                  → Environment config
└── package.json          → Dependencies
```

---

## 🆘 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000 (backend)
npx kill-port 3000

# Kill process on port 4200 (frontend)
npx kill-port 4200
```

### Clear NX Cache
```bash
npx nx reset
```

### Fresh Install
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Documentation

For detailed documentation, see [SETUP.md](SETUP.md)
