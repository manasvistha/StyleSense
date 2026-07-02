import { prisma } from '../../config/prisma';
import type { Role } from '../../config/constants';

/** All persistence concerns for authentication live here (and only here). */
export const authRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  createUser(data: {
    fullName: string;
    email: string;
    passwordHash: string;
    phone?: string;
    role?: Role;
  }) {
    return prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        passwordHash: data.passwordHash,
        phone: data.phone,
        role: data.role ?? 'USER',
        // Provision empty profile shells so the user can fill them in later.
        preferences: { create: { budgetMin: 0, budgetMax: 100000 } },
      },
    });
  },

  updatePassword(userId: string, passwordHash: string) {
    return prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  },

  createResetToken(userId: string, tokenHash: string, expiresAt: Date) {
    return prisma.passwordResetToken.create({ data: { userId, tokenHash, expiresAt } });
  },

  findValidResetToken(tokenHash: string) {
    return prisma.passwordResetToken.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    });
  },

  markResetTokenUsed(id: string) {
    return prisma.passwordResetToken.update({ where: { id }, data: { usedAt: new Date() } });
  },

  recordLogin(data: {
    userId?: string;
    email: string;
    ip?: string;
    userAgent?: string;
    success: boolean;
  }) {
    return prisma.loginLog.create({ data });
  },
};
