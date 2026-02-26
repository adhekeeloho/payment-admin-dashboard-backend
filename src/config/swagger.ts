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
        summary: 'Verify password and request OTP',
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
                  channel: { type: 'string', enum: ['email', 'sms'] },
                },
                required: ['password'],
              },
            },
          },
        },
        responses: {
          200: { description: 'OTP requested' },
        },
      },
    },
    '/auth/otp/request': {
      post: {
        summary: 'Request a new OTP',
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
                  channel: { type: 'string', enum: ['email', 'sms'] },
                },
                required: ['password'],
              },
            },
          },
        },
        responses: {
          200: { description: 'OTP requested' },
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
                  channel: { type: 'string', enum: ['email', 'sms'] },
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
  },
};
