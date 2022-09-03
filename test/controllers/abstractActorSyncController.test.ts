import { IModLoaderAPI } from 'modloader64_api/IModLoaderAPI'
import { IActorManager, IGlobalContext, IOOTCore } from 'modloader64_api/OOT/OOTAPI'
import { AbstractPacket } from '../../src/ml64-npc-sync/packets/abstractPacket'
import { AbstractActorSyncController } from '../../src/ml64-npc-sync/controllers/abstractActorSyncController'
import { ActorStorage } from '../../src/ml64-npc-sync/controllers/storages/actorStorage'
import { ActorCategory } from 'modloader64_api/OOT/ActorCategory'
import { IActor } from 'modloader64_api/OOT/IActor'

class DummyController extends AbstractActorSyncController {
  ACTOR_CATEGORIES_TO_BE_SYNCED: ActorCategory[]
  storage: ActorStorage

  constructor (core: IOOTCore, modLoader: IModLoaderAPI, eventHandlers: string[], storage: ActorStorage, categories: ActorCategory[]) {
    super(core, modLoader, eventHandlers)
    this.storage = storage
    this.ACTOR_CATEGORIES_TO_BE_SYNCED = categories
  }

  sync (frame: number): AbstractPacket[] {
    throw new Error('Method not implemented.')
  }

  receiveSync (packet: AbstractPacket): void {
    throw new Error('Method not implemented.')
  }
}

describe('AbstractActorSyncController Test', () => {
  let abstractController: AbstractActorSyncController
  let core: IOOTCore
  let modLoader: IModLoaderAPI
  let eventHandlers: string[]
  let actorStorage: ActorStorage
  let categories: ActorCategory[]
  beforeEach(() => {
    core = {
    } as unknown as IOOTCore
    modLoader = {
    } as unknown as IModLoaderAPI
    eventHandlers = [Math.random().toString(10), Math.random().toString(10)]
    actorStorage = {
      scene: -1
    }
    categories = [ActorCategory.BACKGROUNDS, ActorCategory.BOMB]
    abstractController = new DummyController(core, modLoader, eventHandlers, actorStorage, categories)
    expect(abstractController.core).toBe(core)
    expect(abstractController.eventHandlers).toBe(eventHandlers)
    expect(abstractController.modLoader).toBe(modLoader)
    expect(abstractController.storage).toBe(actorStorage)
    expect(abstractController.ACTOR_CATEGORIES_TO_BE_SYNCED).toBe(categories)
  })

  test('given correct UUID -> getActors -> returns correct actor', () => {
    const UUID = 'TestUUID'
    const actor = {
      actorUUID: UUID
    } as unknown as IActor
    const actor2 = {
      actorUUID: 'ErroredUUID'
    } as unknown as IActor
    const getActorsFn = jest.fn().mockImplementation((actorCategory) => {
      expect(categories).toContain(actorCategory)
      if (categories[1] === actorCategory) { return [actor] } else { return [actor2] }
    })
    core.actorManager = {
      getActors: getActorsFn
    } as unknown as IActorManager
    expect(abstractController.getActor(UUID)).toBe(actor)
    expect(getActorsFn).toBeCalledTimes(categories.length)
  })

  test('given not found UUID -> getActors -> returns null actor', () => {
    const UUID = 'TestUUID'
    const actor = {
      actorUUID: 'NotFoundUUID'
    } as unknown as IActor
    const getActorsFn = jest.fn().mockImplementation((actorCategory) => {
      expect(categories).toContain(actorCategory)
      return [actor]
    })
    core.actorManager = {
      getActors: getActorsFn
    } as unknown as IActorManager
    expect(abstractController.getActor(UUID)).toBe(null)
    expect(getActorsFn).toBeCalledTimes(categories.length)
  })

  test('given scene being the same -> didSceneChange -> return false', () => {
    const SCENE = Math.random()
    core.global = {
      scene: SCENE
    } as unknown as IGlobalContext
    actorStorage.scene = SCENE
    expect(abstractController.didSceneChange()).toBe(false)
    expect(actorStorage.scene).toBe(SCENE)
  })

  test('given scene being the different -> didSceneChange -> return true and change scene', () => {
    const SCENE = Math.random()
    core.global = {
      scene: SCENE
    } as unknown as IGlobalContext
    actorStorage.scene = SCENE + 1
    expect(abstractController.didSceneChange()).toBe(true)
    expect(actorStorage.scene).toBe(SCENE)
  })
})
