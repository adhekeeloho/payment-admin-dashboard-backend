import dotenv from 'dotenv';

dotenv.config();

const getEnv = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback;
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: getEnv('DATABASE_URL'),
  jwtSecret: getEnv('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  otpExpiresMinutes: Number(process.env.OTP_EXPIRES_MINUTES ?? 10),
  otpLength: Number(process.env.OTP_LENGTH ?? 6),
  defaultAdminUser: process.env.DEFAULT_ADMIN_USER ?? 'admin',
  defaultAdminPassword: process.env.DEFAULT_ADMIN_PASSWORD ?? 'admin',
};
