# CSV Management System

A full-stack web application for uploading, validating, editing, and exporting CSV files with real-time

## Features

### 🚀 Core Features
- **File Upload**: Drag-and-drop interface for uploading two CSV files (strings.csv and classifications.csv)
- **Data Validation**: Real-time cross-referencing validation between CSV files
- **Inline Editing**: Edit data directly in interactive tables with TanStack Table
- **Export**: Download validated CSV files with cloud storage integration
- **Error Highlighting**: Visual feedback for validation errors with detailed tooltips

### 🛠 Technology Stack

**Frontend:**
- React 19 with TypeScript
- TanStack Table v8 for data tables
- React Dropzone for file uploads
- Vite for development and building

**Backend:**
- Node.js with Express and TypeScript
- Cloudflare R2 (S3-compatible) for file storage
- CSV parsing with csv-parser and fast-csv
- Multer for file upload handling

## Project Structure

```
knostic/
├── apps/
│   ├── client/                 # React frontend
│   │   ├── src/
│   │   │   ├── components/     # Reusable UI components
│   │   │   ├── pages/         # Main application pages
│   │   │   ├── types/         # TypeScript interfaces
│   │   │   ├── utils/         # API utilities
│   │   │   └── App.tsx
│   │   └── package.json
│   └── server/                 # Node.js backend
│       ├── src/
│       │   ├── controllers/   # API route handlers
│       │   ├── services/      # Business logic
│       │   ├── middleware/    # Express middleware
│       │   └── app.ts
│       └── package.json
└── package.json               # Workspace root

## Validation Rules

The application validates that every combination of `Topic + SubTopic + Industry` in the strings CSV exists in the classifications CSV. Invalid combinations are:
- Highlighted in red in the data table
- Listed in the validation summary
- Prevent export until resolved

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Cloudflare R2 credentials (optional for development)

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd knostic
   npm install
   ```

2. **Configure environment variables:**

   **Backend** (`apps/server/.env`):
   ```env
   PORT=3001
   NODE_ENV=development
   CLIENT_URL=http://localhost:5173

   # Optional: Cloudflare R2 Configuration
   CLOUDFLARE_ACCOUNT_ID=your_account_id
   CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key
   CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_key
   CLOUDFLARE_R2_BUCKET_NAME=csv-management-bucket
   ```

   **Frontend** (`apps/client/.env`):
   ```env
   VITE_API_URL=http://localhost:3001
   ```

3. **Start development servers:**
   ```bash
   npm run dev
   ```

   This starts both frontend (http://localhost:5173) and backend (http://localhost:3001) concurrently.

### Alternative Commands

```bash
# Start backend only
npm run server

# Start frontend only
npm run client

# Build for production
npm run build

# Build individual apps
npm run build:client
npm run build:server
```

## API Endpoints

### POST /api/upload
Upload and process CSV files
- **Body**: FormData with `strings` and `classifications` files
- **Response**: Parsed data with validation results

### POST /api/validate
Validate data integrity
- **Body**: JSON with `stringsData` and `classificationsData`
- **Response**: Validation result with errors

### POST /api/export
Export validated CSV files
- **Body**: JSON with validated data
- **Response**: Download URLs for processed files

## Development Notes

### Without Cloudflare R2
The application works without R2 credentials by simulating file operations. For production, configure R2 credentials for actual cloud storage.

### File Upload Flow
1. Files uploaded via React Dropzone
2. Backend parses CSV content
3. Cross-reference validation performed
4. Files stored in R2 (or simulated)
5. Parsed data returned to frontend

### Validation System
- Real-time validation as users edit data
- Error highlighting with tooltips
- Validation summary with detailed error reports
- Export blocked until all validation errors resolved

## Testing

```bash
# Run tests (when implemented)
npm test
```

## Production Deployment

1. Configure production environment variables
2. Build the applications: `npm run build`
3. Deploy backend to your preferred hosting service
4. Deploy frontend static files to CDN/hosting service
5. Configure Cloudflare R2 bucket and credentials

## License

MIT License