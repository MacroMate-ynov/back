import express, { Application, NextFunction } from 'express';
import { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import passport from "./middlewares/passport";
import session from "express-session";

import { attachControllers } from '@decorators/express';
import { AuthController } from './controllers/authController';
import { errorHandler } from './middlewares/errorMiddleware';
import connectMongoDB from './middlewares/mongoDB';

// Swagger
import swaggerUi from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';
import {FoodController} from "./controllers/foodController";
import {RepasController} from "./controllers/repasController";
import { environment } from './env/environment';

dotenv.config();

const app: Application = express();

// Middlewares
app.use(helmet());
app.use(cors({ origin: environment.baseUrl, credentials: true }));
app.use(express.json()); // Remplace body-parser
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logger Morgan avec couleurs
morgan.token('colored-status', (req, res) => {
    const status = res.statusCode;
    if (status >= 500) return `\x1b[31m${status}\x1b[0m`; // Rouge
    if (status >= 400) return `\x1b[33m${status}\x1b[0m`; // Jaune
    if (status >= 300) return `\x1b[36m${status}\x1b[0m`; // Cyan
    return `\x1b[32m${status}\x1b[0m`; // Vert
});

app.use(
    morgan((tokens, req, res) => {
        return `${tokens.method(req, res)} ${tokens.url(req, res)} ${tokens['colored-status'](req, res)} - ${tokens['response-time'](req, res)} ms`;
    })
);

// Route de base
app.get('/', (req: Request, res: Response) => { res.send('Welcome') });

// Swagger Configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'My API',
            version: '1.0.0',
            description: 'API documentation',
        },
        components: {
            securitySchemes: {
                jwt: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter JWT token in the Authorization header as Bearer <token>.',
                },
            },
        },
        security: [{ jwt: [] }], // Correspond bien au schéma défini ci-dessus
        servers: [
            {
                url: environment.baseUrl || 'http://localhost:8000', // Assure que baseUrl est défini
                description: 'Development server',
            },
        ],
    },
    apis: ['./controllers/*.ts'],
};



app.use(
    session({
        secret: environment.SESSION_SECRET || "supersecret",
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false }, // ⚠️ Mets `true` en production avec HTTPS
    })
);

app.use(passport.initialize());
app.use(passport.session());


const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Middleware Global
app.use(errorHandler);

// Attacher les contrôleurs
attachControllers(app, [AuthController, FoodController, RepasController]);

// Connexion à MongoDB
connectMongoDB();

// Démarrer le serveur
app.listen(8000,"0.0.0.0", () => {
    console.log(`🚀 Server is running on ${environment.baseUrl}`);
});

export default app;