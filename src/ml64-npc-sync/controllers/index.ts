import { IModLoaderAPI } from 'modloader64_api/IModLoaderAPI'
import { ActorCategory } from 'modloader64_api/OOT/ActorCategory'
import { IOOTCore } from 'modloader64_api/OOT/OOTAPI'
import { ActorHealthSyncController } from './actorHealthSync/actorHealthSyncController'
import { HealthSyncMode } from './actorHealthSync/healthSyncMode'
import { ActorPositionSyncController } from './actorPositionSyncController/actorPositionSyncController'
import { DistanceSyncDispatcher } from './actorPositionSyncController/syncDispatcher/distanceSyncDispatcher'
import { HealthSyncDispatcher } from './actorPositionSyncController/syncDispatcher/healthSyncDispatcher'
import { RandomSyncDispatcher } from './actorPositionSyncController/syncDispatcher/randomSyncDispatcher'
import { INetworkController } from './interfaces/networkController'

export const getControllers = (core: IOOTCore, modLoader: IModLoaderAPI): INetworkController[] => {
  return [
    new ActorHealthSyncController(core, modLoader, [ActorCategory.ENEMY], HealthSyncMode.HealthAndDeath),
    new ActorHealthSyncController(core, modLoader, [ActorCategory.BOSS], HealthSyncMode.Health),
    new ActorPositionSyncController(core, modLoader, [ActorCategory.ENEMY, ActorCategory.MISC, ActorCategory.PROP_2, ActorCategory.NPC], [new HealthSyncDispatcher(), new DistanceSyncDispatcher()]),
    new ActorPositionSyncController(core, modLoader, [ActorCategory.BOSS], [new RandomSyncDispatcher()])
  ]
}
