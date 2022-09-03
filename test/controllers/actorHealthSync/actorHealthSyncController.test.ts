import { IModLoaderAPI } from 'modloader64_api/IModLoaderAPI'
import { IActorManager, IGlobalContext, IOOTCore } from 'modloader64_api/OOT/OOTAPI'
import { ActorCategory } from 'modloader64_api/OOT/ActorCategory'
import { IActor } from 'modloader64_api/OOT/IActor'
import { ActorHealthSyncController } from '../../../src/ml64-npc-sync/controllers/actorHealthSync/actorHealthSyncController'
import { ActorHealthSyncPacket, ACTOR_HEALTH_SYNC_PACKET_TAG } from '../../../src/ml64-npc-sync/packets/actorHealthSyncPacket'
import { ActorHealthData } from '@ml64-npc-sync/model/actorHealthData'
import { INetworkClient } from 'modloader64_api/NetworkHandler'

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

  test('given actor not in actor data storage -> sync -> creates actor in actor data storage', () => {
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

  test('given packet with different scene -> receiveSync -> ignores the packet', () => {
    const actorHealthData = { scene: Math.random() } as unknown as ActorHealthData
    actorHealthSyncController.storage.scene = actorHealthData.scene + 1
    const packet: ActorHealthSyncPacket = new ActorHealthSyncPacket(actorHealthData, ACTOR_HEALTH_SYNC_PACKET_TAG)
    actorManager.getActors = jest.fn().mockImplementation((category) => {
      throw new Error("This shouldn't happen")
    })
    actorHealthSyncController.receiveSync(packet)
  })

  test('given packet with same scene -> receiveSync -> process packet', () => {
    const actorHealthData = { scene: Math.random() } as unknown as ActorHealthData
    actorHealthSyncController.storage.scene = actorHealthData.scene
    modLoader.clientSide = {
      sendPacket: jest.fn()
    } as unknown as INetworkClient
    const packet: ActorHealthSyncPacket = new ActorHealthSyncPacket(actorHealthData, ACTOR_HEALTH_SYNC_PACKET_TAG)
    actorHealthSyncController.receiveSync(packet)
    expect(getActorsFn).toBeCalledTimes(actorHealthSyncController.ACTOR_CATEGORIES_TO_BE_SYNCED.length)
  })

  test('given packet with no actor in storage -> receiveSync -> sends a packet with 0 health', () => {
    const actorHealthData = { scene: Math.random(), actorUUID: `UUID-${Math.random().toString(10)}` } as unknown as ActorHealthData
    actorHealthSyncController.storage.scene = actorHealthData.scene
    const sendPacketFn = jest.fn().mockImplementation((packet) => {
      expect(packet).toBeInstanceOf(ActorHealthSyncPacket)
      expect(packet.actorData.health).toBe(0)
      expect(packet.actorData.actorUUID).toBe(actorHealthData.actorUUID)
    })
    modLoader.clientSide = {
      sendPacket: sendPacketFn
    } as unknown as INetworkClient
    const packet: ActorHealthSyncPacket = new ActorHealthSyncPacket(actorHealthData, ACTOR_HEALTH_SYNC_PACKET_TAG)
    actorHealthSyncController.receiveSync(packet)
    expect(getActorsFn).toBeCalledTimes(actorHealthSyncController.ACTOR_CATEGORIES_TO_BE_SYNCED.length)
    expect(sendPacketFn).toBeCalledTimes(1)
  })

  test('given packet with lesser health actor in storage -> receiveSync -> sends a packet with updated health', () => {
    const actorHealthData = { scene: Math.random(), actorUUID: `UUID-${Math.random().toString(10)}`, health: Math.random() * 100 } as unknown as ActorHealthData
    actorHealthSyncController.storage.scene = actorHealthData.scene
    const actor = {
      actorUUID: actorHealthData.actorUUID,
      actorID: Math.random(),
      health: actorHealthData.health - 1
    } as unknown as IActor
    actors = [actor]
    const sendPacketFn = jest.fn().mockImplementation((packet) => {
      expect(packet).toBeInstanceOf(ActorHealthSyncPacket)
      expect(packet.actorData.health).toBe(actor.health)
      expect(packet.actorData.actorUUID).toBe(actorHealthData.actorUUID)
    })
    modLoader.clientSide = {
      sendPacket: sendPacketFn
    } as unknown as INetworkClient
    const packet: ActorHealthSyncPacket = new ActorHealthSyncPacket(actorHealthData, ACTOR_HEALTH_SYNC_PACKET_TAG)
    actorHealthSyncController.receiveSync(packet)
    expect(getActorsFn).toBeCalledTimes(actorHealthSyncController.ACTOR_CATEGORIES_TO_BE_SYNCED.length)
    expect(sendPacketFn).toBeCalledTimes(1)
  })

  test('given packet with greater health actor in storage but not dead -> receiveSync -> updates health', () => {
    const actorHealthData = { scene: Math.random(), actorUUID: `UUID-${Math.random().toString(10)}`, health: Math.random() * 100 } as unknown as ActorHealthData
    actorHealthSyncController.storage.scene = actorHealthData.scene
    const actor = {
      actorUUID: actorHealthData.actorUUID,
      actorID: Math.random(),
      health: actorHealthData.health + 1
    } as unknown as IActor
    actors = [actor]
    const sendPacketFn = jest.fn()
    modLoader.clientSide = {
      sendPacket: sendPacketFn
    } as unknown as INetworkClient
    const packet: ActorHealthSyncPacket = new ActorHealthSyncPacket(actorHealthData, ACTOR_HEALTH_SYNC_PACKET_TAG)
    actorHealthSyncController.receiveSync(packet)
    expect(getActorsFn).toBeCalledTimes(actorHealthSyncController.ACTOR_CATEGORIES_TO_BE_SYNCED.length)
    expect(sendPacketFn).toBeCalledTimes(0)
    expect(actor.health).toBe(actorHealthData.health)
  })

  test('given packet with dead actor and greater health actor in storage -> receiveSync -> destroys the actor', () => {
    const actorHealthData = { scene: Math.random(), actorUUID: `UUID-${Math.random().toString(10)}`, health: 0 } as unknown as ActorHealthData
    actorHealthSyncController.storage.scene = actorHealthData.scene
    const destroyFn = jest.fn()
    const actor = {
      actorUUID: actorHealthData.actorUUID,
      actorID: Math.random(),
      health: Math.random() * 100,
      destroy: destroyFn
    } as unknown as IActor
    actors = [actor]
    const sendPacketFn = jest.fn()
    modLoader.clientSide = {
      sendPacket: sendPacketFn
    } as unknown as INetworkClient
    const packet: ActorHealthSyncPacket = new ActorHealthSyncPacket(actorHealthData, ACTOR_HEALTH_SYNC_PACKET_TAG)
    actorHealthSyncController.receiveSync(packet)
    expect(getActorsFn).toBeCalledTimes(actorHealthSyncController.ACTOR_CATEGORIES_TO_BE_SYNCED.length)
    expect(sendPacketFn).toBeCalledTimes(0)
    expect(actor.health).toBe(actorHealthData.health)
    expect(destroyFn).toBeCalledTimes(1)
  })
})
