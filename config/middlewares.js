// config/middlewares.js
module.exports = [
	"strapi::errors",
	{ resolve: './src/middlewares/secure-export-bridge' },
	{
		name: "strapi::cors",
		config: {
			origin: [
				"https://<ton-site>.vercel.app", // prod
				"https://<ton-site>-git-*.vercel.app", // previews (pattern)
				"http://localhost:3000", // dev front
			],
			methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
			headers: ["Content-Type", "Authorization", "Origin", "Accept"],
			keepHeaderOnError: true,
			credentials: true,
		},
	},
	"strapi::security",
	"strapi::logger",
	"strapi::query",
	"strapi::body",
	"strapi::session",
	"strapi::favicon",
	"strapi::public",
];
