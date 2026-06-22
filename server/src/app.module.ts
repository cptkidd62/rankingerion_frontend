import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MatchesController } from './matches/matches.controller';
import { MatchesService } from './matches/matches.service';
import { DataModule } from './data/data.module';
import { BotsController } from './bots/bots.controller';
import { BotsService } from './bots/bots.service';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { ConfigModule } from '@nestjs/config';
import { BenchmarkerModule } from './benchmarker/benchmarker.module';
import { AppConfigService } from './config/appconfig.service';

@Module({
  imports: [
    DataModule,
    ConfigModule.forRoot({
      envFilePath: ['.env.local', '.env'],
    }),
    BenchmarkerModule,
  ],
  controllers: [
    AppController,
    MatchesController,
    BotsController,
    UsersController,
    AuthController,
  ],
  providers: [
    AppService,
    MatchesService,
    BotsService,
    UsersService,
    AuthService,
    AppConfigService,
  ],
})
export class AppModule {}
