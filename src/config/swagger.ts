export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Payment Admin API',
    version: '0.1.0',
  },
  servers: [{ url: '/api' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        responses: {
          200: { description: 'OK' },
        },
      },
    },
    '/auth/register': {
      post: {
        summary: 'Register a user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  phone: { type: 'string' },
                  password: { type: 'string' },
                },
                required: ['password'],
              },
            },
          },
        },
        responses: {
          201: { description: 'User created' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Login and receive tokens directly',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  phone: { type: 'string' },
                  password: { type: 'string' },
                },
                required: ['password'],
              },
            },
          },
        },
        responses: {
          200: { description: 'Returns accessToken, refreshToken' },
        },
      },
    },
    '/auth/otp/request': {
      post: {
        summary: 'Resend OTP to email',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  phone: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'OTP sent' },
        },
      },
    },
    '/auth/otp/verify': {
      post: {
        summary: 'Verify OTP and issue tokens',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  phone: { type: 'string' },
                  code: { type: 'string' },
                  requestId: { type: 'string', description: 'Returned from /register or /otp/request' },
                },
                required: ['code'],
              },
            },
          },
        },
        responses: {
          200: { description: 'Tokens issued' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        summary: 'Refresh access token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  refreshToken: { type: 'string' },
                },
                required: ['refreshToken'],
              },
            },
          },
        },
        responses: {
          200: { description: 'Tokens refreshed' },
        },
      },
    },
    '/auth/logout': {
      post: {
        summary: 'Revoke a refresh token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  refreshToken: { type: 'string' },
                },
                required: ['refreshToken'],
              },
            },
          },
        },
        responses: {
          204: { description: 'Logged out' },
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Get current user',
        responses: {
          200: { description: 'Current user' },
        },
      },
    },
    '/dashboard/metrics': {
      get: {
        summary: 'Get dashboard metrics',
        responses: {
          200: { description: 'Dashboard metrics' },
        },
      },
    },
    '/dashboard/revenue': {
      get: {
        summary: 'Get revenue time series',
        parameters: [
          { in: 'query', name: 'startDate', schema: { type: 'string', format: 'date-time' } },
          { in: 'query', name: 'endDate', schema: { type: 'string', format: 'date-time' } },
        ],
        responses: {
          200: { description: 'Revenue series' },
        },
      },
    },
    '/dashboard/graph': {
      get: {
        summary: 'Get revenue graph series',
        parameters: [
          { in: 'query', name: 'startDate', schema: { type: 'string', format: 'date-time' } },
          { in: 'query', name: 'endDate', schema: { type: 'string', format: 'date-time' } },
        ],
        responses: {
          200: { description: 'Revenue series' },
        },
      },
    },
    '/dashboard/transactions': {
      get: {
        summary: 'List transactions',
        parameters: [
          { in: 'query', name: 'status', schema: { type: 'string', enum: ['pending', 'completed', 'failed'] } },
          { in: 'query', name: 'startDate', schema: { type: 'string', format: 'date-time' } },
          { in: 'query', name: 'endDate', schema: { type: 'string', format: 'date-time' } },
          { in: 'query', name: 'page', schema: { type: 'integer' } },
          { in: 'query', name: 'pageSize', schema: { type: 'integer' } },
        ],
        responses: {
          200: { description: 'Transactions list' },
        },
      },
    },
    '/customers': {
      get: {
        summary: 'List customers',
        parameters: [
          { in: 'query', name: 'search', schema: { type: 'string' } },
          { in: 'query', name: 'page', schema: { type: 'integer' } },
          { in: 'query', name: 'pageSize', schema: { type: 'integer' } },
        ],
        responses: { 200: { description: 'Customers list' } },
      },
    },
    '/customers/{id}': {
      get: {
        summary: 'Get customer by ID',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Customer details' }, 404: { description: 'Not found' } },
      },
    },
    '/customers/{id}/health': {
      get: {
        summary: 'Get customer health stats',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Customer health metrics' }, 404: { description: 'Not found' } },
      },
    },
    '/analytics/segments': {
      get: {
        summary: 'Get customer segments',
        responses: { 200: { description: 'Customer segments breakdown' } },
      },
    },
    '/payouts': {
      get: {
        summary: 'List payouts',
        parameters: [
          { in: 'query', name: 'status', schema: { type: 'string', enum: ['pending', 'paid', 'failed'] } },
          { in: 'query', name: 'page', schema: { type: 'integer' } },
          { in: 'query', name: 'pageSize', schema: { type: 'integer' } },
        ],
        responses: { 200: { description: 'Payouts list' } },
      },
      post: {
        summary: 'Create a payout',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  amount: { type: 'number' },
                  scheduledAt: { type: 'string', format: 'date-time' },
                  customerId: { type: 'string' },
                },
                required: ['amount', 'scheduledAt'],
              },
            },
          },
        },
        responses: { 201: { description: 'Payout created' } },
      },
    },
    '/payouts/schedule': {
      get: {
        summary: 'Get upcoming payout schedule',
        responses: { 200: { description: 'Upcoming payouts' } },
      },
    },
    '/support/threads': {
      get: {
        summary: 'List support threads',
        parameters: [
          { in: 'query', name: 'status', schema: { type: 'string', enum: ['open', 'closed'] } },
          { in: 'query', name: 'page', schema: { type: 'integer' } },
          { in: 'query', name: 'pageSize', schema: { type: 'integer' } },
        ],
        responses: { 200: { description: 'Support threads list' } },
      },
    },
    '/support/threads/{id}': {
      get: {
        summary: 'Get support thread by ID',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Thread with messages' }, 404: { description: 'Not found' } },
      },
    },
    '/support/threads/{id}/messages': {
      post: {
        summary: 'Add message to support thread',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  content: { type: 'string' },
                  senderType: { type: 'string', enum: ['admin', 'customer'] },
                },
                required: ['content', 'senderType'],
              },
            },
          },
        },
        responses: { 201: { description: 'Message created' }, 404: { description: 'Thread not found' } },
      },
    },
    '/settings': {
      get: {
        summary: 'Get settings',
        responses: { 200: { description: 'Settings key-value map' } },
      },
      patch: {
        summary: 'Update settings',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                additionalProperties: { type: 'string' },
                example: { currency: 'USD', timezone: 'UTC' },
              },
            },
          },
        },
        responses: { 200: { description: 'Updated settings' } },
      },
    },
    '/approvals': {
      get: {
        summary: 'List approvals',
        parameters: [
          { in: 'query', name: 'status', schema: { type: 'string', enum: ['pending', 'approved', 'rejected'] } },
          { in: 'query', name: 'page', schema: { type: 'integer' } },
          { in: 'query', name: 'pageSize', schema: { type: 'integer' } },
        ],
        responses: { 200: { description: 'Approvals list' } },
      },
    },
    '/approvals/{id}/approve': {
      post: {
        summary: 'Approve a pending approval',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Approved' }, 404: { description: 'Not found' } },
      },
    },
    '/approvals/{id}/reject': {
      post: {
        summary: 'Reject a pending approval',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Rejected' }, 404: { description: 'Not found' } },
      },
    },
    '/approvals/audit-log': {
      get: {
        summary: 'Get audit log',
        parameters: [
          { in: 'query', name: 'page', schema: { type: 'integer' } },
          { in: 'query', name: 'pageSize', schema: { type: 'integer' } },
        ],
        responses: { 200: { description: 'Audit log entries' } },
      },
    },
    '/pricing/plans': {
      get: {
        summary: 'List pricing plans',
        responses: { 200: { description: 'Pricing plans' } },
      },
      post: {
        summary: 'Create a pricing plan',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  price: { type: 'number' },
                  currency: { type: 'string' },
                  interval: { type: 'string', enum: ['month', 'year'] },
                  features: { type: 'array', items: { type: 'string' } },
                  isActive: { type: 'boolean' },
                },
                required: ['name', 'price'],
              },
            },
          },
        },
        responses: { 201: { description: 'Plan created' } },
      },
    },
    '/pricing/plans/{id}': {
      get: {
        summary: 'Get pricing plan by ID',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Plan details' }, 404: { description: 'Not found' } },
      },
      patch: {
        summary: 'Update a pricing plan',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object' } } },
        },
        responses: { 200: { description: 'Updated plan' }, 404: { description: 'Not found' } },
      },
      delete: {
        summary: 'Delete a pricing plan',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { 204: { description: 'Deleted' }, 404: { description: 'Not found' } },
      },
    },
  },
};
