import { IModLoaderAPI } from 'modloader64_api/IModLoaderAPI'
import { ActorCategory } from 'modloader64_api/OOT/ActorCategory'
import { IOOTCore } from 'modloader64_api/OOT/OOTAPI'
import { ActorHealthSyncController } from './actorHealthSync/actorHealthSyncController'
import { HealthSyncMode } from './actorHealthSync/healthSyncMode'
import { ActorPositionSyncController } from './actorPositionSyncController/actorPositionSyncController'
import { PositionSyncMode } from './actorPositionSyncController/positionSyncMode'
import { INetworkController } from './interfaces/networkController'

export const getControllers = (core: IOOTCore, modLoader: IModLoaderAPI): INetworkController[] => {
  return [
    new ActorHealthSyncController(core, modLoader, [ActorCategory.ENEMY], HealthSyncMode.HealthAndDeath),
    new ActorHealthSyncController(core, modLoader, [ActorCategory.BOSS], HealthSyncMode.Health),
    new ActorPositionSyncController(core, modLoader, PositionSyncMode.PositionAndHealth, [ActorCategory.ENEMY, ActorCategory.MISC, ActorCategory.PROP_2, ActorCategory.NPC]),
    new ActorPositionSyncController(core, modLoader, PositionSyncMode.Random, [ActorCategory.BOSS])
  ]
}
