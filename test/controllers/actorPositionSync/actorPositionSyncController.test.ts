import { IModLoaderAPI } from 'modloader64_api/IModLoaderAPI'
import { IActorManager, IGlobalContext, IOOTCore } from 'modloader64_api/OOT/OOTAPI'
import { ActorCategory } from 'modloader64_api/OOT/ActorCategory'
import { IActor } from 'modloader64_api/OOT/IActor'
import { ActorHealthSyncPacket, ACTOR_HEALTH_SYNC_PACKET_TAG } from '../../../src/ml64-npc-sync/packets/actorHealthSyncPacket'
import { ActorHealthData } from '../../../src/ml64-npc-sync/model/actorHealthData'
import { ActorPositionSyncController } from '../../../src/ml64-npc-sync/controllers/actorPositionSyncController.ts/actorPositionSyncController'
import { ActorPositionSyncPacket, ACTOR_POSITION_SYNC_PACKET_TAG } from '../../../src/ml64-npc-sync/packets/actorPositionSyncPacket'
import { ActorPositionData } from '../../../src/ml64-npc-sync/model/actorPositionData'
import { PrioritySync } from '../../../src/ml64-npc-sync/model/prioritySync'

describe('ActorPositionSyncController Test', () => {
  let actorPositionSyncController: ActorPositionSyncController
  let core: IOOTCore
  let modLoader: IModLoaderAPI
  let actorManager: IActorManager
  let getActorsFn: jest.Func
  let actors: IActor[] = []
  beforeEach(() => {
    core = {
    } as unknown as IOOTCore
    modLoader = {
      clientLobby: `Lobby-${Math.random().toString(10)}`,
      me: {
        uuid: `PlayerUUID-${Math.random().toString(10)}`
      }
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
    actorPositionSyncController = new ActorPositionSyncController(core, modLoader)
    expect(actorPositionSyncController.core).toBe(core)
    expect(actorPositionSyncController.modLoader).toBe(modLoader)
    expect(actorPositionSyncController.ACTOR_CATEGORIES_TO_BE_SYNCED.length).toBe(5)
    expect(actorPositionSyncController.ACTOR_CATEGORIES_TO_BE_SYNCED[0]).toBe(ActorCategory.ENEMY)
    expect(actorPositionSyncController.ACTOR_CATEGORIES_TO_BE_SYNCED[1]).toBe(ActorCategory.BOSS)
    expect(actorPositionSyncController.ACTOR_CATEGORIES_TO_BE_SYNCED[2]).toBe(ActorCategory.MISC)
    expect(actorPositionSyncController.ACTOR_CATEGORIES_TO_BE_SYNCED[3]).toBe(ActorCategory.PROP_2)
    expect(actorPositionSyncController.ACTOR_CATEGORIES_TO_BE_SYNCED[4]).toBe(ActorCategory.NPC)
    expect(actorPositionSyncController.eventHandlers.length).toBe(2)
    expect(actorPositionSyncController.eventHandlers[0]).toBe(ACTOR_HEALTH_SYNC_PACKET_TAG)
    expect(actorPositionSyncController.eventHandlers[1]).toBe(ACTOR_POSITION_SYNC_PACKET_TAG)
    expect('prioritySync' in actorPositionSyncController.storage).toBe(true)
  })

  test('given scene being the same -> sync -> does nothing', () => {
    actorPositionSyncController.storage.scene = core.global.scene
    expect(actorPositionSyncController.storage.scene).toBe(core.global.scene)
    expect(actorPositionSyncController.sync(0).length).toBe(0)
    expect(actorPositionSyncController.storage.scene).toBe(core.global.scene)
  })

  test('given scene being different -> sync -> changes scene and restore actorData storage', () => {
    const storageIndex = 'TestStorageIndex'
    const actorPositionData = {} as unknown as ActorPositionData
    const prioritySync = { uuid: modLoader.me.uuid } as unknown as PrioritySync
    actorPositionSyncController.storage.actorData = {}
    actorPositionSyncController.storage.actorData[storageIndex] = actorPositionData
    actorPositionSyncController.storage.prioritySync[storageIndex] = prioritySync
    expect(actorPositionSyncController.storage.actorData[storageIndex]).toBe(actorPositionData)
    expect(actorPositionSyncController.storage.prioritySync[storageIndex]).toBe(prioritySync)

    actorPositionSyncController.storage.scene = core.global.scene + 1
    expect(actorPositionSyncController.storage.scene).toBe(core.global.scene + 1)

    expect(actorPositionSyncController.sync(0).length).toBe(0)
    expect(actorPositionSyncController.storage.scene).toBe(core.global.scene)
    expect(actorPositionSyncController.storage.actorData[storageIndex]).toBeUndefined()
    expect(actorPositionSyncController.storage.prioritySync[storageIndex]).toBeUndefined()
  })

  test('given actor not in actor data storage -> sync -> creates actor in actor data storage', () => {
    const actor = {
      actorUUID: `UUID-${Math.random().toString(10)}`,
      actorID: Math.random(),
      health: Math.random() + 10,
      position: {
        getRawPos: jest.fn().mockImplementation(() => {
          return { toString: jest.fn() }
        })
      },
      rotation: {
        getRawRot: jest.fn().mockImplementation(() => {
          return { toString: jest.fn() }
        })
      }
    } as unknown as IActor
    actors = [actor]
    expect(actorPositionSyncController.storage.actorData[actor.actorUUID]).toBeUndefined()
    expect(actorPositionSyncController.storage.scene).toBe(core.global.scene)
    expect(actorPositionSyncController.sync(0).length).toBe(1)
    expect(actorPositionSyncController.storage.actorData[actor.actorUUID].actorUUID).toBe(actor.actorUUID)
    expect(actorPositionSyncController.storage.actorData[actor.actorUUID].actorID).toBe(actor.actorID)
    expect(actorPositionSyncController.storage.actorData[actor.actorUUID].health).toBe(actor.health)
    expect(actorPositionSyncController.storage.prioritySync[actor.actorUUID].uuid).toBe(modLoader.me.uuid)
  })

  test('given actor health 0 -> sync -> does nothing', () => {
    const actor = {
      actorUUID: `UUID-${Math.random().toString(10)}`,
      actorID: Math.random(),
      health: Math.random() + 10
    } as unknown as IActor
    actors = [actor]
    actorPositionSyncController.storage.actorData[actor.actorUUID] = { health: 0 } as unknown as ActorPositionData
    expect(actorPositionSyncController.sync(0).length).toBe(0)
  })

  test('given actor health greater than 0 and less than actor storage health -> sync -> increases the aggro by 1', () => {
    const actor = {
      actorUUID: `UUID-${Math.random().toString(10)}`,
      actorID: Math.random(),
      health: Math.random() + 10
    } as unknown as IActor
    actors = [actor]
    const prioritySync = { aggro: 1, uuid: modLoader.me.uuid }
    actorPositionSyncController.storage.actorData[actor.actorUUID] = { scene: actorPositionSyncController.storage.scene, actorUUID: actor.actorUUID, health: actor.health + 1, prioritySync: { aggro: prioritySync.aggro + 10, uuid: `Remote-${Math.random().toString(10)}` } } as unknown as ActorPositionData
    actorPositionSyncController.storage.prioritySync[actor.actorUUID] = prioritySync
    expect(prioritySync.aggro).toBe(1)
    expect(actorPositionSyncController.sync(0).length).toBe(0)
    expect(prioritySync.aggro).toBe(2)
    expect(actorPositionSyncController.storage.actorData[actor.actorUUID].health).toBe(actor.health)
  })

  test('given actor health greater than 0 and no priority -> sync -> sets the priority', () => {
    const actor = {
      actorUUID: `UUID-${Math.random().toString(10)}`,
      actorID: Math.random(),
      health: Math.random() + 10,
      position: {
        getRawPos: jest.fn().mockImplementation(() => {
          return { toString: jest.fn() }
        })
      },
      rotation: {
        getRawRot: jest.fn().mockImplementation(() => {
          return { toString: jest.fn() }
        })
      }
    } as unknown as IActor
    actors = [actor]
    actorPositionSyncController.storage.actorData[actor.actorUUID] = { scene: actorPositionSyncController.storage.scene, actorUUID: actor.actorUUID, health: actor.health } as unknown as ActorPositionData
    const prioritySync = { aggro: 1, uuid: modLoader.me.uuid }
    expect(actorPositionSyncController.storage.actorData[actor.actorUUID].prioritySync).toBeUndefined()
    actorPositionSyncController.storage.prioritySync[actor.actorUUID] = prioritySync
    expect(actorPositionSyncController.sync(0).length).toBe(1)
    expect(actorPositionSyncController.storage.actorData[actor.actorUUID].prioritySync).toBe(prioritySync)
  })

  test('given actor health greater than 0 and local priority greater than remote -> sync -> sets the priority', () => {
    const actor = {
      actorUUID: `UUID-${Math.random().toString(10)}`,
      actorID: Math.random(),
      health: Math.random() + 10,
      position: {
        getRawPos: jest.fn().mockImplementation(() => {
          return { toString: jest.fn() }
        })
      },
      rotation: {
        getRawRot: jest.fn().mockImplementation(() => {
          return { toString: jest.fn() }
        })
      }
    } as unknown as IActor
    actors = [actor]
    const remotePrioritySync = { aggro: 1, uuid: `Remote-${actor.actorUUID}` }
    actorPositionSyncController.storage.actorData[actor.actorUUID] = { scene: actorPositionSyncController.storage.scene, actorUUID: actor.actorUUID, health: actor.health, prioritySync: remotePrioritySync } as unknown as ActorPositionData
    const prioritySync = { aggro: remotePrioritySync.aggro + 1, uuid: modLoader.me.uuid }
    expect(actorPositionSyncController.storage.actorData[actor.actorUUID].prioritySync).toBe(remotePrioritySync)
    actorPositionSyncController.storage.prioritySync[actor.actorUUID] = prioritySync
    expect(actorPositionSyncController.sync(0).length).toBe(1)
    expect(actorPositionSyncController.storage.actorData[actor.actorUUID].prioritySync).toBe(prioritySync)
  })

  test('given this being the priority -> sync -> sends a packet', () => {
    const posString = `Position-${Math.random().toString(10)}`
    const rotString = `Rotation-${Math.random().toString(10)}`
    const actor = {
      actorUUID: `UUID-${Math.random().toString(10)}`,
      actorID: Math.random(),
      health: Math.random() + 10,
      position: {
        getRawPos: jest.fn().mockImplementation(() => {
          return { toString: jest.fn().mockReturnValue(posString) }
        })
      },
      rotation: {
        getRawRot: jest.fn().mockImplementation(() => {
          return { toString: jest.fn().mockReturnValue(rotString) }
        })
      }
    } as unknown as IActor
    actors = [actor]
    const prioritySync = { aggro: 1, uuid: modLoader.me.uuid }
    actorPositionSyncController.storage.actorData[actor.actorUUID] = { scene: actorPositionSyncController.storage.scene, actorUUID: actor.actorUUID, health: actor.health, prioritySync } as unknown as ActorPositionData
    expect(actorPositionSyncController.storage.actorData[actor.actorUUID].prioritySync).toBe(prioritySync)
    actorPositionSyncController.storage.prioritySync[actor.actorUUID] = prioritySync
    const packets = actorPositionSyncController.sync(0)
    expect(packets.length).toBe(1)
    expect(packets[0]).toBeInstanceOf(ActorPositionSyncPacket)
    expect((packets[0] as ActorPositionSyncPacket).channel).toBe(ACTOR_POSITION_SYNC_PACKET_TAG)
    expect((packets[0] as ActorPositionSyncPacket).packet_id).toBe(ACTOR_POSITION_SYNC_PACKET_TAG)
    expect((packets[0] as ActorPositionSyncPacket).actorData.actorUUID).toBe(actor.actorUUID)
    expect(((packets[0] as ActorPositionSyncPacket).actorData as ActorPositionData).position).toBe(posString)
    expect(((packets[0] as ActorPositionSyncPacket).actorData as ActorPositionData).rotation).toBe(rotString)
    expect(((packets[0] as ActorPositionSyncPacket).actorData as ActorPositionData).prioritySync).toBe(prioritySync)
  })

  test('given health in storage lesser than packet -> receiveHealthSync -> does nothing', () => {
    const actor = {
      actorUUID: `UUID-${Math.random().toString(10)}`,
      actorID: Math.random(),
      health: Math.random() + 10
    } as unknown as IActor
    actors = [actor]
    const prioritySync = { aggro: 1, uuid: modLoader.me.uuid }
    actorPositionSyncController.storage.actorData[actor.actorUUID] = { scene: actorPositionSyncController.storage.scene, actorUUID: actor.actorUUID, health: actor.health, prioritySync } as unknown as ActorPositionData
    expect(actorPositionSyncController.storage.actorData[actor.actorUUID].prioritySync).toBe(prioritySync)
    actorPositionSyncController.storage.prioritySync[actor.actorUUID] = prioritySync
    const actorHealthData = { actorUUID: actor.actorUUID, health: actor.health + 1 } as unknown as ActorHealthData
    const healthPacket = new ActorHealthSyncPacket(actorHealthData, modLoader.clientLobby)
    actorPositionSyncController.receiveHealthSync(healthPacket)
    expect(actorPositionSyncController.storage.actorData[actor.actorUUID].health).toBe(actor.health)
  })

  test('given health in storage greater than packet -> receiveHealthSync -> updates health', () => {
    const actor = {
      actorUUID: `UUID-${Math.random().toString(10)}`,
      actorID: Math.random(),
      health: Math.random() + 10
    } as unknown as IActor
    actors = [actor]
    const prioritySync = { aggro: 1, uuid: modLoader.me.uuid }
    actorPositionSyncController.storage.actorData[actor.actorUUID] = { scene: actorPositionSyncController.storage.scene, actorUUID: actor.actorUUID, health: actor.health, prioritySync } as unknown as ActorPositionData
    expect(actorPositionSyncController.storage.actorData[actor.actorUUID].prioritySync).toBe(prioritySync)
    actorPositionSyncController.storage.prioritySync[actor.actorUUID] = prioritySync
    const actorHealthData = { actorUUID: actor.actorUUID, health: actor.health - 1 } as unknown as ActorHealthData
    const healthPacket = new ActorHealthSyncPacket(actorHealthData, modLoader.clientLobby)
    actorPositionSyncController.receiveHealthSync(healthPacket)
    expect(actorPositionSyncController.storage.actorData[actor.actorUUID].health).toBe(actorHealthData.health)
  })

  test('given priority in packet less than one already set -> receivePositionSync -> ignores packet', () => {
    const setRawPosFn = jest.fn()
    const actor = {
      actorUUID: `UUID-${Math.random().toString(10)}`,
      actorID: Math.random(),
      health: Math.random() + 10,
      position: {
        setRawPos: setRawPosFn
      }
    } as unknown as IActor
    actors = [actor]
    const prioritySync = { aggro: Math.random() * 100, uuid: modLoader.me.uuid }
    actorPositionSyncController.storage.actorData[actor.actorUUID] = { scene: actorPositionSyncController.storage.scene, actorUUID: actor.actorUUID, health: actor.health, prioritySync } as unknown as ActorPositionData
    expect(actorPositionSyncController.storage.actorData[actor.actorUUID].prioritySync).toBe(prioritySync)
    actorPositionSyncController.storage.prioritySync[actor.actorUUID] = prioritySync
    const actorPositionData = { prioritySync: { uuid: `Remote-${Math.random().toString(10)}`, aggro: prioritySync.aggro - 1 }, actorUUID: actor.actorUUID } as unknown as ActorPositionData
    const positionPacket = new ActorPositionSyncPacket(actorPositionData, modLoader.clientLobby)
    actorPositionSyncController.receivePositionSync(positionPacket)
    expect(actorPositionSyncController.storage.actorData[actor.actorUUID].prioritySync).toBe(prioritySync)
    expect(setRawPosFn).toHaveBeenCalledTimes(0)
  })

  test('given priority in packet greater than one already set -> receivePositionSync -> defines priority and updates rotation and position', () => {
    const setRawPosFn = jest.fn()
    const setRawRotFn = jest.fn()
    const actor = {
      actorUUID: `UUID-${Math.random().toString(10)}`,
      actorID: Math.random(),
      health: Math.random() + 10,
      position: {
        setRawPos: setRawPosFn
      },
      rotation: {
        setRawRot: setRawRotFn
      }
    } as unknown as IActor
    actors = [actor]
    const prioritySync = { aggro: Math.random() * 100, uuid: modLoader.me.uuid }
    actorPositionSyncController.storage.actorData[actor.actorUUID] = { scene: actorPositionSyncController.storage.scene, actorUUID: actor.actorUUID, health: actor.health, prioritySync } as unknown as ActorPositionData
    expect(actorPositionSyncController.storage.actorData[actor.actorUUID].prioritySync).toBe(prioritySync)
    actorPositionSyncController.storage.prioritySync[actor.actorUUID] = prioritySync
    const actorPositionData = { prioritySync: { uuid: `Remote-${Math.random().toString(10)}`, aggro: prioritySync.aggro + 1 }, actorUUID: actor.actorUUID, position: '', rotation: '' } as unknown as ActorPositionData
    const positionPacket = new ActorPositionSyncPacket(actorPositionData, modLoader.clientLobby)
    actorPositionSyncController.receivePositionSync(positionPacket)
    expect(actorPositionSyncController.storage.actorData[actor.actorUUID].prioritySync).toBe(actorPositionData.prioritySync)
    expect(setRawPosFn).toHaveBeenCalledTimes(1)
    expect(setRawRotFn).toHaveBeenCalledTimes(1)
  })

  test('given ActorPositionSyncPacket received -> receiveSync -> routes to receivePositionSync', () => {
    const setRawPosFn = jest.fn()
    const setRawRotFn = jest.fn()
    const actor = {
      actorUUID: `UUID-${Math.random().toString(10)}`,
      actorID: Math.random(),
      health: Math.random() + 10,
      position: {
        setRawPos: setRawPosFn
      },
      rotation: {
        setRawRot: setRawRotFn
      }
    } as unknown as IActor
    actors = [actor]
    const prioritySync = { aggro: Math.random() * 100, uuid: modLoader.me.uuid }
    actorPositionSyncController.storage.actorData[actor.actorUUID] = { scene: actorPositionSyncController.storage.scene, actorUUID: actor.actorUUID, health: actor.health, prioritySync } as unknown as ActorPositionData
    expect(actorPositionSyncController.storage.actorData[actor.actorUUID].prioritySync).toBe(prioritySync)
    actorPositionSyncController.storage.prioritySync[actor.actorUUID] = prioritySync
    const actorPositionData = { scene: actorPositionSyncController.storage.scene, prioritySync: { uuid: `Remote-${Math.random().toString(10)}`, aggro: prioritySync.aggro + 1 }, actorUUID: actor.actorUUID, position: '', rotation: '' } as unknown as ActorPositionData
    const positionPacket = new ActorPositionSyncPacket(actorPositionData, modLoader.clientLobby)
    actorPositionSyncController.receiveSync(positionPacket)
    expect(actorPositionSyncController.storage.actorData[actor.actorUUID].prioritySync).toBe(actorPositionData.prioritySync)
    expect(setRawPosFn).toHaveBeenCalledTimes(1)
    expect(setRawRotFn).toHaveBeenCalledTimes(1)
  })

  test('given ActorHealthSyncPacket received -> receiveSync -> routes to receiveHealthSync', () => {
    const setRawPosFn = jest.fn()
    const setRawRotFn = jest.fn()
    const actor = {
      actorUUID: `UUID-${Math.random().toString(10)}`,
      actorID: Math.random(),
      health: Math.random() + 10,
      position: {
        setRawPos: setRawPosFn
      },
      rotation: {
        setRawRot: setRawRotFn
      }
    } as unknown as IActor
    actors = [actor]
    const prioritySync = { aggro: Math.random() * 100, uuid: modLoader.me.uuid }
    actorPositionSyncController.storage.actorData[actor.actorUUID] = { scene: actorPositionSyncController.storage.scene, actorUUID: actor.actorUUID, health: actor.health, prioritySync } as unknown as ActorPositionData
    expect(actorPositionSyncController.storage.actorData[actor.actorUUID].prioritySync).toBe(prioritySync)
    actorPositionSyncController.storage.prioritySync[actor.actorUUID] = prioritySync
    const actorPositionData = { scene: actorPositionSyncController.storage.scene, actorUUID: actor.actorUUID, health: Math.random() } as unknown as ActorHealthData
    const positionPacket = new ActorHealthSyncPacket(actorPositionData, modLoader.clientLobby)
    actorPositionSyncController.receiveSync(positionPacket)
    expect(setRawPosFn).toHaveBeenCalledTimes(0)
    expect(setRawRotFn).toHaveBeenCalledTimes(0)
  })

  test('given different scene than packet -> receiveSync -> ignores packet', () => {
    const setRawPosFn = jest.fn()
    const setRawRotFn = jest.fn()
    const actor = {
      actorUUID: `UUID-${Math.random().toString(10)}`,
      actorID: Math.random(),
      health: Math.random() + 10,
      position: {
        setRawPos: setRawPosFn
      },
      rotation: {
        setRawRot: setRawRotFn
      }
    } as unknown as IActor
    actors = [actor]
    const prioritySync = { aggro: Math.random() * 100, uuid: modLoader.me.uuid }
    actorPositionSyncController.storage.actorData[actor.actorUUID] = { scene: actorPositionSyncController.storage.scene, actorUUID: actor.actorUUID, health: actor.health, prioritySync } as unknown as ActorPositionData
    expect(actorPositionSyncController.storage.actorData[actor.actorUUID].prioritySync).toBe(prioritySync)
    actorPositionSyncController.storage.prioritySync[actor.actorUUID] = prioritySync
    const actorPositionData = { scene: actorPositionSyncController.storage.scene + 1, prioritySync: { uuid: `Remote-${Math.random().toString(10)}`, aggro: prioritySync.aggro + 1 }, actorUUID: actor.actorUUID, position: '', rotation: '' } as unknown as ActorPositionData
    const positionPacket = new ActorPositionSyncPacket(actorPositionData, modLoader.clientLobby)
    actorPositionSyncController.receiveSync(positionPacket)
    expect(setRawPosFn).toHaveBeenCalledTimes(0)
    expect(setRawRotFn).toHaveBeenCalledTimes(0)
  })

  test('given correct buffer -> getBase64 -> calls correctly toString base64', () => {
    const toStringFn = jest.fn().mockImplementation((encoding)=>{
      expect(encoding).toBe('base64')
    })
    const buffer = {
      toString: toStringFn
    } as unknown as Buffer
    actorPositionSyncController.getBase64(buffer)
  })
})
