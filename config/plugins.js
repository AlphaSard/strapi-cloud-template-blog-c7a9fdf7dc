module.exports = ({ env }) => ({
  'strapi-import-export': {
    config: {
      // Utilisé par le plugin pour construire les URL d'export
      serverPublicHostname: env('SERVER_PUBLIC_HOSTNAME', 'http://localhost:1337'),
    },
  },
});
