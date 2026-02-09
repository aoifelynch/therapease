import express from 'express';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';

import appointmentsRouter from "./controllers/appointmentsController.js";
import clientsRouter from "./controllers/clientsController.js";
import filesRouter from "./controllers/filesController.js";
import notesRouter from "./controllers/notesController.js";
import paymentsRouter from "./controllers/paymentsController.js";
import remindersRouter from "./controllers/remindersController.js";
import authRouter from "./controllers/authController.js";
import { sessionMiddleware } from './middleware/auth.js';
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

    // Session middleware
    app.use(sessionMiddleware());

    app.use("/api/appointments", appointmentsRouter);
    app.use("/api/clients", clientsRouter);
    app.use("/api/files", filesRouter);
    app.use("/api/notes", notesRouter);
    app.use("/api/payments", paymentsRouter);
    app.use("/api/reminders", remindersRouter);
    app.use("/api/auth", authRouter);

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