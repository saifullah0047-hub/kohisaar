import { createApp } from "./app.js";

// Vercel invokes the Express app per request. Local development continues to use main.ts.
export default createApp();

// Let Express receive the raw webhook body before its route-specific parser runs.
export const config = {
  api: {
    bodyParser: false,
  },
};
