export default [
	"strapi::errors",
	{
		name: "strapi::cors",
		config: { origin: ["https://<ton-site>.vercel.app"] },
	},
	"strapi::poweredBy",
	"strapi::logger",
	"strapi::query",
	"strapi::body",
	"strapi::session",
	"strapi::favicon",
	"strapi::public",
];
