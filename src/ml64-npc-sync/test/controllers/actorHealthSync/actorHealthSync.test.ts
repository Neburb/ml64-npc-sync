import { IModLoaderAPI } from 'modloader64_api/IModLoaderAPI'
import { IActorManager, IGlobalContext, IOOTCore } from 'modloader64_api/OOT/OOTAPI'
import { ActorCategory } from 'modloader64_api/OOT/ActorCategory'
import { IActor } from 'modloader64_api/OOT/IActor'
import { ActorHealthSyncController } from '../../../controllers/actorHealthSync/actorHealthSyncController'
import { ActorHealthSyncPacket, ACTOR_HEALTH_SYNC_PACKET_TAG } from '../../../packets/actorHealthSyncPacket'
import { ActorHealthData } from '@ml64-npc-sync/model/actorHealthData'

describe('ActorHealthSyncController Test', () => {
  let actorHealthSyncController: ActorHealthSyncController
  let core: IOOTCore
  let modLoader: IModLoaderAPI
  let actorManager: IActorManager
  let getActorsFn: jest.Func
  let actors: IActor[] = []
  beforeEach(() => {
    core = {
    } as unknown as IOOTCore
    modLoader = {
      clientLobby: `Lobby-${Math.random().toString(10)}`
    } as unknown as IModLoaderAPI
    actorManager = {

    } as unknown as IActorManager
    core.actorManager = actorManager
    getActorsFn = jest.fn().mockImplementation((category) => {
      if (category === ActorCategory.ENEMY) {
        return actors
      } else {
        return []
      }
    })
    actorManager.getActors = getActorsFn
    core.global = {
      scene: -1
    } as unknown as IGlobalContext
    actorHealthSyncController = new ActorHealthSyncController(core, modLoader)
    expect(actorHealthSyncController.core).toBe(core)
    expect(actorHealthSyncController.modLoader).toBe(modLoader)
    expect(actorHealthSyncController.ACTOR_CATEGORIES_TO_BE_SYNCED.length).toBe(2)
    expect(actorHealthSyncController.ACTOR_CATEGORIES_TO_BE_SYNCED[0]).toBe(ActorCategory.ENEMY)
    expect(actorHealthSyncController.ACTOR_CATEGORIES_TO_BE_SYNCED[1]).toBe(ActorCategory.BOSS)
    expect(actorHealthSyncController.eventHandlers.length).toBe(1)
    expect(actorHealthSyncController.eventHandlers[0]).toBe(ACTOR_HEALTH_SYNC_PACKET_TAG)
    expect('actorData' in actorHealthSyncController.storage).toBe(true)
  })

  test('given scene being the same -> sync -> does nothing', () => {
    actorHealthSyncController.storage.scene = core.global.scene
    expect(actorHealthSyncController.storage.scene).toBe(core.global.scene)
    expect(actorHealthSyncController.sync(0).length).toBe(0)
    expect(actorHealthSyncController.storage.scene).toBe(core.global.scene)
  })

  test('given scene being different -> sync -> changes scene and restore actorData storage', () => {
    const storageIndex = 'TestStorageIndex'
    const actorHealthData = {} as unknown as ActorHealthData
    actorHealthSyncController.storage.actorData = {}
    actorHealthSyncController.storage.actorData[storageIndex] = actorHealthData
    expect(actorHealthSyncController.storage.actorData[storageIndex]).toBe(actorHealthData)

    actorHealthSyncController.storage.scene = core.global.scene + 1
    expect(actorHealthSyncController.storage.scene).toBe(core.global.scene + 1)

    expect(actorHealthSyncController.sync(0).length).toBe(0)
    expect(actorHealthSyncController.storage.scene).toBe(core.global.scene)
    expect(actorHealthSyncController.storage.actorData[storageIndex]).toBeUndefined()
  })

  test('given actor not in actor data storage-> sync -> creates actor in actor data storage', () => {
    const actor = {
      actorUUID: `UUID-${Math.random().toString(10)}`,
      actorID: Math.random(),
      health: Math.random() + 10
    } as unknown as IActor
    actors = [actor]
    expect(actorHealthSyncController.storage.actorData[actor.actorUUID]).toBeUndefined()
    expect(actorHealthSyncController.storage.scene).toBe(core.global.scene)
    expect(actorHealthSyncController.sync(0).length).toBe(0)
    expect(actorHealthSyncController.storage.actorData[actor.actorUUID].actorUUID).toBe(actor.actorUUID)
    expect(actorHealthSyncController.storage.actorData[actor.actorUUID].actorID).toBe(actor.actorID)
    expect(actorHealthSyncController.storage.actorData[actor.actorUUID].health).toBe(actor.health)
  })

  test('given actor health 0 and different than actor health -> sync -> does nothing', () => {
    const actor = {
      actorUUID: `UUID-${Math.random().toString(10)}`,
      actorID: Math.random(),
      health: Math.random() + 10
    } as unknown as IActor
    actors = [actor]
    actorHealthSyncController.storage.actorData[actor.actorUUID] = { health: 0 } as unknown as ActorHealthData
    expect(actorHealthSyncController.sync(0).length).toBe(0)
  })

  test('given actor health greater than 0 and different than actor health -> sync -> returns 1 packet', () => {
    const actor = {
      actorUUID: `UUID-${Math.random().toString(10)}`,
      actorID: Math.random(),
      health: Math.random() + 10
    } as unknown as IActor
    actors = [actor]
    actorHealthSyncController.storage.actorData[actor.actorUUID] = { scene: actorHealthSyncController.storage.scene, actorUUID: actor.actorUUID, actorID: actor.actorID, health: actor.health - 1 } as unknown as ActorHealthData
    const packets = actorHealthSyncController.sync(0)
    expect(packets.length).toBe(1)
    expect(packets[0].channel).toBe(ACTOR_HEALTH_SYNC_PACKET_TAG)
    expect(packets[0].packet_id).toBe(ACTOR_HEALTH_SYNC_PACKET_TAG)
    expect(packets[0].lobby).toBe(modLoader.clientLobby)
    expect(packets[0]).toBeInstanceOf(ActorHealthSyncPacket)
    expect((packets[0] as ActorHealthSyncPacket).actorData.actorUUID).toBe(actor.actorUUID)
    expect((packets[0] as ActorHealthSyncPacket).actorData.actorID).toBe(actor.actorID)
    expect((packets[0] as ActorHealthSyncPacket).actorData.scene).toBe(actorHealthSyncController.storage.scene)
    expect(((packets[0] as ActorHealthSyncPacket).actorData as ActorHealthData).health).toBe(actor.health)
  })
})
