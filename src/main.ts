import * as core from '@actions/core';
import {Session} from '@nikolay.matrosov/yc-ts-sdk';
import {PayloadService} from '@nikolay.matrosov/yc-ts-sdk/lib/api/lockbox/v1';
import {fromServiceAccountJsonFile} from '@nikolay.matrosov/yc-ts-sdk/lib/src/TokenService/iamTokenService';
import {GetPayloadRequest} from '@nikolay.matrosov/yc-ts-sdk/lib/generated/yandex/cloud/lockbox/v1/payload_service';

async function run(): Promise<void> {
  try {
    core.info(`start`);
    const ycSaJsonCredentials = core.getInput('yc-sa-json-credentials', {
      required: true,
    });

    const secretId = core.getInput('secret-id', {
      required: true,
    });

    const versionId = core.getInput('version-id');

    const serviceAccountJson = fromServiceAccountJsonFile(JSON.parse(ycSaJsonCredentials));
    core.info('Parsed Service account JSON');

    const session = new Session({serviceAccountJson});
    const payloadService = PayloadService(session);

    const res = await payloadService.get(
      GetPayloadRequest.fromPartial({
        secretId,
        versionId,
      }),
    );
    const keys: string[] = [];
    for (const entry of res.entries) {
      const {key, textValue, binaryValue} = entry;
      const value = binaryValue !== undefined ? Buffer.from(binaryValue).toString('base64') : textValue ?? '';
      core.setOutput(key, value);
      core.setSecret(value);
      keys.push(key);
    }

    core.info(`Fetched values for ${keys.join(', ')}`);
  } catch (error) {
    if (error instanceof Error) {
      core.error(error);
      core.setFailed(error.message);
    }
  }
}

run();
