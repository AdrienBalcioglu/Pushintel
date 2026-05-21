process.env['DATABASE_URL'] = 'postgresql://pushintel:password@localhost:5432/pushintel'
process.env['REDIS_URL'] = 'redis://localhost:6379'
process.env['JWT_SECRET'] = 'test-secret-at-least-32-chars-long-for-vitest'
process.env['NODE_ENV'] = 'test'
