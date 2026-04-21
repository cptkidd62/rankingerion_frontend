import { HttpException, HttpStatus } from '@nestjs/common';

export class BotUploadException extends HttpException {
  constructor(msg: string) {
    super(msg, HttpStatus.BAD_REQUEST);
  }
}
