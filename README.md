# EZShell Labs 🚀

**Interactive DevOps Learning Platform with Real-time Validation**

EZShell Labs is a comprehensive hands-on learning platform designed for DevOps professionals and students. It provides interactive Linux terminal sessions with real-time validation, progressive scoring, and comprehensive lab management.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-ISC-green.svg)
![Node.js](https://img.shields.io/badge/node.js-18%2B-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)

## ✨ Features

### 🎯 Core Capabilities
- **Interactive Terminal Sessions**: Real browser-based Linux terminal with SSH connectivity
- **Real-time Validation**: Live step-by-step validation with instant feedback
- **Progressive Scoring System**: Advanced scoring algorithm with penalties, bonuses, and difficulty presets
- **Lab Management**: Complete lab lifecycle management with enrollments and progress tracking
- **Multi-user Support**: User authentication, role-based access, and session management

### 📊 Advanced Scoring System
- **Question Type Presets**: BASIC (10pts), INTERMEDIATE (15pts), ADVANCED (20pts), CRITICAL (25pts)
- **Progressive Penalties**: Configurable penalty per attempt (default 7.5%)
- **Step Weighting**: Custom importance levels for different validation steps
- **Minimum Score Protection**: Prevents complete failure with configurable floor
- **First Attempt Bonus**: Rewards successful completion on first try
- **Real-time Score Calculation**: Live scoring updates during validation

### 🔐 Authentication & Security
- **NextAuth.js Integration**: Secure authentication with JWT tokens
- **Role-based Access Control**: Admin and user role management
- **Protected Routes**: Middleware-based route protection
- **Socket Authentication**: Secure real-time communication
- **Session Management**: Comprehensive user session handling

## 🏗️ Architecture

```
ezshell-labs/
├── frontend/              # Next.js frontend application
│   ├── src/
│   │   ├── app/          # Next.js 14 App Router
│   │   ├── components/   # Reusable UI components
│   │   ├── services/     # API and socket services
│   │   ├── hooks/        # Custom React hooks
│   │   └── types/        # TypeScript definitions
│   └── drizzle/          # Database migrations
├── backend/              # Node.js/Express backend
│   ├── src/
│   │   ├── controllers/  # Validation controllers
│   │   ├── services/     # Business logic services
│   │   ├── handlers/     # Lab validation handlers
│   │   ├── utils/        # Utility functions
│   │   └── db/          # Database schemas
├── docs/                 # Documentation
├── shell-node/          # Docker container for lab environments
└── scripts/             # Utility scripts
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **Authentication**: NextAuth.js
- **Database**: Drizzle ORM + Neon PostgreSQL
- **Real-time**: Socket.IO Client

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: Socket.IO
- **SSH**: SSH2 library for terminal connections
- **Testing**: Jest

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Database**: PostgreSQL
- **Environment**: CentOS-based lab containers

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL database (or use included Docker setup)

### 1. Clone the Repository
```bash
git clone https://github.com/ScripTech/ezshell-labs.git
cd ezshell-labs
```

### 2. Environment Setup
```bash
# Copy environment files
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env

# Configure your environment variables
# - Database connection strings
# - NextAuth secret and providers
# - SSH configuration
```

### 3. Database Setup
```bash
# Start PostgreSQL with Docker
docker-compose up -d postgres

# Setup database (run from frontend directory)
cd frontend
npm run db:setup
cd ../backend
npm run db:setup
```

### 4. Install Dependencies
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

### 5. Start Development Servers
```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev

# Terminal 3: Start lab containers
docker-compose up -d
```

### 6. Access the Application
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001
- **Database**: localhost:5432

## 📚 Lab Management

### Available Lab Types
- **EX200**: Red Hat Certified System Administrator (RHCSA)
- **EX280**: Red Hat Certified Specialist in OpenShift
- **DO280**: Red Hat OpenShift Development

### Creating New Labs
1. Add lab definition in `backend/src/handlers/`
2. Implement validation controllers in `backend/src/controllers/labs/`
3. Create validation services in `backend/src/services/`
4. Add lab metadata to database
5. Configure scoring presets

### Validation System
```typescript
// Example validation controller
export class NetworkConfigController {
  async handleValidation(socket: Socket, data: ValidationContext) {
    const context = ScoringUtils.createScoringContext(data, 'INTERMEDIATE', {
      penaltyPerAttempt: 10,
      minimumScorePercent: 30,
      firstAttemptBonus: 5
    });

    await this.trackingService.executeValidationWithSocketTracking(
      context,
      async (trackedSocket) => {
        return await this.performNetworkValidation(trackedSocket);
      }
    );
  }
}
```

## 🎯 Scoring System

### Question Type Presets
```typescript
const SCORING_PRESETS = {
  BASIC: {
    basePoints: 10,
    penaltyPerAttempt: 5,
    minimumScorePercent: 20,
    maxAttempts: 3,
    firstAttemptBonus: 2
  },
  INTERMEDIATE: {
    basePoints: 15,
    penaltyPerAttempt: 7.5,
    minimumScorePercent: 25,
    maxAttempts: 3,
    firstAttemptBonus: 3
  },
  ADVANCED: {
    basePoints: 20,
    penaltyPerAttempt: 10,
    minimumScorePercent: 30,
    maxAttempts: 3,
    firstAttemptBonus: 5
  },
  CRITICAL: {
    basePoints: 25,
    penaltyPerAttempt: 15,
    minimumScorePercent: 40,
    maxAttempts: 3,
    firstAttemptBonus: 8
  }
};
```

### Score Calculation Formula
```
Final Score = Base Points × (
  (Steps Passed / Total Steps) ×
  (1 - (Attempt Number - 1) × Penalty Percentage) ×
  Step Weight Factor
) + First Attempt Bonus
```

## 🔧 Development

### Running Tests
```bash
# Backend tests
cd backend
npm test
npm run test:coverage

# Frontend tests (if configured)
cd frontend
npm test
```

### Database Operations
```bash
# Generate new migration
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database
npm run db:seed

# Reset and setup
npm run db:setup
```

### Docker Development
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Reset lab environment
./lab-reset.sh

# Reset database
./db-reset.sh
```

## 📖 API Documentation

### Socket Events

#### Validation Events
- `validate-exercise`: Start validation for a specific exercise
- `validation-step`: Real-time step updates
- `validation-completed`: Final validation results with scoring
- `validation-error`: Error handling
- `validation-attempts-reached`: Maximum attempts exceeded

#### Authentication Events
- `authenticate`: Authenticate socket connection
- `authentication-success`: Authentication confirmed
- `authentication-failed`: Authentication rejected

### REST Endpoints

#### Authentication
- `POST /api/auth/token`: Generate JWT token
- `GET /api/auth/[...nextauth]`: NextAuth.js endpoints

#### Labs
- `GET /api/labs`: List available labs
- `POST /api/labs/enroll`: Enroll in a lab
- `GET /api/labs/history`: User lab history

#### Validation
- `GET /api/task-validation/[taskId]/history`: Task validation history
- `POST /api/task-validation/[taskId]`: Manual validation trigger

## 🔒 Security

### Authentication Flow
1. User logs in via NextAuth.js
2. JWT token generated with user claims
3. Token validated on each request via middleware
4. Socket connections authenticated with JWT
5. Role-based access control enforced

### Protected Routes
- `/user/*`: Requires authentication
- `/admin/*`: Requires admin role
- `/ezshell/*`: Requires authentication + lab enrollment

## 🌟 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Update documentation
- Follow conventional commit messages
- Ensure Docker compatibility

## 📋 Roadmap

- [ ] **Enhanced Lab Types**: Additional certification tracks
- [ ] **AI-Powered Hints**: Intelligent assistance system
- [ ] **Team Collaboration**: Multi-user lab sessions
- [ ] **Advanced Analytics**: Detailed learning analytics
- [ ] **Mobile Support**: Responsive mobile interface
- [ ] **Kubernetes Integration**: Container orchestration labs
- [ ] **CI/CD Pipelines**: DevOps workflow labs

## 🤝 Support

- **Documentation**: Check the `/docs` directory
- **Issues**: GitHub Issues for bug reports
- **Discussions**: GitHub Discussions for questions
- **Email**: Support via project maintainers

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Edilson D Mucanze** - *Creator & Lead Developer*
- **Contributors** - See [CONTRIBUTORS.md](CONTRIBUTORS.md)

## 🙏 Acknowledgments

- Red Hat for certification content inspiration
- Open source community for excellent tools
- Contributors and testers
- Educational institutions using this platform

---

**Built with ❤️ for the DevOps community**

For detailed documentation, visit the [docs](./docs) directory.
