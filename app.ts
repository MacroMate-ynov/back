import express, {Application, Request, Response} from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import {Server} from 'socket.io';
import {attachControllers} from '@decorators/express';
// Middleware & Configuration
import passport from './middlewares/passport';
import {errorHandler} from './middlewares/errorMiddleware';
import connectMongoDB from './middlewares/mongoDB';

// Controllers
import {AuthController} from './controllers/authController';
import {FoodController} from './controllers/foodController';
import {RepasController} from './controllers/repasController';
import {ChatController} from './controllers/chatController';

// Sockets
import chatSocket from './sockets/chatSocket';

// Swagger Docs
import swaggerUi from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';

// Environment Variables
import {environment} from './env/environment';
import * as http from "http";

const fs = require('fs');
const https = require('https')

const ca = fs.readFileSync('macromate-ynov_me.ca-bundle');
const cert = fs.readFileSync('macromate-ynov_me.crt');
const key = environment.CRT_KEY ?? fs.readFileSync('macroMate.key');

// Initialisation de dotenv
dotenv.config();

const app: Application = express();

 
// Middleware de sécurité, logs, et gestion des cookies
app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
 
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Configuration de morgan pour les logs
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

const apiDir = environment.production ? './dist/controllers/*.ts' : './controllers/*.ts'


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
                url: 'https://www.macromate-ynov.me',
                description: 'Production server',
            },
            {
                url: 'http://localhost:8000',
                description: 'Local server',
            },
        ],
 
    },
    apis: [apiDir],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

 
 
app.use(
    session({
        secret: environment.SESSION_SECRET || 'supersecret',
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false }, // ⚠️ Mets `true` en production avec HTTPS
    })
);

// Initialisation de Passport
app.use(passport.initialize());
app.use(passport.session());

 
app.use(errorHandler);

// Attacher les contrôleurs (routeurs)
attachControllers(app, [AuthController, FoodController, RepasController, ChatController]);

// Connexion à MongoDB
connectMongoDB();

const httpsOptions = {
    cert: cert,
    ca: ca,
    key: key,
    passphrase: 'mapass'
}

let server;

if (environment.production) {
    server = https.createServer(httpsOptions, app);

} else {
    server = http.createServer(app);
}
const io = new Server(server, {
    cors: {
        origin: '*',
    },
});

app.set('io', io);

// Initialisation des sockets
chatSocket(io);

// Démarrer le serveur

server.listen(environment.PORT,'0.0.0.0', () => {
    console.log(`🚀 Server is running on ${environment.baseUrl}`);
});

if (environment.production) {
    app.use((req, res, next) => {
        if(req.protocol === 'http') {
            res.redirect(301, `https://${req.headers.host}${req.url}`);
        }
        next();
    });
}


export default app;
module.exports = server;