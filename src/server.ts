import express, { request, response } from "express";
import { createProxyMiddleware, Options } from "http-proxy-middleware";
import "dotenv/config";
import {
  OnProxyReqCallback,
  OnProxyResCallback,
} from "http-proxy-middleware/dist/types";
import bodyParser from "body-parser";

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

const onDeliverProxyReq: OnProxyReqCallback = (proxyReq, req, res) => {
  // Add body if there is a body in the incoming request
  if (req.body) {
    let bodyData = JSON.stringify(req.body);
    proxyReq.setHeader("Content-Type", "application/json");
    proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
    proxyReq.write(bodyData);
  }
};

const onManageProxyReq: OnProxyReqCallback = (proxyReq, req, res) => {
  // Add authorization header
  const bearerToken = process.env.BEARER_TOKEN;
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

const deliverProxyOptions: Options = {
  target: "https://deliver.kontent.ai",
  changeOrigin: true,
  pathRewrite: { "^/api/deliver": "" },
  onProxyReq: onDeliverProxyReq,
};

const manageProxyOptions: Options = {
  target: "https://manage.kontent.ai", // Target for /api/manage
  changeOrigin: true,
  pathRewrite: { "^/api/manage": "v2" },
  onProxyReq: onManageProxyReq,
};

const app = express();

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.use("/api/deliver", createProxyMiddleware(deliverProxyOptions));
app.use("/api/manage", createProxyMiddleware(manageProxyOptions));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
