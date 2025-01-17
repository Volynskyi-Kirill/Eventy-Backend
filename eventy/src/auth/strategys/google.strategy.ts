import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth2';

interface GoogleProfile {
  provider: string;
  sub: string;
  id: string;
  displayName: string;
  name: {
    givenName: string;
    familyName?: string;
  };
  given_name: string;
  family_name?: string;
  email_verified: boolean;
  verified: boolean;
  email: string;
  emails: Array<{ value: string; type: string }>;
  photos: Array<{ value: string; type: string }>;
  picture: string;
  _raw: string;
  _json: {
    sub: string;
    name: string;
    given_name: string;
    picture: string;
    email: string;
    email_verified: boolean;
  };
}

export interface GoogleUser {
  userName: string;
  userSurname: string | null;
  provider: string;
  providerId: string;
  email: string;
  avatarUrl: string;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
      scope: ['profile', 'email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: GoogleProfile,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, name, emails, photos } = profile;

    const user: GoogleUser = {
      userName: name.givenName,
      userSurname: name.familyName ?? null,
      provider: 'google',
      providerId: id,
      email: emails[0].value,
      avatarUrl: photos[0].value,
    };

    done(null, user);
  }
}
