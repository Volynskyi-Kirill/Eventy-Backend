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
      throw new UnauthorizedException('User already exists');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

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
      throw new UnauthorizedException('User not found');
    }

    if (!user.pwdHash) {
      throw new UnauthorizedException(
        'Password is not set. Please use Google authentication.',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.pwdHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
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
