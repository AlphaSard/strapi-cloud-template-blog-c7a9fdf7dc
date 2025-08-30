module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    if (
      ctx.method === 'POST' &&
      ctx.path === '/strapi-import-export/content/export/contentTypes'
    ) {
      if (process.env.NODE_ENV === 'production') {
        return ctx.forbidden('Export via content-api is disabled in production');
      }
    }
    await next();
  };
};
