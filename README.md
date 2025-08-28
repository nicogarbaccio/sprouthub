# sprouthub

## 🌱 Project Overview
sprouthub is a comprehensive plant care tracker that helps you manage your indoor garden, track plant care schedules, browse a rich plant catalog, and build your personal collection. Designed for plant lovers who want a beautiful, responsive, and intelligent plant management experience that works seamlessly across all devices including native iOS support.

## ✨ Key Features

### 🏠 Core Functionality
- **Plant Catalog:** Browse and search a curated library of plants with detailed care guides and advanced search filters
- **My Plants Collection:** Track your personal plant collection with custom rooms and organization
- **Smart Care Tracking:** Log watering, fertilizing, and other care activities with timestamp tracking
- **Intelligent Reminders:** Never forget to care for your plants with smart notification system
- **Room Management:** Organize plants by rooms (Living Room, Bedroom, Kitchen, etc.) with visual themes and health statistics
- **Plant Health Monitoring:** Track and visualize plant health over time with detailed status indicators

### 🧠 Smart Watering System
- **Intelligent Scheduling:** AI-powered watering recommendations based on environmental factors
- **Environmental Factors:** Considers plant size, light levels, temperature, humidity, season, and soil type
- **User Preferences:** Save and reuse personal watering preferences across all plants
- **Postpone Feature:** Smart postpone functionality for plants that don't need water yet
- **Care Style Adaptation:** Adapts to your care style (frequent, balanced, or minimal)
- **Status Tracking:** Real-time status updates ("Just watered", "Due today", "Overdue", "Postponed")

### 📱 Modern User Experience
- **Progressive Web App (PWA):** Install and use like a native app on any device
- **Native iOS App:** Full Capacitor integration for native iOS functionality and App Store distribution
- **Offline Support:** Access your plant data even without internet connection
- **Responsive Design:** Mobile-first design that works perfectly on all screen sizes
- **Dark/Light Theme:** System-aware theme switching with user preference persistence
- **Touch-Friendly Interface:** Optimized for mobile interactions and gestures
- **Enhanced Room Organization:** Visual room themes, health indicators, and plant statistics

### 🔐 Authentication & Data
- **Secure Authentication:** Email/password and social login with Supabase Auth
- **Real-time Data Sync:** Live updates across all your devices
- **Image Upload:** Store and manage plant photos with cloud storage
- **Data Export:** Export your plant collection and care history
- **User Preferences:** Persistent smart watering preferences and room customization

### 🛠️ Developer Experience
- **Type Safety:** Full TypeScript implementation with strict type checking
- **Modern Testing:** Unit testing with Vitest for reliable quality assurance
- **Component Library:** Consistent UI with shadcn/ui and Radix UI primitives
- **Code Quality:** ESLint, Prettier, and automated formatting
- **Performance Optimized:** Code splitting, lazy loading, and optimized bundles
- **Native Integration:** Capacitor plugins for native device functionality

## 🚀 Tech Stack

