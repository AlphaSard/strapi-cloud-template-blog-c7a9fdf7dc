const jwt = require('jsonwebtoken');

module.exports = (config, { strapi }) => {
  const getAdminToken = (ctx) => {
    const authHeader = ctx.request.headers?.authorization || ctx.headers?.authorization || '';
    const headerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    const cookieToken = ctx.cookies?.get && ctx.cookies.get('jwtToken') ? ctx.cookies.get('jwtToken') : '';
    return headerToken || cookieToken || '';
  };

  const ensureAdminAuth = (ctx) => {
    const token = getAdminToken(ctx);
    const hasAdminState = !!(ctx.state && ctx.state.user);
    if (!token && !hasAdminState) {
      ctx.unauthorized('Missing Authorization header');
      return false;
    }
    if (token) {
      const secret = process.env.ADMIN_JWT_SECRET;
      if (!secret) {
        strapi.log.warn('ADMIN_JWT_SECRET is not set; refusing admin bridge');
        ctx.unauthorized('Missing or invalid credentials');
        return false;
      }
      try {
        const decoded = require('jsonwebtoken').verify(token, secret);
        ctx.state = ctx.state || {};
        ctx.state.adminJwt = decoded;
      } catch (e) {
        ctx.unauthorized('Missing or invalid credentials');
        return false;
      }
    }
    return true;
  };

  return async (ctx, next) => {
    // Admin EXPORT bridge
    if (ctx.method === 'POST' && ctx.path === '/strapi-import-export/export/contentTypes') {
      try {
        if (!ensureAdminAuth(ctx)) return;

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

    // Admin IMPORT model attributes bridge (GET)
    if (ctx.method === 'GET' && ctx.path.startsWith('/strapi-import-export/import/model-attributes/')) {
      try {
        if (!ensureAdminAuth(ctx)) return;
        const slug = decodeURIComponent(ctx.path.replace('/strapi-import-export/import/model-attributes/', ''));
        if (slug === 'custom:db') {
          // Whole DB: there is no single model. Return minimal attributes list for UI.
          const names = ['id'];
          ctx.body = { data: { attribute_names: names } };
          return;
        }
        const model = strapi.getModel(slug);
        if (!model || !model.attributes) {
          return ctx.notFound('Unknown model slug');
        }
        const names = Object.entries(model.attributes)
          .filter(([name, attr]) => !['relation','component','dynamiczone'].includes(attr.type))
          .map(([name]) => name);
        names.unshift('id');
        ctx.body = { data: { attribute_names: names } };
        return;
      } catch (e) {
        return ctx.internalServerError('Failed to get model attributes');
      }
    }

    // Admin IMPORT bridge (POST)
    if (ctx.method === 'POST' && ctx.path === '/strapi-import-export/import') {
      try {
        if (!ensureAdminAuth(ctx)) return;
        const payload = (ctx.request?.body && typeof ctx.request.body === 'object' && ctx.request.body.data)
          ? ctx.request.body.data
          : ctx.request.body || {};
        const { slug, data: dataRaw, format, idField } = payload || {};
        if (!slug || !format) return ctx.badRequest('Missing slug or format');
        const importService = strapi.plugin('strapi-import-export').service('import');
        const fileContent = await importService.parseInputData(format, dataRaw, { slug });
        let res;
        if (fileContent?.version === 2) {
          res = await importService.importDataV2(fileContent, { slug, user: ctx.state?.user, idField });
        } else {
          res = await importService.importData(dataRaw, { slug, format, user: ctx.state?.user, idField });
        }
        ctx.body = { failures: res.failures };
        return;
      } catch (e) {
        return ctx.internalServerError('Failed to import');
      }
    }

    await next();
  };
};
