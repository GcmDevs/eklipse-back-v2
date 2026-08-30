import { Injectable } from '@nestjs/common';
import { CentralComprasSource } from '@inn/lgc/ctc/infrastructure/base';

@Injectable()
export class FetchMisPermisosImpl extends CentralComprasSource {
  public async execute() {
    return await this.ctcPermisos();
  }
}
