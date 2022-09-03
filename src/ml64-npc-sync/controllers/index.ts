import { IModLoaderAPI } from 'modloader64_api/IModLoaderAPI'
import { IOOTCore } from 'modloader64_api/OOT/OOTAPI'
import { ActorHealthSyncController } from './actorHealthSync/actorHealthSyncController'
import { ActorPositionSyncController } from './actorPositionSyncController.ts/actorPositionSyncController'
import { INetworkController } from './interfaces/networkController'

export const getControllers = (core: IOOTCore, modLoader: IModLoaderAPI): INetworkController[] => {
  return [
    new ActorHealthSyncController(core, modLoader),
    new ActorPositionSyncController(core, modLoader)
  ]
}
