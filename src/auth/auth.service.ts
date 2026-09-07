import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { DecodedIdToken } from 'firebase-admin/auth';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async syncUser(decodedToken: DecodedIdToken) {
    const { uid, email, name, picture } = decodedToken;

    return {
      message: 'User authenticated and synced successfully',
      user: {
        firebaseUid: uid,
        email: email || '',
        name: name || '',
        photoUrl: picture || '',
        role: 'CUSTOMER',
      },
    };
  }

  async login(credentials: { email?: string; password?: string }) {
    const { email, password } = credentials;
    if (!email || !password) {
      throw new UnauthorizedException('Email and password are required');
    }

    const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || 'agency.nextstation@gmail.com').toLowerCase();
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'Emran404@';

    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@nextstation26.asia').toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin2026@';

    const inputEmail = email.trim().toLowerCase();

    if (inputEmail === superAdminEmail && password === superAdminPassword) {
      return {
        message: 'Super Admin login successful',
        access_token: `jwt_superadmin_${Date.now()}`,
        user: {
          id: 'usr_super_admin_01',
          name: 'NextStation26 Super Admin',
          email: superAdminEmail,
          role: 'Super-Admin',
          avatar: '/logo.png',
          phone: '01895627138',
        },
      };
    }

    if (inputEmail === adminEmail && password === adminPassword) {
      return {
        message: 'Admin login successful',
        access_token: `jwt_admin_${Date.now()}`,
        user: {
          id: 'usr_admin_01',
          name: 'ArdhiMart Admin',
          email: adminEmail,
          role: 'Admin',
          avatar: '/logo.png',
          phone: '01895627138',
        },
      };
    }

    // Check database users (Customers & Admins)
    const dbUser = await this.prisma.users.findUnique({
      where: { email: inputEmail },
    });

    if (dbUser && dbUser.password) {
      const isMatch = await bcrypt.compare(password, dbUser.password);
      if (isMatch) {
        return {
          message: 'Login successful',
          access_token: `jwt_user_${dbUser.id}_${Date.now()}`,
          user: {
            id: dbUser.id,
            name: dbUser.name || 'Customer',
            email: dbUser.email,
            role: dbUser.role || 'CUSTOMER',
            avatar: dbUser.photoUrl || '/logo.png',
          },
        };
      }
    }

    throw new UnauthorizedException('Invalid email address or password');
  }

  /**
   * Request Password Reset OTP
   * Validity: 5 Minutes
   * Resend Rule: Re-sends the same OTP if within 5 minutes.
   */
  async forgotPassword(email: string) {
    if (!email || !email.trim()) {
      throw new BadRequestException('Email address is required');
    }

    const cleanEmail = email.trim().toLowerCase();

    let user = await this.prisma.users.findUnique({
      where: { email: cleanEmail },
    });

    // If user not in users table, check customers or admin
    if (!user) {
      const customer = await (this.prisma as any).customers.findFirst({
        where: { email: cleanEmail },
      });

      const adminEmail = (process.env.ADMIN_EMAIL || 'admin@nextstation26.asia').toLowerCase();
      const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || 'agency.nextstation@gmail.com').toLowerCase();

      if (customer) {
        user = await this.prisma.users.create({
          data: {
            email: cleanEmail,
            name: customer.name,
            role: 'CUSTOMER',
          },
        });
      } else if (cleanEmail === adminEmail || cleanEmail === superAdminEmail) {
        user = await this.prisma.users.create({
          data: {
            email: cleanEmail,
            name: cleanEmail === superAdminEmail ? 'Super Admin' : 'Admin',
            role: cleanEmail === superAdminEmail ? 'SUPER_ADMIN' : 'CLIENT_ADMIN',
          },
        });
      } else {
        throw new NotFoundException('No account found with this email address');
      }
    }

    const now = new Date();
    let otp: string;
    let remainingSeconds = 300;

    // PERSISTENCE RULE: If OTP already exists and hasn't expired (within 5 mins), RESEND SAME OTP!
    if (user.resetOtp && user.resetOtpExpiresAt && user.resetOtpExpiresAt > now) {
      otp = user.resetOtp;
      remainingSeconds = Math.max(10, Math.floor((user.resetOtpExpiresAt.getTime() - now.getTime()) / 1000));
    } else {
      // Generate fresh 6-digit OTP
      otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
      await this.prisma.users.update({
        where: { id: user.id },
        data: {
          resetOtp: otp,
          resetOtpExpiresAt: expiresAt,
        },
      });
      remainingSeconds = 300;
    }

    // Send email notification
    await this.mailService.sendPasswordResetOtp(cleanEmail, otp, remainingSeconds);

    return {
      success: true,
      message: 'Password reset OTP sent to your email. Code is valid for 5 minutes.',
      expiresInSeconds: remainingSeconds,
    };
  }

  /**
   * Reset Password with OTP Verification
   */
  async resetPassword(dto: { email: string; otp: string; newPassword: string }) {
    const { email, otp, newPassword } = dto;
    if (!email || !otp || !newPassword) {
      throw new BadRequestException('Email, OTP code, and new password are required');
    }

    if (newPassword.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters long');
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    const user = await this.prisma.users.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      throw new NotFoundException('Account not found');
    }

    if (!user.resetOtp || !user.resetOtpExpiresAt) {
      throw new BadRequestException('No active OTP found. Please request a new OTP.');
    }

    const now = new Date();
    if (user.resetOtpExpiresAt < now) {
      throw new BadRequestException('OTP has expired (5-minute limit). Please request a new OTP.');
    }

    if (user.resetOtp !== cleanOtp) {
      throw new BadRequestException('Invalid OTP code. Please check your email and enter the correct code.');
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear OTP
    await this.prisma.users.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetOtp: null,
        resetOtpExpiresAt: null,
      },
    });

    return {
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.',
    };
  }
}
