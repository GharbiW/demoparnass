import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsString, IsNotEmpty } from 'class-validator';

class ValidatePasswordDto {
  @IsString()
  @IsNotEmpty()
  password: string;
}

class VerifyTokenDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly configService: ConfigService) {}

  @Post('validate-password')
  validatePassword(@Body() body: ValidatePasswordDto) {
    const appPassword = this.configService.get<string>('APP_ACCESS_PASSWORD');

    if (!appPassword) {
      throw new UnauthorizedException(
        'Mot de passe non configuré sur le serveur',
      );
    }

    if (body.password !== appPassword) {
      throw new UnauthorizedException('Mot de passe incorrect');
    }

    // Return a simple token (hash of password + timestamp for basic security)
    const timestamp = Date.now();
    const token = Buffer.from(`${appPassword}:${timestamp}`).toString('base64');

    return {
      success: true,
      token,
      message: 'Authentification réussie',
    };
  }

  @Post('verify-token')
  verifyToken(@Body() body: VerifyTokenDto) {
    const appPassword = this.configService.get<string>('APP_ACCESS_PASSWORD');

    if (!appPassword || !body.token) {
      throw new UnauthorizedException('Token invalide');
    }

    try {
      const decoded = Buffer.from(body.token, 'base64').toString('utf-8');
      const [password, timestamp] = decoded.split(':');

      // Check password matches
      if (password !== appPassword) {
        throw new UnauthorizedException('Token invalide');
      }

      // Token expires after 7 days
      const tokenAge = Date.now() - parseInt(timestamp, 10);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;

      if (tokenAge > sevenDays) {
        throw new UnauthorizedException('Session expirée');
      }

      return { valid: true };
    } catch {
      throw new UnauthorizedException('Token invalide');
    }
  }
}
