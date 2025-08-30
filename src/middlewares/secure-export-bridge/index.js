const jwt = require('jsonwebtoken');

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    if (ctx.method === 'POST' && ctx.path === '/strapi-import-export/export/contentTypes') {
      try {
        const authHeader = ctx.get('authorization') || ctx.get('Authorization') || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
        if (!token) {
          return ctx.unauthorized('Missing Authorization header');
        }

        const secret = process.env.ADMIN_JWT_SECRET;
        if (!secret) {
          strapi.log.warn('ADMIN_JWT_SECRET is not set; refusing export bridge');
          return ctx.unauthorized('Missing or invalid credentials');
        }

        // Verify admin JWT; throws if invalid/expired
        jwt.verify(token, secret);

        // Auth OK: rewrite to content-api route
        ctx.url = '/strapi-import-export/content/export/contentTypes';
        ctx.path = '/strapi-import-export/content/export/contentTypes';
      } catch (err) {
        return ctx.unauthorized('Missing or invalid credentials');
      }
    }

    await next();
  };
};

