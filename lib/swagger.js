// OpenAPI spec defined statically - served at /api/openapi (no auth required, A05)
const spec = {
  openapi: '3.0.0',
  info: {
    title: 'NexusStore API',
    version: '1.0.0',
    description:
      'NexusStore e-commerce REST API. Default admin credentials: admin / admin.',
  },
  servers: [{ url: '/api', description: 'NexusStore API' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          username: { type: 'string' },
          email: { type: 'string' },
          password: { type: 'string', description: 'MD5 hash (no salt)' },
          role: { type: 'string', enum: ['user', 'admin'] },
          credit_card: { type: 'string', description: 'Stored in plaintext' },
          address: { type: 'string' },
        },
      },
      Product: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          description: { type: 'string' },
          price: { type: 'number' },
          stock: { type: 'integer' },
          image_url: { type: 'string' },
          category: { type: 'string' },
        },
      },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          user_id: { type: 'integer' },
          total: { type: 'number' },
          status: { type: 'string' },
          credit_card: { type: 'string', description: 'Stored in plaintext' },
          shipping_address: { type: 'string' },
          coupon_code: { type: 'string' },
        },
      },
    },
  },
  paths: {
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login (SQL injection on username field)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  username: { type: 'string', example: "admin' OR '1'='1'--" },
                  password: { type: 'string', example: 'admin' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Returns JWT token and full user object (including password hash)' },
          401: { description: 'User not found / Incorrect password (username enumeration)' },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register new user (no password complexity enforced)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  username: { type: 'string', example: 'newuser' },
                  email: { type: 'string', example: 'user@example.com' },
                  password: { type: 'string', example: 'a' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'User created' } },
      },
    },
    '/auth/reset': {
      post: {
        tags: ['Auth'],
        summary: 'Password reset (token = MD5(email) — fully predictable)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', example: 'alice@example.com' },
                  token: { type: 'string', description: 'MD5(email) — omit to receive token in response' },
                  new_password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Token returned or password reset' } },
      },
    },
    '/products': {
      get: {
        tags: ['Products'],
        summary: 'List products (q param vulnerable to SQL injection)',
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string', example: "' OR 1=1--" } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Array of products' } },
      },
    },
    '/products/{id}': {
      get: {
        tags: ['Products'],
        summary: 'Get product by ID (id param vulnerable to SQL injection)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', example: "1 UNION SELECT table_name,2,3,4,5,6,7 FROM information_schema.tables--" } }],
        responses: { 200: { description: 'Product with reviews' } },
      },
    },
    '/reviews': {
      post: {
        tags: ['Products'],
        summary: 'Submit review (body not sanitized — stored XSS)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  product_id: { type: 'integer', example: 1 },
                  rating: { type: 'integer', example: 5 },
                  body: { type: 'string', example: '<script>alert(document.cookie)</script>' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Review created' } },
      },
    },
    '/cart/{userId}': {
      get: {
        tags: ['Cart'],
        summary: 'Get cart (IDOR — no ownership check)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: "Any user's cart" } },
      },
      put: {
        tags: ['Cart'],
        summary: 'Update cart (IDOR + negative quantity exploit)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  product_id: { type: 'integer', example: 1 },
                  quantity: { type: 'integer', example: -100 },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Cart updated' } },
      },
    },
    '/orders/{id}': {
      get: {
        tags: ['Orders'],
        summary: 'Get order (IDOR — exposes plaintext credit card)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: {
            description: 'Order including credit_card in plaintext',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Order' } } },
          },
        },
      },
    },
    '/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Get user (IDOR — returns MD5 password hash + plaintext credit card)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: {
            description: 'Full user row',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } },
          },
        },
      },
      put: {
        tags: ['Users'],
        summary: 'Update user profile (IDOR)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  address: { type: 'string' },
                  credit_card: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Profile updated' } },
      },
    },
    '/admin/import-image': {
      post: {
        tags: ['Admin'],
        summary: 'Import product image from URL (SSRF)',
        description: 'Fetches any URL server-side. Try: http://169.254.169.254/latest/meta-data/ or http://localhost/admin',
        parameters: [
          {
            name: 'url',
            in: 'query',
            required: true,
            schema: { type: 'string', example: 'http://169.254.169.254/latest/meta-data/' },
          },
        ],
        responses: { 200: { description: 'Response content from fetched URL' } },
      },
    },
    '/admin/plugins': {
      post: {
        tags: ['Admin'],
        summary: 'Install plugin (RCE via eval + prototype pollution via lodash.merge)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  plugin_url: { type: 'string', description: 'URL of JavaScript to fetch and eval()' },
                  settings: {
                    type: 'string',
                    description: 'JSON merged with _.merge — try {"__proto__":{"isAdmin":true}}',
                    example: '{"__proto__":{"isAdmin":true}}',
                  },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Plugin installed' } },
      },
    },
    '/webhooks': {
      get: {
        tags: ['Webhooks'],
        summary: 'List webhooks',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'List of registered webhooks' } },
      },
      post: {
        tags: ['Webhooks'],
        summary: 'Register webhook (SSRF — server fetches URL on every order)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  url: { type: 'string', example: 'http://169.254.169.254/latest/meta-data/' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Webhook registered and immediately triggered' } },
      },
    },
    '/uploads': {
      get: {
        tags: ['Admin'],
        summary: 'Directory listing of /uploads (no auth required)',
        responses: { 200: { description: 'List of files in uploads directory' } },
      },
    },
    '/debug/info': {
      get: {
        tags: ['Admin'],
        summary: 'Debug info — exposes DATABASE_URL, JWT_SECRET, env vars',
        responses: { 200: { description: 'System configuration and environment variables' } },
      },
    },
    '/reset': {
      post: {
        tags: ['Admin'],
        summary: 'Reset database to seed state',
        parameters: [{ name: 'key', in: 'query', required: true, schema: { type: 'string', example: 'resetme123' } }],
        responses: { 200: { description: 'Database reset' } },
      },
    },
  },
}

module.exports = spec
