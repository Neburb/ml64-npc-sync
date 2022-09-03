import { ActorHealthSyncController } from '../../controllers/actorHealthSync/actorHealthSyncController'
import { ActorPositionSyncController } from '../../controllers/actorPositionSyncController.ts/actorPositionSyncController'
import { IModLoaderAPI } from 'modloader64_api/IModLoaderAPI'
import { IOOTCore } from 'modloader64_api/OOT/OOTAPI'
import { getControllers } from '../../controllers'

describe('Controller index Test', () => {
  test('getControllers -> returns the correct controllers', () => {
    const core = {
    } as unknown as IOOTCore
    const modLoader = {
    } as unknown as IModLoaderAPI
    const controllers = getControllers(core, modLoader)
    expect(controllers.length).toBe(2)
    expect(controllers[0]).toBeInstanceOf(ActorHealthSyncController)
    expect(controllers[0].core).toBe(core)
    expect(controllers[0].modLoader).toBe(modLoader)
    expect(controllers[1]).toBeInstanceOf(ActorPositionSyncController)
    expect(controllers[1].core).toBe(core)
    expect(controllers[1].modLoader).toBe(modLoader)
  })
})
