import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  /**
   * Removes sensitive fields from a user record before returning it.
   */
  private sanitizeUser(user: {
    password: string;
    resetOtpHash: string | null;
    [key: string]: unknown;
  }) {
    const { password, resetOtpHash, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Hashes a plain-text password for storage.
   */
  private async hashPassword(password: string) {
    return bcrypt.hash(password, 10);
  }

  /**
   * Creates a new user after checking for duplicate email addresses.
   */
  async create(data: CreateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const normalizedName = data.name?.trim() || data.email.split('@')[0];

    const createdUser = await this.prisma.user.create({
      data: {
        ...data,
        name: normalizedName,
        password: await this.hashPassword(data.password),
      },
    });

    return this.sanitizeUser(createdUser);
  }

  /**
   * Returns all users without sensitive fields.
   */
  async findAll() {
    const users = await this.prisma.user.findMany();
    return users.map((user) => this.sanitizeUser(user));
  }

  /**
   * Finds a user by id and removes sensitive fields.
   */
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? this.sanitizeUser(user) : null;
  }

  /**
   * Finds a user by email and keeps the password for auth checks.
   */
  async findByEmailWithPassword(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  /**
   * Finds a user by email and removes sensitive fields.
   */
  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return user ? this.sanitizeUser(user) : null;
  }

  /**
   * Updates a user after validating body content and email uniqueness.
   */
  async update(id: string, data: UpdateUserDto) {
    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Request body cannot be empty');
    }

    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (data.email && data.email !== user.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        ...data,
        password: data.password
          ? await this.hashPassword(data.password)
          : undefined,
      },
    });

    return this.sanitizeUser(updatedUser);
  }

  /**
   * Updates only the password for a user.
   */
  async updatePassword(id: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { password: await this.hashPassword(password) },
    });

    return this.sanitizeUser(updatedUser);
  }

  /**
   * Stores the hashed OTP and its expiry time for password reset.
   */
  async setResetOtp(
    userId: string,
    resetOtpHash: string,
    resetOtpExpiresAt: Date,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        resetOtpHash,
        resetOtpExpiresAt,
      },
    });

    return this.sanitizeUser(updatedUser);
  }

  /**
   * Clears the stored OTP after a reset flow completes.
   */
  async clearResetOtp(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        resetOtpHash: null,
        resetOtpExpiresAt: null,
      },
    });
  }

  /**
   * Deletes a user after verifying the record exists.
   */
  async remove(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.delete({
      where: { id },
    });
  }
}
