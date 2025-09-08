import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from 'src/users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { GoogleUser } from './strategys/google.strategy';
import { SALT_ROUNDS, ERROR_MESSAGES } from 'src/shared/constants';

export interface JwtPayload {
  sub: number;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { userName, userSurname, phoneNumber, email, password } = registerDto;

    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser) {
      throw new UnauthorizedException(ERROR_MESSAGES.USER_ALREADY_EXISTS);
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = await this.usersService.create({
      userName,
      userSurname,
      phoneNumber,
      email,
      pwdHash: hashedPassword,
    });

    return this.generateToken(newUser.id, newUser.email);
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    if (!user.pwdHash) {
      throw new UnauthorizedException(ERROR_MESSAGES.PASSWORD_NOT_SET);
    }

    const isPasswordValid = await bcrypt.compare(password, user.pwdHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    return this.generateToken(user.id, user.email);
  }

  async googleSignIn(user: GoogleUser) {
    if (!user) {
      throw new UnauthorizedException();
    }

    const { email } = user;

    const userExists = await this.usersService.findByEmail(email);

    if (!userExists) {
      return this.googleRegister(user);
    }

    if (userExists && !userExists.avatarUrl) {
      await this.usersService.update(userExists.id, {
        avatarUrl: user.avatarUrl,
        provider: user.provider,
        providerId: user.providerId,
      });
    }

    return this.generateToken(userExists.id, userExists.email);
  }

  async googleRegister(user: GoogleUser) {
    try {
      const newUser = await this.usersService.create(user);
      return this.generateToken(newUser.id, newUser.email);
    } catch {
      throw new InternalServerErrorException();
    }
  }

  private generateToken(userId: number, email: string) {
    const payload = { sub: userId, email };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
