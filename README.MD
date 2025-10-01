LIVE DEMO: https://ecfr-app.vercel.app/
## eCFR Explorer Overview

The **Code of Federal Regulations (CFR) Explorer** is a web application that allows users to explore the U.S. federal regulations in a structured, interactive way. It aggregates data from the ECFR API and provides insights into the content of federal titles and the agencies responsible for them.  

### Key Features

- **Agency Metrics Dashboard:** View total words, sentence counts, average sentence length, and lexical density for each agency.  
- **Title Explorer:** Browse all CFR titles with details including latest amendments, issue dates, and reserved status.  
- **Full-Text Download:** Download the complete text of any title in plain text format.  
- **Interactive Visualizations:** Visualize word counts per agency using dynamic charts.  
- **Data-Driven Insights:** Metrics are computed automatically from the ECFR data, giving users a clear picture of regulatory content per agency.  
- **Clean, Modern UI:** Built with Next.js and Tailwind CSS for responsive, user-friendly navigation.  

### Tech Stack

- **Next.js** – React framework for server-side rendering and API routes  
- **SQLite (better-sqlite3)** – Stores agencies, titles, and snapshots  
- **ECFR API** – Source for regulatory text and metadata  
- **Recharts** – Charts for agency metrics visualization  

### Use Cases

- Researchers and legal professionals can quickly identify which agencies regulate which areas.  
- Developers can programmatically access CFR metrics via built-in API routes.  
- Anyone can download full CFR title texts for offline analysis or reference.  


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
node fetch.js
```

**Notes:**

- This will create `ecfr.db` in the `backend/` folder.  
- The script may take some time depending on connection speed and available memory.  
- Optional: run Node with `--expose-gc` if you encounter memory issues:

```bash
node --expose-gc fetch.js
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
