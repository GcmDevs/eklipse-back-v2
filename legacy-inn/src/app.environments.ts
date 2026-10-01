import { generateApiUrlBase, GLOBAL_VALID_HOSTS, processEnv } from '@env';
import { PORTS } from '@common/application/constants';
import * as NodeRSA from 'node-rsa';
import * as fs from 'fs';

const production = processEnv.PRODUCTION;
const showDocs = processEnv.SHOW_DOCS;
const isHttps = processEnv.IS_HTTPS;
const apiUrlBase = generateApiUrlBase();
const port = PORTS.inn;

export const ENVIRONMENTS = {
  production,
  showDocs,
  isHttps,
  port,
  apiUrl: production ? `${apiUrlBase}:${port}` : `${apiUrlBase}:${port}`,
  apiUrlBase,
  rsa: {
    ids: {
      publicKey: new NodeRSA(fs.readFileSync('../rsa/ids/public.pem', 'utf8')),
      privateKey: new NodeRSA(fs.readFileSync('../rsa/ids/private.pem', 'utf8')),
    },
  },
};

export const VALID_HOSTS = GLOBAL_VALID_HOSTS;