### Frontend
- **[Vite](https://vitejs.dev/)** - Lightning-fast build tool and dev server
- **[React 18](https://react.dev/)** - Modern React with hooks and concurrent features
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety and enhanced developer experience
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - High-quality, accessible component library
- **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible UI primitives
- **[React Router v6](https://reactrouter.com/)** - Client-side routing
- **[React Hook Form](https://react-hook-form.com/)** - Performant forms with validation
- **[Zod](https://zod.dev/)** - Schema validation and type inference

### Backend & Database
- **[Supabase](https://supabase.com/)** - Backend-as-a-Service with PostgreSQL
- **[Supabase Auth](https://supabase.com/auth)** - Authentication and user management
- **[Supabase Storage](https://supabase.com/storage)** - File storage for plant images
- **[Supabase Edge Functions](https://supabase.com/edge-functions)** - Serverless functions

### Mobile & Native Features
- **[Capacitor](https://capacitorjs.com/)** - Native iOS app development and deployment
- **iOS Integration** - Native hooks and platform-specific optimizations
- **App Store Ready** - Configured for iOS App Store submission

### State Management & Data Fetching
- **[TanStack Query](https://tanstack.com/query/)** - Powerful data synchronization
- **React Context** - Global state management for UI state
- **[Zustand](https://zustand-demo.pmnd.rs/)** - Lightweight state management (where needed)

### PWA & Performance
- **[Vite PWA](https://vite-pwa-org.netlify.app/)** - Progressive Web App capabilities
- **[Workbox](https://developers.google.com/web/tools/workbox)** - Service worker and caching strategies
- **Code Splitting** - Optimized bundle sizes and lazy loading
- **Image Optimization** - WebP format and responsive images

### Testing & Quality
- **[Vitest](https://vitest.dev/)** - Fast unit and integration testing
- **[ESLint](https://eslint.org/)** - Code linting and quality enforcement
- **[TypeScript ESLint](https://typescript-eslint.io/)** - TypeScript-specific linting rules

### Development Tools
- **[React DevTools](https://react.dev/learn/react-developer-tools)** - Component debugging
- **[Vite DevTools](https://github.com/webfansplz/vite-plugin-vue-devtools)** - Build and bundle analysis
- **Hot Module Replacement** - Instant development feedback

## 📦 Getting Started

### Prerequisites
- **Node.js** (v18+ recommended)
- **npm**, **yarn**, or **bun** package manager
- **Git** for version control
- **Xcode** (for iOS development - macOS only)

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/sprouthub-bloom-tracker.git
cd sprouthub-bloom-tracker

# Install dependencies
npm install
# or
yarn install
# or
bun install
```

### Environment Setup
1. Copy the environment variables:
```bash
cp .env.example .env.local
```

2. Configure your Supabase project:
   - Create a new project at [supabase.com](https://supabase.com)
   - Add your Supabase URL and anon key to `.env.local`
   - Run the database migrations (see Database Setup below)

### Running the Development Server
```bash
npm run dev
# or
yarn dev
# or
bun run dev
```

Visit [http://localhost:8080](http://localhost:8080) to view the app.

### iOS Development
```bash
# Build the app for iOS
npm run build

# Add iOS platform (first time only)
npx cap add ios

# Copy web assets and sync with iOS project
npx cap sync ios

# Open in Xcode
npx cap open ios
```

### Database Setup
The project uses Supabase with the following key tables:
- `profiles` - User profile information
- `user_plants` - User's plant collection
- `watering_records` - Care activity tracking with smart postpone functionality
- `user_watering_preferences` - Smart watering user preferences
- `plants_with_watering_info` - View combining plant and watering data
- `plant_images` - Image storage metadata

Database migrations are located in the `supabase/migrations/` directory.

## 🧪 Testing

### Unit Testing
```bash
# Run all unit tests
npm test
# or
npm run test:unit

# Run tests in watch mode
npm run test:watch
# or
npm run test:unit:watch

# Run tests with coverage report
npm run test:unit:cov
```

### Current Test Coverage

**159 comprehensive unit tests** across 5 test suites with **99.81% statement coverage** and **100% function coverage**.

#### **Overwatering Risk Assessment** (`src/utils/__tests__/overwatering.test.ts`)
**8 tests** - Smart watering risk calculation algorithm:

- ✅ **Risk Level Calculation** - Validates `none`, `low`, `high` risk assessment
- ✅ **Watering Frequency Analysis** - Tests sliding window logic for recent waterings
- ✅ **Postponement Handling** - Ensures postponed waterings are excluded from risk
- ✅ **Interval Analysis** - Validates average watering interval calculations
- ✅ **Edge Cases** - Handles empty records, future dates, boundary conditions
- ✅ **Window Constraints** - Tests 2-30 day window limits

#### **Smart Watering Schedule** (`src/utils/__tests__/smartWateringSchedule.test.ts`)
**34 tests** - Environmental factor calculations and smart scheduling:

- ✅ **Factor Calculations** - Plant size, light level, temperature, humidity adjustments
- ✅ **Seasonal Adjustments** - Winter dormancy, summer growth, spring/fall transitions
- ✅ **Care Style Adaptation** - Frequent, balanced, minimal care preferences
- ✅ **Soil Type Effects** - Draining, regular, moisture-retaining soil impacts
- ✅ **Confidence Scoring** - High/medium/low confidence based on adjustment magnitude
- ✅ **Complex Combinations** - Multi-factor scenarios and extreme conditions
- ✅ **Boundary Testing** - 2-45 day limits, baseline calculations
- ✅ **Season Detection** - Month-based season calculation with date mocking
- ✅ **Label Generation** - User-friendly factor descriptions and ranges

#### **Authentication Validation** (`src/utils/__tests__/auth-validation.test.ts`)
**46 tests** - Form validation and security checks:

- ✅ **Password Security** - Length requirements, special characters, matching validation
- ✅ **Email Validation** - Format checking, domain validation, special character handling
- ✅ **Username Requirements** - Length validation, character restrictions
- ✅ **Combined Scenarios** - Multiple field validation, error aggregation
- ✅ **Edge Cases** - Empty fields, whitespace, case sensitivity
- ✅ **Error Detection** - Comprehensive error checking utility validation

#### **Room Management** (`src/utils/__tests__/rooms.test.ts`)
**32 tests** - Plant organization and room utilities:

- ✅ **Room Labels** - Known room formatting, custom room handling, fallback scenarios
- ✅ **Icon Management** - Room icon retrieval, fallback icons, null handling
- ✅ **Theme System** - Room-specific themes, dark mode support, fallback themes
- ✅ **Plant Grouping** - Room-based organization, sorting logic, unassigned handling
- ✅ **Data Integrity** - Null room values, NO_ROOM_VALUE constant, generic object support
- ✅ **Sorting Logic** - Alphabetical room ordering with unassigned last

#### **Toast Notifications** (`src/utils/__tests__/toast-helpers.test.ts`)
**39 tests** - User feedback and notification system:

- ✅ **Plant Actions** - Add, update, delete, care reminder notifications
- ✅ **Watering Events** - Record, schedule, postpone, overdue, error notifications
- ✅ **Authentication** - Sign in/up/out success and error messages
- ✅ **Profile Management** - Update, password change, error handling
- ✅ **General Utilities** - Save, delete, info, warning, error notifications
- ✅ **Image Upload** - Success, file size, type validation, error handling
- ✅ **Consistency Validation** - Emoji usage, variant assignments, message formatting

### Test Quality Metrics

- **Statement Coverage**: 99.81%
- **Branch Coverage**: 98.4%
- **Function Coverage**: 100%
- **Total Test Files**: 5
- **Total Test Cases**: 159
- **Mocking Strategy**: Vi.js for external dependencies and time-based testing
- **Edge Case Coverage**: Comprehensive null/undefined, boundary, and error scenarios

## 🎨 Code Style & Quality

### Linting and Formatting
```bash
# Check for lint errors
npm run lint
# or
yarn lint
# or
bun run lint

# Auto-fix linting issues
npm run lint:fix
```

### Code Style Guidelines
- **Functional Components** - Using React hooks and functional patterns
- **TypeScript First** - Strict type checking and type safety
- **Mobile-First** - Responsive design starting from mobile
- **Accessibility** - WCAG 2.1 AA compliance with semantic HTML
- **Performance** - Optimized rendering and minimal re-renders
- **Layout Consistency** - Standardized spacing (6rem top margin) and semantic structure across all authenticated pages

## 🏗️ Project Structure
```
src/
├── components/          # Reusable UI and feature components
│   ├── auth/           # Authentication components
│   ├── catalog/        # Plant catalog components with advanced search
│   ├── edit-plant/     # Plant editing forms with smart watering
│   ├── mobile/         # Mobile-specific components
│   ├── plant-details/  # Plant detail views
│   ├── profile/        # User profile components
│   ├── pwa/           # PWA-specific components
│   └── ui/            # Base UI components (shadcn/ui)
├── contexts/           # React context providers
├── data/              # Static data and mock data
│   └── plants/        # Plant catalog data
├── hooks/             # Custom React hooks
│   ├── use-capacitor.tsx     # Capacitor native functionality
│   ├── useUserPlants.ts      # Plant management with smart features
│   └── useSmartWateringPreferences.ts  # Smart watering preferences
├── integrations/      # External service integrations
│   └── supabase/      # Supabase client and types
├── lib/               # Utility functions and helpers
├── pages/             # Top-level route components
├── types/             # TypeScript type definitions
│   └── smartWateringTypes.ts  # Smart watering system types
├── utils/             # Utility functions
│   ├── rooms.ts             # Room management utilities
│   └── smartWateringSchedule.ts  # Smart watering calculations
└── vite-env.d.ts

public/
├── icons/             # PWA app icons
└── ...               # Static assets

ios/                   # iOS Capacitor project
├── App/              # iOS app source
└── ...               # iOS configuration

supabase/
├── functions/         # Edge functions
└── migrations/        # Database migrations

src/utils/__tests__/    # Comprehensive unit test suite
├── overwatering.test.ts         # Overwatering risk calculation (8 tests)
├── smartWateringSchedule.test.ts # Smart watering algorithms (34 tests)
├── auth-validation.test.ts       # Form validation security (46 tests)
├── rooms.test.ts               # Plant organization utilities (32 tests)
└── toast-helpers.test.ts       # User notification system (39 tests)
```

## 🌍 Deployment

### Build for Production
```bash
npm run build
# or
yarn build
# or
bun run build
```

### Web Deployment Options
The app can be deployed to any static hosting provider:

- **Vercel** (Recommended) - Automatic deployments with GitHub integration
- **Netlify** - Static site hosting with form handling
- **Supabase Hosting** - Integrated with your Supabase backend
- **AWS S3 + CloudFront** - Scalable static hosting
- **Your own infrastructure** - Deploy the `dist/` directory contents

### iOS App Store Deployment
1. **Build and sync iOS project:**
   ```bash
   npm run build
   npx cap sync ios
   ```

2. **Open in Xcode:**
   ```bash
   npx cap open ios
   ```

3. **Configure app signing and provisioning profiles in Xcode**

4. **Archive and upload to App Store Connect**

### PWA Deployment Considerations
- Ensure HTTPS is enabled for PWA features
- Configure proper caching headers
- Test installation and offline functionality
- Set up push notification service (if applicable)

## 🔧 Configuration

### PWA Manifest
The app includes a comprehensive PWA manifest with:
- App icons for all device sizes (72px to 512px)
- Splash screens and maskable icons
- Standalone display mode
- Portrait orientation lock
- Theme and background colors

### Service Worker
Configured with Workbox for:
- **Asset Caching** - Static resources and images
- **API Caching** - Supabase API responses with smart invalidation
- **Offline Fallbacks** - Graceful offline experience
- **Background Sync** - Queue actions when offline

### Capacitor Configuration
Native iOS features configured:
- **Status Bar** - Adaptive styling for iOS
- **Splash Screen** - Native iOS launch screen
- **Keyboard** - Native keyboard handling
- **Storage** - Secure native storage integration

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Process
1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Follow code style** guidelines and run linting
4. **Add tests** for new functionality
5. **Commit changes** with descriptive messages
6. **Push to branch** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request** with detailed description

### Commit Convention
We use conventional commits for automated versioning:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation updates
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions/modifications
- `chore:` Maintenance tasks

### Code Review Process
- All PRs require review before merging
- Tests must pass and coverage maintained
- Follow TypeScript and React best practices
- Ensure responsive design works on all devices

## 📄 License
MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments
- [shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- [Supabase](https://supabase.com/) for the powerful backend platform
- [Capacitor](https://capacitorjs.com/) for seamless native integration
- [Lucide](https://lucide.dev/) for the icon system
- Plant care community for inspiration and feedback

---

*Happy growing with sprouthub!* 🌿✨

> Built with ❤️ for plant lovers everywhere
