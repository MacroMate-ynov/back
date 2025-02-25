export const environment = {
    production: false,
    baseUrl: process.env.BASE_URL ||  "http://localhost:8000/",
    PORT: process.env.PORT ||  8000,
    MONGODB_URL: process.env.MONGODB_URL ||  "mongodb://localhost:27017/MacroMate",
    JWT_SECRET: process.env.JWT_SECRET ||  "secret123",
    Node_ENV: process.env.NODE_ENV ||  "development",
    googleClientID: process.env.GOOGLE_CLIENT_ID ||  "865906994045-50617hi1ebaqh2khsqiho0oegkenhm19.apps.googleusercontent.com",
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ||  "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",
    SESSION_SECRET: process.env.SESSION_SECRET ||  "supersecret123",
};