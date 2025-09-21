# ABY Challenge Frontend

A modern React frontend application built with TypeScript, Vite, and React Query.

## 🚀 Tech Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe JavaScript
- **Vite** - Lightning-fast build tool
- **React Query (TanStack Query)** - Powerful data fetching and caching
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client for API calls

## 🛠️ Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend server running on `http://localhost:8000`

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
src/
├── lib/
│   ├── api.ts          # Axios configuration and API endpoints
│   └── queryClient.ts  # React Query configuration
├── types/
│   └── api.ts          # TypeScript type definitions
├── App.tsx             # Main application component
├── main.tsx            # Application entry point
└── index.css           # Global styles with Tailwind directives
```

## 🔌 Backend Integration

The frontend connects to the FastAPI backend with the following features:

### Authentication
- Login/logout functionality
- JWT token management
- Protected routes

### Image Generation
- Create generation jobs
- Monitor job progress
- View generated images

### Real-time Updates
- WebSocket connection for live updates
- Concurrent prediction status monitoring
- Real-time progress tracking

## 🎨 Features

### React Query Integration
- Automatic caching and background updates
- Optimistic updates
- Error handling and retry logic
- DevTools for debugging

### Modern UI
- Responsive design with Tailwind CSS
- Loading states and error handling
- Clean, modern interface
- Mobile-friendly

### TypeScript
- Full type safety
- IntelliSense support
- Better developer experience
- Catch errors at compile time

## 🔧 Configuration

### API Base URL
Update the API base URL in `src/lib/api.ts`:

```typescript
const API_BASE_URL = 'http://localhost:8000';
```

### Environment Variables
Create a `.env` file for environment-specific configuration:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## 🚀 Development

### Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production
```bash
npm run build
```

### Type Checking
```bash
npm run type-check
```

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile devices

## 🔄 State Management

Uses React Query for:
- Server state management
- Caching
- Background updates
- Error handling
- Loading states

## 🌐 API Integration

### Endpoints Used
- `GET /health` - Backend health check
- `POST /api/v1/auth/login` - User authentication
- `POST /api/v1/generate` - Create image generation job
- `GET /api/v1/generate/{job_id}` - Get job status
- `WS /api/v1/generate/{job_id}` - WebSocket for real-time updates

### Error Handling
- Automatic retry for failed requests
- User-friendly error messages
- Network error detection
- Token refresh handling

## 🚀 Next Steps

1. **Authentication Components**: Login/logout forms
2. **Image Generation Interface**: Prompt input and job creation
3. **Job Monitoring**: Real-time status updates with WebSocket
4. **Image Gallery**: Display generated images
5. **User Dashboard**: Job history and management

## 🤝 Contributing

1. Follow TypeScript best practices
2. Use React Query for server state
3. Follow Tailwind CSS conventions
4. Write type-safe code
5. Test components thoroughly

## 📄 License

This project is part of the ABY Challenge.