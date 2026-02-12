import express from 'express';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';

import appointmentsRoutes from "./routes/appointmentsRoutes.js";
import clientsRoutes from "./routes/clientsRoutes.js";
import filesRoutes from "./routes/filesRoutes.js";
import notesRoutes from "./routes/notesRoutes.js";
import paymentsRoutes from "./routes/paymentsRoutes.js";
import remindersRoutes from "./routes/remindersRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { errorHandler, unknownEndpoint } from './middleware/error.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createApp = () => {
    const app = express();

    // Remember, middleware functions are called in the order that they're encountered

    // Trust first proxy (required for Render to properly handle HTTPS)
    // https://expressjs.com/en/guide/behind-proxies.html
    app.set("trust proxy", 1);

    // Middleware to parse JSON from request bodies.
    app.use(express.json());

    // Security middleware
    app.use(helmet());

    // Serve static files from the frontend build
    app.use(express.static(path.join(__dirname, '../frontend/dist')));

    app.use("/api/appointments", appointmentsRoutes);
    app.use("/api/clients", clientsRoutes);
    app.use("/api/files", filesRoutes);
    app.use("/api/notes", notesRoutes);
    app.use("/api/payments", paymentsRoutes);
    app.use("/api/reminders", remindersRoutes);
    app.use("/api/auth", authRoutes);

    // Serve index.html for all non-API routes (SPA support)
    app.get(/^(?!\/api).*/, (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
    });

    // Important that this is at the end so that it only handles requests that did not match previous routes
    app.use(unknownEndpoint);
    // Important that this is at the end so that it handles errors from all routes
    app.use(errorHandler);

    return app;
};

export default createApp;