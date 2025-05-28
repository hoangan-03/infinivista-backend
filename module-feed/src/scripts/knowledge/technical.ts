import {KnowledgeItem} from './index';

export const technicalKnowledge: KnowledgeItem[] = [
    {
        id: 'api-authentication',
        title: 'API Authentication and Usage',
        content:
            'Infinivista provides a comprehensive RESTful API for developers. Authentication uses JWT tokens with refresh token rotation. Key endpoints include: 1. User management (/api/users) - registration, profile updates, authentication 2. Feed operations (/api/feed) - posts, stories, reactions, comments 3. Communication (/api/communication) - messaging, calling, notifications 4. File uploads (/api/upload) - media processing and CDN integration 5. Real-time features via WebSocket connections 6. Rate limiting (100 requests/minute for standard users) 7. Proper error handling with standardized error codes 8. API versioning and backward compatibility 9. Webhook support for real-time notifications 10. GraphQL endpoint for complex queries',
        category: 'technical',
        tags: ['api', 'authentication', 'development', 'jwt'],
    },
    {
        id: 'architecture-overview',
        title: 'Infinivista Microservices Architecture',
        content:
            'Infinivista uses a scalable microservices architecture: 1. API Gateway (port 3001) - Entry point, load balancing, rate limiting 2. User Module - Authentication, user profiles, security questions 3. Feed Module - Posts, stories, groups, pages, RAG system 4. Communication Module - Messaging, calling, real-time features 5. PostgreSQL databases with separate schemas per service 6. RabbitMQ for asynchronous inter-service communication 7. Docker containerization with Kubernetes orchestration 8. Redis for caching and session management 9. Elasticsearch for search and analytics 10. CDN integration for media delivery 11. Microservice auto-discovery and health checks 12. Distributed tracing and monitoring',
        category: 'technical',
        tags: ['architecture', 'microservices', 'infrastructure', 'scalability'],
    },
    {
        id: 'database-schema',
        title: 'Database Design and Schema',
        content:
            'Infinivista database architecture follows microservice patterns: 1. User Service DB - users, profiles, authentication, security_questions tables 2. Feed Service DB - posts, stories, groups, pages, reactions, comments 3. Communication DB - conversations, messages, call_history, participants 4. Shared configuration via environment variables 5. Database migrations managed per service 6. Data consistency with eventual consistency patterns 7. Optimized indexing for performance 8. Data encryption at rest and in transit 9. Backup and disaster recovery procedures 10. Database monitoring and query optimization 11. Connection pooling and load balancing 12. Data archiving and retention policies',
        category: 'technical',
        tags: ['database', 'schema', 'postgresql', 'data-design'],
    },
    {
        id: 'realtime-features',
        title: 'Real-time Communication Implementation',
        content:
            'Real-time features powered by WebSocket and modern protocols: 1. WebSocket connections for instant messaging 2. Socket.IO for cross-browser compatibility 3. Room-based communication for groups and events 4. Real-time notifications and presence indicators 5. Video calling with WebRTC implementation 6. Audio calling and voice messages 7. Screen sharing capabilities 8. Live streaming with HLS and RTMP support 9. Real-time collaboration on posts and documents 10. Push notifications via FCM and APNs 11. Connection recovery and offline message sync 12. Scalable WebSocket cluster management',
        category: 'technical',
        tags: ['realtime', 'websocket', 'webrtc', 'communication'],
    },
    {
        id: 'security-implementation',
        title: 'Security and Privacy Implementation',
        content:
            'Comprehensive security measures across all services: 1. JWT token-based authentication with RS256 signing 2. Refresh token rotation and secure storage 3. OAuth2 integration for third-party login 4. Rate limiting and DDoS protection 5. Input validation and SQL injection prevention 6. XSS and CSRF protection 7. End-to-end encryption for sensitive communications 8. Data encryption at rest using AES-256 9. Security headers and HTTPS enforcement 10. Regular security audits and vulnerability scanning 11. GDPR compliance and data protection 12. Two-factor authentication support',
        category: 'technical',
        tags: ['security', 'privacy', 'encryption', 'compliance'],
    },
    {
        id: 'deployment-devops',
        title: 'Deployment and DevOps Pipeline',
        content:
            'Modern deployment and DevOps practices: 1. Docker containerization for all services 2. Kubernetes orchestration with auto-scaling 3. CI/CD pipeline with automated testing 4. GitOps workflow with infrastructure as code 5. Blue-green deployment strategy 6. Monitoring with Prometheus and Grafana 7. Centralized logging with ELK stack 8. Service mesh with Istio for microservice communication 9. Automated backup and disaster recovery 10. Multi-environment setup (dev, staging, production) 11. Performance testing and load balancing 12. Security scanning in deployment pipeline',
        category: 'technical',
        tags: ['deployment', 'devops', 'kubernetes', 'ci-cd'],
    },
    {
        id: 'ai-ml-integration',
        title: 'AI and Machine Learning Integration',
        content:
            'Advanced AI/ML features powered by Google Cloud and Vertex AI: 1. Text embeddings using text-embedding-005 model 2. Vector search with Vertex AI Vector Search 3. RAG system for intelligent content retrieval 4. Natural language processing for content analysis 5. Computer vision for image and video processing 6. Recommendation algorithms for content discovery 7. Automated content moderation using ML 8. Sentiment analysis for posts and comments 9. Language detection and translation services 10. Personalization algorithms for feed curation 11. Predictive analytics for user behavior 12. A/B testing framework for ML model deployment',
        category: 'technical',
        tags: ['ai', 'machine-learning', 'vertex-ai', 'nlp'],
    },
];
