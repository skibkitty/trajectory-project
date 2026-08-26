export type { StorageProvider } from "./storage.js";
export { CURRENT_SCHEMA_VERSION } from "./serialization.js";
export type { ProjectData, TaskData, GoalData } from "./serialization.js";
export { serialize, deserialize } from "./serialization.js";
export { LocalProjectRepository } from "./local-repository.js";
export { createLocalStorageProvider } from "./local-storage.js";
