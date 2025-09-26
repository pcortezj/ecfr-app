# eCFR Explorer

This project contains a **frontend** (Next.js) for exploring eCFR titles and a **backend** script to fetch and store eCFR data in a SQLite database.

---

## Requirements

- Node.js (v18+ recommended)  
- npm or yarn  
- Internet connection to fetch eCFR data  

---

## Setup

1. Clone the repository:

```bash
git clone https://github.com/pcortezj/ecfr-app.git
cd ecfr-app
```

2. Install dependencies for both frontend and backend:

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

---

## Running the Fetch Script

The fetch script downloads all eCFR titles and stores them in a local SQLite database.

```bash
cd backend
node db_init
node fetch_ecfr.js
```

**Notes:**

- This will create `ecfr.db` in the `backend/` folder.  
- The script may take some time depending on connection speed and available memory.  
- Optional: run Node with `--expose-gc` if you encounter memory issues:

```bash
node --expose-gc fetch_ecfr.js
```

---

## Running the Frontend

```bash
cd frontend
npm run dev
```

- The frontend will be available at [http://localhost:3000](http://localhost:3000).  
- It automatically fetches data from the backend API.  

---

## Notes

- The frontend expects the database (`ecfr.db`) to exist in `backend/`.  
