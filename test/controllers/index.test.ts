import { ActorHealthSyncController } from '../../src/ml64-npc-sync/controllers/actorHealthSync/actorHealthSyncController'
import { ActorPositionSyncController } from '../../src/ml64-npc-sync/controllers/actorPositionSyncController.ts/actorPositionSyncController'
import { IModLoaderAPI } from 'modloader64_api/IModLoaderAPI'
import { IOOTCore } from 'modloader64_api/OOT/OOTAPI'
import { getControllers } from '../../src/ml64-npc-sync/controllers'
import { ActorCategory } from 'modloader64_api/OOT/ActorCategory'

describe('Controller index Test', () => {
  test('getControllers -> returns the correct controllers', () => {
    const core = {
    } as unknown as IOOTCore
    const modLoader = {
    } as unknown as IModLoaderAPI
    const controllers = getControllers(core, modLoader)
    expect(controllers.length).toBe(3)
    expect(controllers[0]).toBeInstanceOf(ActorHealthSyncController)
    expect(controllers[0].core).toBe(core)
    expect(controllers[0].modLoader).toBe(modLoader)
    expect((controllers[0] as ActorHealthSyncController).actorCategories.length).toBe(1)
    expect((controllers[0] as ActorHealthSyncController).actorCategories[0]).toBe(ActorCategory.ENEMY)
    expect(controllers[1]).toBeInstanceOf(ActorPositionSyncController)
    expect(controllers[1].core).toBe(core)
    expect(controllers[1].modLoader).toBe(modLoader)
    expect((controllers[1] as ActorPositionSyncController).actorCategories.length).toBe(4)
    expect((controllers[1] as ActorPositionSyncController).actorCategories[0]).toBe(ActorCategory.ENEMY)
    expect((controllers[1] as ActorPositionSyncController).actorCategories[1]).toBe(ActorCategory.MISC)
    expect((controllers[1] as ActorPositionSyncController).actorCategories[2]).toBe(ActorCategory.PROP_2)
    expect((controllers[1] as ActorPositionSyncController).actorCategories[3]).toBe(ActorCategory.NPC)
    expect(controllers[2]).toBeInstanceOf(ActorPositionSyncController)
    expect(controllers[2].core).toBe(core)
    expect(controllers[2].modLoader).toBe(modLoader)
    expect((controllers[2] as ActorPositionSyncController).actorCategories.length).toBe(1)
    expect((controllers[2] as ActorPositionSyncController).actorCategories[0]).toBe(ActorCategory.BOSS)
  })
})
