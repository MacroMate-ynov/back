import express, { Application } from 'express';
import { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import passport from "./middlewares/passport";

import { attachControllers } from '@decorators/express';
import { AuthController } from './controllers/authController';
import { errorHandler } from './middlewares/errorMiddleware';
import connectMongoDB from './middlewares/mongoDB';

// Swagger
import swaggerUi from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';

dotenv.config();

const app: Application = express();
const port = process.env.PORT || 8000;

// Middlewares
app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json()); // Remplace body-parser
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());

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
                    in: 'cookie',
                    description: 'Enter JWT token as jwt=<token> in the cookie.',
                },
            },
        },
        security: [{ bearerAuth: [] }],
        servers: [{ url: `http://localhost:${port}`, enableCors: false }],
    },
    apis: ['./src/controllers/*.ts'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Middleware Global
app.use(errorHandler);

// Attacher les contrôleurs
attachControllers(app, [AuthController]);

// Connexion à MongoDB
connectMongoDB();

// Démarrer le serveur
app.listen(port, () => {
    console.log(`🚀 Server is running on http://localhost:${port}`);
});
