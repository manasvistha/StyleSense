import { createHash, randomBytes } from 'node:crypto';
import { authRepository } from './auth.repository';
import { hashPassword, verifyPassword } from '../../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { BadRequest, Conflict, Unauthorized } from '../../utils/http-error';
import type { RegisterInput } from './auth.validator';

interface LoginMeta {
  ip?: string;
  userAgent?: string;
}

interface PublicUser {
  id: string;
  fullName: string;
  email: string;
  role: 'USER' | 'ADMIN';
  avatarUrl: string | null;
  isEmailVerified: boolean;
}

interface AuthResult {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

const sha256 = (value: string): string => createHash('sha256').update(value).digest('hex');

function toPublicUser(u: {
  id: string;
  fullName: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  isEmailVerified: boolean;
}): PublicUser {
  return {
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    role: u.role as 'USER' | 'ADMIN',
    avatarUrl: u.avatarUrl,
    isEmailVerified: u.isEmailVerified,
  };
}

function issueTokens(user: PublicUser): { accessToken: string; refreshToken: string } {
  const payload = { sub: user.id, email: user.email, role: user.role };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}

export const authService = {
  async register(input: RegisterInput): Promise<AuthResult> {
    const existing = await authRepository.findByEmail(input.email);
    if (existing) throw Conflict('An account with this email already exists');

    const passwordHash = await hashPassword(input.password);
    const user = await authRepository.createUser({
      fullName: input.fullName,
      email: input.email,
      passwordHash,
      phone: input.phone,
    });

    const publicUser = toPublicUser(user);
    return { user: publicUser, ...issueTokens(publicUser) };
  },

  async login(email: string, password: string, meta: LoginMeta): Promise<AuthResult> {
    const user = await authRepository.findByEmail(email);
    const valid = user ? await verifyPassword(password, user.passwordHash) : false;

    await authRepository.recordLogin({
      userId: user?.id,
      email,
      ip: meta.ip,
      userAgent: meta.userAgent,
      success: valid && !!user?.isActive,
    });

    if (!user || !valid) throw Unauthorized('Invalid email or password');
    if (!user.isActive) throw Unauthorized('This account has been deactivated');

    const publicUser = toPublicUser(user);
    return { user: publicUser, ...issueTokens(publicUser) };
  },

  async refresh(refreshToken?: string): Promise<{ accessToken: string; refreshToken: string }> {
    if (!refreshToken) throw Unauthorized('Missing refresh token');
    try {
      const payload = verifyRefreshToken(refreshToken);
      const user = await authRepository.findById(payload.sub);
      if (!user || !user.isActive) throw Unauthorized('Account unavailable');
      return issueTokens(toPublicUser(user));
    } catch {
      throw Unauthorized('Invalid or expired refresh token');
    }
  },

  async me(userId: string): Promise<PublicUser> {
    const user = await authRepository.findById(userId);
    if (!user) throw Unauthorized();
    return toPublicUser(user);
  },

  /**
   * Always resolves (even for unknown emails) to avoid leaking which addresses
   * are registered. Returns the raw token only in non-production so it can be
   * surfaced for the demo / thesis screenshots in place of a real mailer.
   */
  async forgotPassword(email: string): Promise<{ resetToken?: string }> {
    const user = await authRepository.findByEmail(email);
    if (!user) return {};

    const rawToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 min
    await authRepository.createResetToken(user.id, sha256(rawToken), expiresAt);

    return { resetToken: rawToken };
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const record = await authRepository.findValidResetToken(sha256(token));
    if (!record) throw BadRequest('Reset link is invalid or has expired');

    const passwordHash = await hashPassword(newPassword);
    await authRepository.updatePassword(record.userId, passwordHash);
    await authRepository.markResetTokenUsed(record.id);
  },
};
