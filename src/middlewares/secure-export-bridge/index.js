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

        // Auth OK: directly invoke plugin export service and return
        const payload = (ctx.request?.body && typeof ctx.request.body === 'object' && ctx.request.body.data)
          ? ctx.request.body.data
          : ctx.request.body || {};

        const {
          slug,
          search = '',
          applySearch = false,
          exportFormat = 'json',
          relationsAsId = false,
          deepness = 5,
          exportPluginsContentTypes = false,
        } = payload || {};

        if (!slug) {
          return ctx.badRequest('Missing slug');
        }

        const exportService = strapi.plugin('strapi-import-export').service('export');
        let data;
        if (exportFormat === exportService.formats.JSON_V2) {
          data = await exportService.exportDataV2({ slug, search, applySearch, deepness, exportPluginsContentTypes });
        } else {
          data = await exportService.exportData({ slug, search, applySearch, exportFormat, relationsAsId, deepness });
        }
        ctx.body = { data };
        return; // stop pipeline
      } catch (err) {
        return ctx.unauthorized('Missing or invalid credentials');
      }
    }

    await next();
  };
};
