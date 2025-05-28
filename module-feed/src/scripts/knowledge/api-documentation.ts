import {KnowledgeItem} from './index';

export const apiDocumentationKnowledge: KnowledgeItem[] = [
    {
        id: 'api-user-endpoints',
        title: 'User Management API Endpoints',
        content:
            'Comprehensive user management endpoints: 1. POST /api/users/register - User registration with email verification 2. POST /api/users/login - Authentication with JWT token response 3. POST /api/users/refresh - Refresh JWT tokens 4. GET /api/users/profile - Get user profile information 5. PUT /api/users/profile - Update user profile 6. POST /api/users/upload-avatar - Upload profile picture 7. GET /api/users/search - Search users with filters 8. POST /api/users/follow - Follow/unfollow users 9. GET /api/users/followers - Get followers list 10. GET /api/users/following - Get following list 11. POST /api/users/security-questions - Set security questions 12. POST /api/users/reset-password - Password reset flow',
        category: 'api-documentation',
        tags: ['api', 'users', 'authentication', 'endpoints'],
    },
    {
        id: 'api-feed-endpoints',
        title: 'Feed and Content API Endpoints',
        content:
            'Social feed and content management endpoints: 1. GET /api/feed - Get personalized news feed 2. POST /api/feed/posts - Create new post 3. GET /api/feed/posts/:id - Get specific post 4. PUT /api/feed/posts/:id - Update post 5. DELETE /api/feed/posts/:id - Delete post 6. POST /api/feed/posts/:id/react - Add reaction to post 7. POST /api/feed/posts/:id/comments - Add comment 8. GET /api/feed/stories - Get stories feed 9. POST /api/feed/stories - Create story 10. GET /api/feed/groups - Get user groups 11. POST /api/feed/groups - Create group 12. GET /api/feed/pages - Get pages feed',
        category: 'api-documentation',
        tags: ['api', 'feed', 'posts', 'social'],
    },
    {
        id: 'api-communication-endpoints',
        title: 'Communication API Endpoints',
        content:
            'Messaging and communication endpoints: 1. GET /api/communication/conversations - Get user conversations 2. POST /api/communication/conversations - Create new conversation 3. GET /api/communication/conversations/:id/messages - Get conversation messages 4. POST /api/communication/conversations/:id/messages - Send message 5. PUT /api/communication/messages/:id - Update message 6. DELETE /api/communication/messages/:id - Delete message 7. POST /api/communication/messages/:id/react - React to message 8. GET /api/communication/call-history - Get call history 9. POST /api/communication/calls - Initiate call 10. WebSocket /ws/communication - Real-time messaging 11. POST /api/communication/upload - Upload media files 12. GET /api/communication/participants/:conversationId - Get conversation participants',
        category: 'api-documentation',
        tags: ['api', 'communication', 'messaging', 'realtime'],
    },
    {
        id: 'api-response-formats',
        title: 'API Response Formats and Error Handling',
        content:
            'Standardized API response formats and error handling: 1. Success responses with data, message, and metadata 2. Error responses with error codes, messages, and details 3. Pagination format with page, limit, total, and hasNext 4. HTTP status codes following REST conventions 5. Rate limiting headers (X-RateLimit-Limit, X-RateLimit-Remaining) 6. Authentication errors (401 Unauthorized, 403 Forbidden) 7. Validation errors with field-specific messages 8. Server errors with request tracking IDs 9. API versioning through headers or URL paths 10. Content-Type negotiation (JSON, XML) 11. CORS headers for cross-origin requests 12. Response compression and caching headers',
        category: 'api-documentation',
        tags: ['api', 'responses', 'errors', 'standards'],
    },
    {
        id: 'api-authentication-flow',
        title: 'API Authentication and Authorization Flow',
        content:
            'Detailed authentication and authorization implementation: 1. JWT token structure with user claims and permissions 2. Access token expiration (15 minutes) and refresh token (7 days) 3. Token refresh endpoint with rotation mechanism 4. Bearer token authentication in Authorization header 5. Role-based access control (RBAC) implementation 6. API key authentication for third-party applications 7. OAuth2 integration for social login 8. Rate limiting per user and IP address 9. Request signing for sensitive operations 10. Session management and logout functionality 11. Multi-factor authentication for API access 12. Webhook authentication with signature verification',
        category: 'api-documentation',
        tags: ['api', 'authentication', 'jwt', 'oauth'],
    },
    {
        id: 'api-webhooks',
        title: 'Webhook Integration and Real-time Events',
        content:
            'Webhook system for real-time event notifications: 1. Webhook registration and management endpoints 2. Event types: user.created, post.created, message.sent, etc. 3. Webhook payload structure with event data 4. Signature verification using HMAC-SHA256 5. Retry mechanism for failed webhook deliveries 6. Webhook status monitoring and health checks 7. Event filtering and subscription management 8. Rate limiting for webhook endpoints 9. Webhook testing and validation tools 10. Security considerations and best practices 11. Webhook logs and delivery analytics 12. Integration examples for common use cases',
        category: 'api-documentation',
        tags: ['api', 'webhooks', 'events', 'integration'],
    },
];
