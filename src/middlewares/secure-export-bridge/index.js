const jwt = require('jsonwebtoken');

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    if (ctx.method === 'POST' && ctx.path === '/strapi-import-export/export/contentTypes') {
      try {
        const authHeader = ctx.request.headers?.authorization || ctx.headers?.authorization || '';
        const headerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
        const cookieToken = ctx.cookies?.get && ctx.cookies.get('jwtToken') ? ctx.cookies.get('jwtToken') : '';
        const token = headerToken || cookieToken;
        const hasAdminState = !!(ctx.state && ctx.state.user);
        if (!token && !hasAdminState) {
          return ctx.unauthorized('Missing Authorization header');
        }

        if (token) {
          const secret = process.env.ADMIN_JWT_SECRET;
          if (!secret) {
            strapi.log.warn('ADMIN_JWT_SECRET is not set; refusing export bridge');
            return ctx.unauthorized('Missing or invalid credentials');
          }
          // Verify admin JWT; throws if invalid/expired
          jwt.verify(token, secret);
        }

        // Auth OK: rewrite to content-api route
        // Also adapt body shape: admin route wraps payload under { data: {...} }
        // while content-api route expects fields at the root.
        if (ctx.request?.body && typeof ctx.request.body === 'object' && ctx.request.body.data) {
          ctx.request.body = ctx.request.body.data;
        }
        ctx.url = '/strapi-import-export/content/export/contentTypes';
        ctx.path = '/strapi-import-export/content/export/contentTypes';
      } catch (err) {
        return ctx.unauthorized('Missing or invalid credentials');
      }
    }

    await next();
  };
};
