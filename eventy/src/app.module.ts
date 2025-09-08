import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JwtGuard } from './auth/guards/jwt.guard';
import { CategoriesModule } from './categories/categories.module';
import { EventsModule } from './events/events.module';
import { TicketsModule } from './tickets/tickets.module';
import { UsersModule } from './users/users.module';

const jwtGuard = {
  provide: APP_GUARD,
  useClass: JwtGuard,
};

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UsersModule,
    AuthModule,
    EventsModule,
    CategoriesModule,
    TicketsModule,
  ],
  controllers: [AppController],
  providers: [AppService, jwtGuard],
})
export class AppModule {}
