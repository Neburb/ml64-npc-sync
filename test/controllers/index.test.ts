import { ActorHealthSyncController } from '../../src/ml64-npc-sync/controllers/actorHealthSync/actorHealthSyncController'
import { ActorPositionSyncController } from '../../src/ml64-npc-sync/controllers/actorPositionSyncController/actorPositionSyncController'
import { IModLoaderAPI } from 'modloader64_api/IModLoaderAPI'
import { IOOTCore } from 'modloader64_api/OOT/OOTAPI'
import { getControllers } from '../../src/ml64-npc-sync/controllers'
import { ActorCategory } from 'modloader64_api/OOT/ActorCategory'
import { HealthSyncMode } from '../../src/ml64-npc-sync/controllers/actorHealthSync/healthSyncMode'
import { HealthSyncDispatcher } from '../../src/ml64-npc-sync/controllers/actorPositionSyncController/syncDispatcher/healthSyncDispatcher'
import { DistanceSyncDispatcher } from '../../src/ml64-npc-sync/controllers/actorPositionSyncController/syncDispatcher/distanceSyncDispatcher'
import { RandomSyncDispatcher } from '../../src/ml64-npc-sync/controllers/actorPositionSyncController/syncDispatcher/randomSyncDispatcher'

describe('Controller index Test', () => {
  test('getControllers -> returns the correct controllers', () => {
    const core = {
    } as unknown as IOOTCore
    const modLoader = {
    } as unknown as IModLoaderAPI
    const controllers = getControllers(core, modLoader)
    expect(controllers.length).toBe(4)
    expect(controllers[0]).toBeInstanceOf(ActorHealthSyncController)
    expect(controllers[0].core).toBe(core)
    expect(controllers[0].modLoader).toBe(modLoader)
    expect((controllers[0] as ActorHealthSyncController).actorCategories.length).toBe(1)
    expect((controllers[0] as ActorHealthSyncController).actorCategories[0]).toBe(ActorCategory.ENEMY)
    expect((controllers[0] as ActorHealthSyncController).healthSyncMode).toBe(HealthSyncMode.HealthAndDeath)
    expect(controllers[1]).toBeInstanceOf(ActorHealthSyncController)
    expect(controllers[1].core).toBe(core)
    expect(controllers[1].modLoader).toBe(modLoader)
    expect((controllers[1] as ActorHealthSyncController).actorCategories.length).toBe(1)
    expect((controllers[1] as ActorHealthSyncController).actorCategories[0]).toBe(ActorCategory.BOSS)
    expect((controllers[1] as ActorHealthSyncController).healthSyncMode).toBe(HealthSyncMode.Health)
    expect(controllers[2]).toBeInstanceOf(ActorPositionSyncController)
    expect(controllers[2].core).toBe(core)
    expect(controllers[2].modLoader).toBe(modLoader)
    expect((controllers[2] as ActorPositionSyncController).actorCategories.length).toBe(4)
    expect((controllers[2] as ActorPositionSyncController).actorCategories[0]).toBe(ActorCategory.ENEMY)
    expect((controllers[2] as ActorPositionSyncController).actorCategories[1]).toBe(ActorCategory.MISC)
    expect((controllers[2] as ActorPositionSyncController).actorCategories[2]).toBe(ActorCategory.PROP_2)
    expect((controllers[2] as ActorPositionSyncController).actorCategories[3]).toBe(ActorCategory.NPC)
    expect((controllers[2] as ActorPositionSyncController).syncDispatchers.length).toBe(2)
    expect((controllers[2] as ActorPositionSyncController).syncDispatchers[0]).toBeInstanceOf(HealthSyncDispatcher)
    expect((controllers[2] as ActorPositionSyncController).syncDispatchers[1]).toBeInstanceOf(DistanceSyncDispatcher)
    expect(controllers[3]).toBeInstanceOf(ActorPositionSyncController)
    expect(controllers[3].core).toBe(core)
    expect(controllers[3].modLoader).toBe(modLoader)
    expect((controllers[3] as ActorPositionSyncController).actorCategories.length).toBe(1)
    expect((controllers[3] as ActorPositionSyncController).actorCategories[0]).toBe(ActorCategory.BOSS)
    expect((controllers[3] as ActorPositionSyncController).syncDispatchers.length).toBe(1)
    expect((controllers[3] as ActorPositionSyncController).syncDispatchers[0]).toBeInstanceOf(RandomSyncDispatcher)
  })
})
