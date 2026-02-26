import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Router } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../db/prisma';
import { requireAuth } from '../middleware/auth';

export const authRouter = Router();

const parseDurationMs = (value: string): number => {
  const match = value.trim().match(/^(\d+)(ms|s|m|h|d)?$/i);
  if (!match) {
    throw new Error('Invalid duration format');
  }
  const amount = Number(match[1]);
  const unit = (match[2] ?? 'ms').toLowerCase();
  const multiplier =
    unit === 'ms'
      ? 1
      : unit === 's'
        ? 1000
        : unit === 'm'
          ? 60_000
          : unit === 'h'
            ? 3_600_000
            : 86_400_000;
  return amount * multiplier;
};

const hashValue = (value: string) => crypto.createHash('sha256').update(value).digest('hex');

const generateOtp = (length: number) => {
  const max = 10 ** length;
  return crypto.randomInt(0, max).toString().padStart(length, '0');
};

const findUserByIdentity = async (email?: string, phone?: string) => {
  const filters: Array<{ email?: string; phone?: string }> = [];
  if (email) {
    filters.push({ email });
  }
  if (phone) {
    filters.push({ phone });
  }
  if (!filters.length) {
    return null;
  }
  return prisma.user.findFirst({
    where: {
      OR: filters,
    },
  });
};

const resolveChannel = (
  channel: string | undefined,
  user: { email: string | null; phone: string | null },
) => {
  if (channel) {
    if (channel === 'email' || channel === 'sms') {
      return channel;
    }
    return undefined;
  }
  if (user.email) {
    return 'email';
  }
  if (user.phone) {
    return 'sms';
  }
  return undefined;
};

const issueAccessToken = (user: { id: string; email: string | null; phone: string | null }) =>
  jwt.sign(
    {
      sub: user.id,
      email: user.email ?? undefined,
      phone: user.phone ?? undefined,
    },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'],
    },
  );

const issueRefreshToken = async (userId: string) => {
  const refreshToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashValue(refreshToken);
  const expiresAt = new Date(Date.now() + parseDurationMs(env.jwtRefreshExpiresIn));

  await prisma.refreshToken.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
    },
  });

  return {
    refreshToken,
    refreshExpiresAt: expiresAt.toISOString(),
  };
};

const createOtp = async (userId: string, channel: string, destination: string) => {
  const code = generateOtp(env.otpLength);
  const codeHash = hashValue(code);
  const expiresAt = new Date(Date.now() + env.otpExpiresMinutes * 60_000);

  await prisma.otpCode.create({
    data: {
      userId,
      channel: channel === 'sms' ? 'sms' : 'email',
      destination,
      codeHash,
      expiresAt,
    },
  });

  return { code, expiresAt };
};

authRouter.post('/register', async (req, res, next) => {
  try {
    const { email, phone, password } = req.body as {
      email?: string;
      phone?: string;
      password?: string;
    };

    if (!email && !phone) {
      return res.status(400).json({ message: 'Email or phone is required' });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const existing = await findUserByIdentity(email, phone);
    if (existing) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        passwordHash,
      },
    });

    return res.status(201).json({ id: user.id, email: user.email, phone: user.phone });
  } catch (error) {
    return next(error as Error);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, phone, password, channel } = req.body as {
      email?: string;
      phone?: string;
      password?: string;
      channel?: string;
    };

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const user = await findUserByIdentity(email, phone);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const resolvedChannel = resolveChannel(channel, user);
    if (!resolvedChannel) {
      return res.status(400).json({ message: 'OTP channel is required' });
    }

    const destination = resolvedChannel === 'sms' ? user.phone : user.email;
    if (!destination) {
      return res.status(400).json({ message: 'OTP destination not available' });
    }

    const { code, expiresAt } = await createOtp(user.id, resolvedChannel, destination);
    const response: Record<string, unknown> = {
      otpRequired: true,
      channel: resolvedChannel,
      destination,
      expiresAt,
    };
    if (env.nodeEnv !== 'production') {
      response.otp = code;
    }

    return res.status(200).json(response);
  } catch (error) {
    return next(error as Error);
  }
});

authRouter.post('/otp/request', async (req, res, next) => {
  try {
    const { email, phone, password, channel } = req.body as {
      email?: string;
      phone?: string;
      password?: string;
      channel?: string;
    };

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const user = await findUserByIdentity(email, phone);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const resolvedChannel = resolveChannel(channel, user);
    if (!resolvedChannel) {
      return res.status(400).json({ message: 'OTP channel is required' });
    }

    const destination = resolvedChannel === 'sms' ? user.phone : user.email;
    if (!destination) {
      return res.status(400).json({ message: 'OTP destination not available' });
    }

    const { code, expiresAt } = await createOtp(user.id, resolvedChannel, destination);
    const response: Record<string, unknown> = {
      otpRequired: true,
      channel: resolvedChannel,
      destination,
      expiresAt,
    };
    if (env.nodeEnv !== 'production') {
      response.otp = code;
    }

    return res.status(200).json(response);
  } catch (error) {
    return next(error as Error);
  }
});

authRouter.post('/otp/verify', async (req, res, next) => {
  try {
    const { email, phone, code, channel } = req.body as {
      email?: string;
      phone?: string;
      code?: string;
      channel?: string;
    };

    if (!code) {
      return res.status(400).json({ message: 'OTP code is required' });
    }

    const user = await findUserByIdentity(email, phone);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resolvedChannel = resolveChannel(channel, user);
    if (!resolvedChannel) {
      return res.status(400).json({ message: 'OTP channel is required' });
    }

    const destination = resolvedChannel === 'sms' ? user.phone : user.email;
    if (!destination) {
      return res.status(400).json({ message: 'OTP destination not available' });
    }

    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        userId: user.id,
        channel: resolvedChannel === 'sms' ? 'sms' : 'email',
        destination,
        consumedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!otpRecord || otpRecord.codeHash !== hashValue(code)) {
      return res.status(401).json({ message: 'Invalid or expired OTP' });
    }

    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { consumedAt: new Date() },
    });

    const accessToken = issueAccessToken(user);
    const { refreshToken, refreshExpiresAt } = await issueRefreshToken(user.id);

    return res.status(200).json({ accessToken, refreshToken, refreshExpiresAt });
  } catch (error) {
    return next(error as Error);
  }
});

authRouter.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    const tokenHash = hashValue(refreshToken);
    const stored = await prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });

    if (!stored) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const accessToken = issueAccessToken(stored.user);
    const { refreshToken: nextRefreshToken, refreshExpiresAt } = await issueRefreshToken(
      stored.userId,
    );

    return res.status(200).json({
      accessToken,
      refreshToken: nextRefreshToken,
      refreshExpiresAt,
    });
  } catch (error) {
    return next(error as Error);
  }
});

authRouter.post('/logout', async (req, res, next) => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    const tokenHash = hashValue(refreshToken);
    await prisma.refreshToken.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return res.status(204).send();
  } catch (error) {
    return next(error as Error);
  }
});

authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        createdAt: true,
      },
    });

    return res.status(200).json({ user });
  } catch (error) {
    return next(error as Error);
  }
});
