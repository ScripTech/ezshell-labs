# Lab Provisioner Microservice

A Node.js microservice for provisioning AWS EC2 lab instances for the EZShell Labs platform. This service handles asynchronous lab enrollment requests via Kafka messaging and provisions AWS resources with secure SSH key management.

## 🚀 Features

- **AWS EC2 Provisioning**: Automated t2.micro instance creation with custom AMI
- **Kafka Integration**: Asynchronous message processing for lab enrollments
- **SSH Key Management**: Secure key pair generation and temporary storage
- **Database Integration**: PostgreSQL with Drizzle ORM for persistence
- **REST API**: RESTful endpoints for enrollment and status management
- **Docker Support**: Multi-stage containerization for production deployment
- **Comprehensive Testing**: Jest + Supertest with 14+ passing tests
- **Production Logging**: Structured logging with Winston
- **Health Monitoring**: Health checks and graceful shutdown

## 📋 Prerequisites

- Node.js 18.x or higher
- PostgreSQL database (shared with frontend)
- AWS account with EC2 permissions
- Kafka broker (local or cloud)
- Docker (optional)

## 🛠️ Installation

### 1. Clone and Install Dependencies

```bash
cd lab-provisioner
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure:

```bash
cp .env.example .env
```

Update `.env` with your configuration:

```env
# Server Configuration
PORT=3002
NODE_ENV=development
LOG_LEVEL=info

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/ezshell_labs

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_INSTANCE_TYPE=t2.micro
AWS_AMI_ID=ami-0abcdef1234567890
AWS_SECURITY_GROUP_ID=sg-xxxxxxxxx
AWS_SUBNET_ID=subnet-xxxxxxxxx
AWS_KEY_PAIR_PREFIX=ezshell-lab

# Kafka Configuration
KAFKA_BROKER=localhost:9092
KAFKA_CLIENT_ID=lab-provisioner
KAFKA_TOPIC=lab-enrollment
KAFKA_CONSUMER_GROUP=lab-provisioner-group

# SSH Key Management
SSH_KEY_DIR=/tmp/ssh-keys
SSH_KEY_PERMISSIONS=0600

# Provisioning Configuration
PROVISIONING_TIMEOUT=300000
INSTANCE_POLL_INTERVAL=5000

# CORS
CORS_ORIGIN=http://localhost:3000
```

### 3. Database Setup

The service uses shared database tables with the frontend. Ensure these tables exist:

- `labs` - Lab definitions
- `lab_enrollments` - User enrollments
- `lab_provisions` - Provisioned instances
- `provisioning_queue` - Processing queue
- `ssh_keys` - SSH key metadata

## 🚀 Usage

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Type checking
npm run type-check
```

### Docker Deployment

```bash
# Build image
npm run docker:build

# Run container
npm run docker:run
```

## 📡 API Endpoints

### Health Check

```http
GET /health
```

Returns service health status and dependency checks.

### Lab Enrollment

```http
POST /api/enrollment/enroll
Content-Type: application/json

{
  "userId": "550e8400-e29b-41d4-a716-446655440002",
  "labId": "550e8400-e29b-41d4-a716-446655440003"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Lab enrollment queued for provisioning",
  "data": {
    "enrollmentId": "550e8400-e29b-41d4-a716-446655440001",
    "userId": "550e8400-e29b-41d4-a716-446655440002",
    "labId": "550e8400-e29b-41d4-a716-446655440003",
    "status": "queued",
    "queuedAt": "2023-07-14T12:00:00.000Z"
  },
  "timestamp": "2023-07-14T12:00:00.000Z"
}
```

### Check Status

```http
GET /api/enrollment/status/{enrollmentId}
```

**Response:**

```json
{
  "enrollmentId": "550e8400-e29b-41d4-a716-446655440001",
  "userId": "550e8400-e29b-41d4-a716-446655440002",
  "labId": "550e8400-e29b-41d4-a716-446655440003",
  "enrollmentStatus": "enrolled",
  "progress": 100,
  "enrolledAt": "2023-07-14T12:00:00.000Z",
  "completedAt": "2023-07-14T12:05:00.000Z",
  "provisioning": {
    "status": "completed",
    "attempts": 1,
    "maxAttempts": 3,
    "queuedAt": "2023-07-14T12:00:00.000Z",
    "processedAt": "2023-07-14T12:02:00.000Z"
  },
  "instance": {
    "instanceId": "i-1234567890abcdef0",
    "publicIp": "1.2.3.4",
    "privateIp": "10.0.1.100",
    "state": "running",
    "keyPairName": "ezshell-lab-user-lab-123",
    "provisionedAt": "2023-07-14T12:02:30.000Z"
  },
  "timestamp": "2023-07-14T12:00:00.000Z"
}
```

### List Enrollments

```http
GET /api/enrollment/list?page=1&limit=10
```

Returns paginated list of all enrollments with their status.

## 🏗️ Architecture

### Components

- **Controllers**: REST API endpoints
- **Services**: Business logic (AWS, Kafka)
- **Models**: Database schema definitions
- **Utils**: Utilities (logging, SSH keys)
- **Config**: Configuration management

### Data Flow

1. **Enrollment Request** → REST API validates and creates database records
2. **Kafka Message** → Published to lab-enrollment topic
3. **Consumer Processing** → Receives message and provisions AWS resources
4. **Instance Launch** → Creates EC2 instance with SSH key pair
5. **Status Updates** → Database updated with instance details
6. **Cleanup** → Automated cleanup of expired resources

