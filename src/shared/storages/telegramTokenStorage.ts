import { BaseStorage, createStorage, StorageType } from '@src/shared/storages/base';

type TelegramTokenStorage = BaseStorage<string>;

const telegramTokenStorage: TelegramTokenStorage = createStorage<string>('telegram-token', '', {
  storageType: StorageType.Local,
  liveUpdate: true,
});

export default telegramTokenStorage;
