import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SecurityModule } from './security/module';
import { DependenciasModule } from './dependencias/module';
import { PacientesModule } from './pacientes/module';
import { RecursosModule } from './recursos/module';
import { EnlExtModule } from './enlaces-externos/module';
import { CrnModule } from 'crn/module';
import { CarteraModule } from '@crn/rft/cartera/cartera.module';

const config = [
  //
  { name: 'Security', url: 'docs/security', version: `1.0`, modules: [SecurityModule] },
  { name: 'Dependencias', url: 'docs/dependencias', version: `1.0`, modules: [DependenciasModule] },
  { name: 'Pacientes', url: 'docs/pacientes', version: `1.0`, modules: [PacientesModule] },
  { name: 'Recursos', url: 'docs/recursos', version: `4.0`, modules: [RecursosModule] },
  { name: 'Enlaces externos', url: 'docs/enl-ext', version: `4.0`, modules: [EnlExtModule] },
  { name: 'Cartera', url: 'docs/crn', version: `4.0`, modules: [CarteraModule] },
];

export const initSwagger = (app: INestApplication) => {
  const principalOptions = new DocumentBuilder().setTitle('Eklipse GCM').build();
  const principalDocument = SwaggerModule.createDocument(app, principalOptions);
  const swaggerOptionsUrls: { name: string; url: string }[] = [];
  config.forEach(el => {
    swaggerOptionsUrls.push({ name: el.name, url: `${el.url}/swagger.json` });
  });
  SwaggerModule.setup('docs', app, principalDocument, {
    explorer: true,
    swaggerOptions: { urls: swaggerOptionsUrls },
    jsonDocumentUrl: `/docs/swagger.json`,
  });

  config.forEach(el => {
    const documentBuilder = new DocumentBuilder()
      .setTitle(`Eklipse GCM (${el.name})`)
      .setVersion(el.version)
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, documentBuilder, { include: el.modules });
    SwaggerModule.setup(el.url, app, document, {
      explorer: true,
      jsonDocumentUrl: `${el.url}/swagger.json`,
    });
  });
};