### Database Schema

```sql
-- Lab provisions
CREATE TABLE lab_provisions (
  id TEXT PRIMARY KEY,
  enrollment_id TEXT NOT NULL,
  instance_id TEXT,
  public_ip TEXT,
  private_ip TEXT,
  key_pair_name TEXT,
  instance_state instance_state DEFAULT 'pending',
  provisioned_at TIMESTAMP,
  terminated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Provisioning queue
CREATE TABLE provisioning_queue (
  id TEXT PRIMARY KEY,
  enrollment_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  lab_id TEXT NOT NULL,
  status provisioning_status DEFAULT 'queued',
  message_data JSONB,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_error TEXT,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- SSH keys
CREATE TABLE ssh_keys (
  id TEXT PRIMARY KEY,
  provision_id TEXT NOT NULL,
  public_key TEXT,
  private_key_hash TEXT,
  key_pair_name TEXT NOT NULL UNIQUE,
  file_path TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);
```

## 🧪 Testing

The service includes comprehensive tests:

- **Unit Tests**: Individual component testing
- **Integration Tests**: API endpoint testing
- **Mock Services**: Database and Kafka mocking

### Test Coverage

- ✅ Enrollment API endpoints
- ✅ Validation and error handling
- ✅ Database operations
- ✅ Kafka message processing
- ✅ AWS service integration
- ✅ SSH key management

### Running Tests

```bash
# All tests
npm test

# Specific test files
npm test -- enrollment-working.test.ts

# With coverage
npm test -- --coverage
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3002` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_URL` | PostgreSQL connection | Required |
| `AWS_REGION` | AWS region | `us-east-1` |
| `AWS_INSTANCE_TYPE` | EC2 instance type | `t2.micro` |
| `KAFKA_BROKER` | Kafka broker URL | `localhost:9092` |
| `SSH_KEY_DIR` | SSH key storage | `/tmp/ssh-keys` |
| `PROVISIONING_TIMEOUT` | Max provision time | `300000` (5min) |

### AWS Permissions

Required IAM permissions:

- `ec2:RunInstances`
- `ec2:DescribeInstances`
- `ec2:TerminateInstances`
- `ec2:CreateKeyPair`
- `ec2:DeleteKeyPair`
- `ec2:CreateTags`

## 📊 Monitoring

### Health Checks

The `/health` endpoint monitors:
- Database connectivity
- SSH key manager status
- Kafka consumer status

### Logging

Structured logging with multiple levels:
- **Error**: Application errors
- **Warn**: Warning conditions
- **Info**: General information
- **Debug**: Detailed debugging
- **HTTP**: Request logging

Logs are written to:
- Console (formatted)
- `logs/combined.log` (JSON)
- `logs/error.log` (errors only)

### Metrics

Key metrics to monitor:
- Enrollment processing time
- AWS instance launch success rate
- Kafka message lag
- Database connection health

## 🐳 Docker

### Multi-stage Build

The Dockerfile uses multi-stage builds for optimization:

1. **Build Stage**: Install dependencies and compile TypeScript
2. **Production Stage**: Runtime environment with minimal dependencies

### Production Deployment

```bash
# Build production image
docker build -t lab-provisioner:latest .

# Run with environment file
docker run -d \
  --name lab-provisioner \
  --env-file .env \
  -p 3002:3002 \
  lab-provisioner:latest
```

## 🔒 Security

### SSH Key Management

- Private keys stored with `0600` permissions
- Automatic cleanup of expired keys
- Hash-based verification
- Temporary storage only

### AWS Security

- Instance tagging for identification
- Auto-termination tags
- Security group restrictions
- Key pair rotation

### API Security

- Input validation with Joi
- Helmet.js security headers
- CORS configuration
- Error message sanitization

## 🚨 Troubleshooting

### Common Issues

#### Database Connection Errors

```bash
# Check connection string
echo $DATABASE_URL

# Test database connectivity
npm run type-check
```

#### AWS Permission Issues

```bash
# Verify AWS credentials
aws sts get-caller-identity

# Test EC2 permissions
aws ec2 describe-instances --max-items 1
```

#### Kafka Connection Problems

```bash
# Test Kafka connectivity
kafkacat -L -b localhost:9092

# Check topic exists
kafka-topics --list --bootstrap-server localhost:9092
```

### Debug Mode

Enable debug logging:

```bash
LOG_LEVEL=debug npm run dev
```

## 📈 Performance

### Optimization

- Connection pooling for database
- Kafka consumer group for scalability
- Async processing for non-blocking operations
- Efficient AWS SDK usage

### Scaling

- Horizontal scaling via multiple consumer instances
- Database read replicas for status queries
- Kafka partitioning for message distribution
- AWS resource limits consideration

## 🤝 Contributing

1. Follow TypeScript best practices
2. Add tests for new features
3. Update documentation
4. Use conventional commit messages
5. Ensure all tests pass

## 📝 License

This project is part of the EZShell Labs platform and follows the main project's licensing terms.

## 📞 Support

For issues and questions:

- Create GitHub issues for bugs
- Check logs for debugging information
- Monitor health endpoints for service status
- Review AWS CloudWatch for infrastructure metrics
