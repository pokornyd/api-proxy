"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_proxy_middleware_1 = require("http-proxy-middleware");
require("dotenv/config");
const body_parser_1 = __importDefault(require("body-parser"));
// const onProxyRes: OnProxyResCallback = (proxyRes, req, res) => {
//     let originalBody = new Buffer('');
//     proxyRes.on('data', (data: Buffer) => {
//       originalBody = Buffer.concat([originalBody, data]);
//     });
//     proxyRes.on('end', () => {
//       const body = originalBody.toString('utf8');
//       console.log('Response from Proxied Request:', body);
//       // Be careful not to modify the response here
//     });
//   };
const onDeliverProxyReq = (proxyReq, req, res) => {
    // Add body if there is a body in the incoming request
    if (req.body) {
        let bodyData = JSON.stringify(req.body);
        proxyReq.setHeader("Content-Type", "application/json");
        proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
    }
};
const onManageProxyReq = (proxyReq, req, res) => {
    var _a;
    // Add authorization header
    const bearerToken = (_a = req.query["api_key"]) !== null && _a !== void 0 ? _a : process.env.BEARER_TOKEN;
    if (bearerToken) {
        proxyReq.setHeader("Authorization", `Bearer ${bearerToken}`);
    }
    if (req.body) {
        let bodyData = JSON.stringify(req.body);
        proxyReq.setHeader("Content-Type", "application/json");
        proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
    }
};
const deliverProxyOptions = {
    target: "https://deliver.kontent.ai",
    changeOrigin: true,
    pathRewrite: { "^/api/deliver": "" },
    onProxyReq: onDeliverProxyReq,
};
const manageProxyOptions = {
    target: "https://manage.kontent.ai", // Target for /api/manage
    changeOrigin: true,
    pathRewrite: { "^/api/manage": "v2" },
    onProxyReq: onManageProxyReq,
};
// const logRequest = (
//   req: express.Request,
//   res: express.Response,
//   next: express.NextFunction
// ) => {
//   console.log("Received request:", {
//     method: req.method,
//     url: req.url,
//     body: req.body,
//     headers: req.headers,
//   });
//   next(); // Important to call next() to continue to the next middleware
// };
const app = (0, express_1.default)();
app.use(body_parser_1.default.json()); // for parsing application/json
app.use(body_parser_1.default.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
// app.use('/api/manage', logRequest); // Place this before the proxy middleware
app.use("/api/deliver", (0, http_proxy_middleware_1.createProxyMiddleware)(deliverProxyOptions));
app.use("/api/manage", (0, http_proxy_middleware_1.createProxyMiddleware)(manageProxyOptions));
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
