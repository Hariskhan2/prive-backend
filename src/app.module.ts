import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { GatewayModule } from './gateway/gateway.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [PrismaModule, GatewayModule, UploadModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
