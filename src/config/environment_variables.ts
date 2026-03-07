import * as dotenv from 'dotenv';

dotenv.config();

const requiredVars = {
    DATABASE_CONNECTION_STRING: process.env.DATABASE_CONNECTION_STRING,
    TOKEN_SECRET: process.env.TOKEN_SECRET,
    CLIENT_ORIGIN: process.env.CLIENT_ORIGIN,
    PORT: process.env.PORT ?? "5000",
} as const;

const missing = Object.entries(requiredVars)
    .filter(([key, value]) => key !== "PORT" && (typeof value !== "string" || value.length === 0))
    .map(([key]) => { return key; });

if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
}

const env_vars = {
    DATABASE_CONNECTION_STRING: requiredVars.DATABASE_CONNECTION_STRING as string,
    TOKEN_SECRET: requiredVars.TOKEN_SECRET as string,
    CLIENT_ORIGIN: requiredVars.CLIENT_ORIGIN as string,
    PORT: requiredVars.PORT,
};

export default env_vars;