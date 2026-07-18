import { startContentManager } from './content-manager/server.mjs';
startContentManager({ port: Number(process.env.NEUEVAULT_MANAGER_PORT || 4317) });
