import { IModLoaderAPI } from 'modloader64_api/IModLoaderAPI'
import { IActorManager, IGlobalContext, IOOTCore } from 'modloader64_api/OOT/OOTAPI'
import { ActorCategory } from 'modloader64_api/OOT/ActorCategory'
import { IActor } from 'modloader64_api/OOT/IActor'
import { ActorHealthSyncPacket, ACTOR_HEALTH_SYNC_PACKET_TAG } from '../../../src/ml64-npc-sync/packets/actorHealthSyncPacket'
import { ActorHealthData } from '../../../src/ml64-npc-sync/model/actorHealthData'
import { ActorPositionSyncController } from '../../../src/ml64-npc-sync/controllers/actorPositionSyncController/actorPositionSyncController'
import { ActorPositionSyncPacket, ACTOR_POSITION_SYNC_PACKET_TAG } from '../../../src/ml64-npc-sync/packets/actorPositionSyncPacket'
import { ActorPositionData } from '../../../src/ml64-npc-sync/model/actorPositionData'
import { PrioritySync } from '../../../src/ml64-npc-sync/model/prioritySync'
import { DistanceSyncDispatcher } from '../../../src/ml64-npc-sync/controllers/actorPositionSyncController/syncDispatcher/distanceSyncDispatcher'
import { RandomSyncDispatcher, RANDOM_RATE } from '../../../src/ml64-npc-sync/controllers/actorPositionSyncController/syncDispatcher/randomSyncDispatcher'
import { HealthSyncDispatcher } from '../../../src/ml64-npc-sync/controllers/actorPositionSyncController/syncDispatcher/healthSyncDispatcher'

describe('ActorPositionSyncController Test', () => {
  let actorPositionSyncController: ActorPositionSyncController
  let core: IOOTCore
  let modLoader: IModLoaderAPI
  let actorManager: IActorManager
  let getActorsFn: jest.Func
  let actors: IActor[] = []
  beforeEach(() => {
    core = {
      link: {
        position: {
          x: 0,
          y: 0,
          z: 0
        }
      }
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
    const categories = [ActorCategory.ENEMY, ActorCategory.BOSS]
    actorPositionSyncController = new ActorPositionSyncController(core, modLoader, categories, [new HealthSyncDispatcher(), new DistanceSyncDispatcher()])
    expect(actorPositionSyncController.core).toBe(core)
    expect(actorPositionSyncController.modLoader).toBe(modLoader)
    expect(actorPositionSyncController.actorCategories.length).toBe(categories.length)
    expect(actorPositionSyncController.actorCategories[0]).toBe(ActorCategory.ENEMY)
    expect(actorPositionSyncController.actorCategories[1]).toBe(ActorCategory.BOSS)
    expect(actorPositionSyncController.eventHandlers.length).toBe(2)
    expect(actorPositionSyncController.eventHandlers[0]).toBe(ACTOR_HEALTH_SYNC_PACKET_TAG)
    expect(actorPositionSyncController.eventHandlers[1]).toBe(ACTOR_POSITION_SYNC_PACKET_TAG)
    expect('prioritySync' in actorPositionSyncController.storage).toBe(true)
  })

  const createActor = (): IActor => {
    return {
      actorUUID: `UUID-${Math.random().toString(10)}`,
      actorID: Math.random(),
      health: Math.random() + 10,
      position: {
        x: 0,
        y: 0,
        z: 0,
        setRawPos: jest.fn(),
        getRawPos: jest.fn().mockReturnValue('')
      },
      rotation: {
        x: 0,
        y: 0,
        z: 0,
        setRawRot: jest.fn(),
        getRawRot: jest.fn().mockReturnValue('')
      }
    } as unknown as IActor
  }

  test('given scene being the same -> sync -> does nothing', () => {
    actorPositionSyncController.storage.scene = core.global.scene
    expect(actorPositionSyncController.storage.scene).toBe(core.global.scene)
    expect(actorPositionSyncController.sync(0).length).toBe(0)
    expect(actorPositionSyncController.storage.scene).toBe(core.global.scene)
  })

  test('given scene being different -> sync -> changes scene and restore actorData storage', () => {
    const storageIndex = 'TestStorageIndex'
    const actorPositionData = {} as unknown as ActorPositionData
    const prioritySync = { uuid: modLoader.me.uuid, distance: 0 } as unknown as PrioritySync
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
    const actor = createActor()
    actors = [actor]
    actorPositionSyncController.storage.actorData[actor.actorUUID] = { health: 0 } as unknown as ActorPositionData
    expect(actorPositionSyncController.sync(0).length).toBe(0)
  })

  test('given actor health greater than 0 and less than actor storage health and priority sync to health and position -> sync -> increases the priority by 1', () => {
    const actor = createActor()
    actors = [actor]
    const prioritySync = { priority: 1, uuid: modLoader.me.uuid, distance: 0 }
    actorPositionSyncController.storage.actorData[actor.actorUUID] = { scene: actorPositionSyncController.storage.scene, actorUUID: actor.actorUUID, health: actor.health + 1, prioritySync: { priority: prioritySync.priority + 10, uuid: `Remote-${Math.random().toString(10)}` }, position: '', rotation: '' } as unknown as ActorPositionData
    actorPositionSyncController.storage.prioritySync[actor.actorUUID] = prioritySync
    expect(prioritySync.priority).toBe(1)
    expect(actorPositionSyncController.sync(0).length).toBe(0)
    expect(prioritySync.priority).toBe(2)
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
    const prioritySync = { priority: 1, uuid: modLoader.me.uuid, distance: 0 }
    expect(actorPositionSyncController.storage.actorData[actor.actorUUID].prioritySync).toBeUndefined()
    actorPositionSyncController.storage.prioritySync[actor.actorUUID] = prioritySync
    expect(actorPositionSyncController.sync(0).length).toBe(1)
    expect(actorPositionSyncController.storage.actorData[actor.actorUUID].prioritySync).toBe(prioritySync)
  })

  test('given actor health greater than 0 and local priority greater than remote and priority sync to health and position -> sync -> sets the priority', () => {
    const actor = createActor()
    actor.position.getRawPos = jest.fn().mockImplementation(() => {
      return { toString: jest.fn() }
    })
    actor.rotation.getRawRot = jest.fn().mockImplementation(() => {
      return { toString: jest.fn() }
    })
    actors = [actor]
    const remotePrioritySync = { priority: 1, uuid: `Remote-${actor.actorUUID}` }
    actorPositionSyncController.storage.actorData[actor.actorUUID] = { scene: actorPositionSyncController.storage.scene, actorUUID: actor.actorUUID, health: actor.health, prioritySync: remotePrioritySync, position: '', rotation: '' } as unknown as ActorPositionData
    const prioritySync = { priority: remotePrioritySync.priority + 1, uuid: modLoader.me.uuid, distance: 0 }
    expect(actorPositionSyncController.storage.actorData[actor.actorUUID].prioritySync).toBe(remotePrioritySync)
    actorPositionSyncController.storage.prioritySync[actor.actorUUID] = prioritySync
    expect(actorPositionSyncController.sync(0).length).toBe(1)
    expect(actorPositionSyncController.storage.actorData[actor.actorUUID].prioritySync).toBe(prioritySync)
  })

  test('given actor health greater than 0 and local priority equals to remote and distance lesser than remote and priority sync to health and position -> sync -> sets the priority', () => {
    const actor = createActor()
    actor.position.getRawPos = jest.fn().mockImplementation(() => {
      return { toString: jest.fn() }
    })
    actor.rotation.getRawRot = jest.fn().mockImplementation(() => {
      return { toString: jest.fn() }
    })
    actors = [actor]
    const remotePrioritySync = { priority: 1, uuid: `Remote-${actor.actorUUID}`, distance: 10 }
    actorPositionSyncController.storage.actorData[actor.actorUUID] = { scene: actorPositionSyncController.storage.scene, actorUUID: actor.actorUUID, health: actor.health, prioritySync: remotePrioritySync, position: '', rotation: '' } as unknown as ActorPositionData
    const prioritySync = { priority: remotePrioritySync.priority, uuid: modLoader.me.uuid, distance: 0 }
    expect(actorPositionSyncController.storage.actorData[actor.actorUUID].prioritySync).toBe(remotePrioritySync)
    actorPositionSyncController.storage.prioritySync[actor.actorUUID] = prioritySync
    expect(actorPositionSyncController.sync(0).length).toBe(1)
    expect(actorPositionSyncController.storage.actorData[actor.actorUUID].prioritySync).toBe(prioritySync)
  })

  test('given actor health greater than 0 and local priority equals to remote and distance greater than remote and priority sync to health and position -> sync -> does not sets the priority', () => {
    const actor = createActor()
    actor.position.getRawPos = jest.fn().mockImplementation(() => {
      return { toString: jest.fn() }
    })
    actor.rotation.getRawRot = jest.fn().mockImplementation(() => {
      return { toString: jest.fn() }
    })
    actors = [actor]
    const remotePrioritySync = { priority: 1, uuid: `Remote-${actor.actorUUID}`, distance: -10 }
    actorPositionSyncController.storage.actorData[actor.actorUUID] = { scene: actorPositionSyncController.storage.scene, actorUUID: actor.actorUUID, health: actor.health, prioritySync: remotePrioritySync, position: '', rotation: '' } as unknown as ActorPositionData
    const prioritySync = { priority: remotePrioritySync.priority, uuid: modLoader.me.uuid, distance: 0 }
    expect(actorPositionSyncController.storage.actorData[actor.actorUUID].prioritySync).toBe(remotePrioritySync)
    actorPositionSyncController.storage.prioritySync[actor.actorUUID] = prioritySync
    expect(actorPositionSyncController.sync(0).length).toBe(0)
    expect(actorPositionSyncController.storage.actorData[actor.actorUUID].prioritySync).toBe(remotePrioritySync)
  })

  test('given actor health greater than 0 and priority sync to health and position -> sync -> sets the correct distance', () => {
    const actor = createActor()
    actor.position.getRawPos = jest.fn().mockImplementation(() => {
      return { toString: jest.fn() }
    })
    actor.rotation.getRawRot = jest.fn().mockImplementation(() => {
      return { toString: jest.fn() }
    })
    actors = [actor]
    const remotePrioritySync = { priority: 1, uuid: `Remote-${actor.actorUUID}`, distance: 0 }
    actorPositionSyncController.storage.actorData[actor.actorUUID] = { scene: actorPositionSyncController.storage.scene, actorUUID: actor.actorUUID, health: actor.health, prioritySync: remotePrioritySync, position: '', rotation: '' } as unknown as ActorPositionData
    const prioritySync = { priority: remotePrioritySync.priority, uuid: modLoader.me.uuid, distance: 0 }
    expect(actorPositionSyncController.storage.actorData[actor.actorUUID].prioritySync).toBe(remotePrioritySync)
    actorPositionSyncController.storage.prioritySync[actor.actorUUID] = prioritySync
    expect(actorPositionSyncController.sync(0).length).toBe(0)
    const a = DistanceSyncDispatcher.moveDecimal(actor.position.x) - DistanceSyncDispatcher.moveDecimal(core.link.position.x)
    const b = DistanceSyncDispatcher.moveDecimal(actor.position.y) - DistanceSyncDispatcher.moveDecimal(core.link.position.y)
    const c = Math.sqrt(a * a + b * b)
    expect(prioritySync.distance).toBe(c)
  })

  test('given priority sync to random -> sync -> sets the priority randomly', () => {
    const actor = createActor()
    actor.position.getRawPos = jest.fn().mockImplementation(() => {
      return { toString: jest.fn() }
    })
    actor.rotation.getRawRot = jest.fn().mockImplementation(() => {
      return { toString: jest.fn() }
    })
    actors = [actor]
    actorPositionSyncController.syncDispatchers = [new RandomSyncDispatcher()]
    const remotePrioritySync = { priority: 1, uuid: `Remote-${actor.actorUUID}`, distance: 0 }
    actorPositionSyncController.storage.actorData[actor.actorUUID] = { scene: actorPositionSyncController.storage.scene, actorUUID: actor.actorUUID, health: actor.health, prioritySync: remotePrioritySync, position: '', rotation: '' } as unknown as ActorPositionData
    const prioritySync = { priority: remotePrioritySync.priority, uuid: modLoader.me.uuid, distance: 0 }
    expect(actorPositionSyncController.storage.actorData[actor.actorUUID].prioritySync).toBe(remotePrioritySync)
    actorPositionSyncController.storage.prioritySync[actor.actorUUID] = prioritySync
    expect(RANDOM_RATE).toBe(100)
    jest.spyOn(global.Math, 'random').mockReturnValue(1)
    expect(actorPositionSyncController.sync(0).length).toBe(0)
    jest.spyOn(global.Math, 'random').mockReturnValue(0)
    expect(actorPositionSyncController.sync(0).length).toBe(1)
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
    const prioritySync = { priority: 1, uuid: modLoader.me.uuid, distance: 0 }
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

  test('given health in storage lesser than packet and priority sync to health and position -> receiveHealthSync -> does nothing', () => {
    const actor = createActor()
    actors = [actor]
    const prioritySync = { priority: 1, uuid: modLoader.me.uuid, distance: 0 }
    actorPositionSyncController.storage.actorData[actor.actorUUID] = { scene: actorPositionSyncController.storage.scene, actorUUID: actor.actorUUID, health: actor.health, prioritySync } as unknown as ActorPositionData
    expect(actorPositionSyncController.storage.actorData[actor.actorUUID].prioritySync).toBe(prioritySync)
    actorPositionSyncController.storage.prioritySync[actor.actorUUID] = prioritySync
    const actorHealthData = { actorUUID: actor.actorUUID, health: actor.health + 1 } as unknown as ActorHealthData
    const healthPacket = new ActorHealthSyncPacket(actorHealthData, modLoader.clientLobby)
    actorPositionSyncController.receiveHealthSync(healthPacket)
    expect(actorPositionSyncController.storage.actorData[actor.actorUUID].health).toBe(actor.health)
  })

  test('given health in storage greater than packet and priority sync to health and position -> receiveHealthSync -> updates health', () => {
    const actor = createActor()
    actors = [actor]
    const prioritySync = { priority: 1, uuid: modLoader.me.uuid, distance: 0 }
    actorPositionSyncController.storage.actorData[actor.actorUUID] = { scene: actorPositionSyncController.storage.scene, actorUUID: actor.actorUUID, health: actor.health, prioritySync } as unknown as ActorPositionData
    expect(actorPositionSyncController.storage.actorData[actor.actorUUID].prioritySync).toBe(prioritySync)
    actorPositionSyncController.storage.prioritySync[actor.actorUUID] = prioritySync
    const actorHealthData = { actorUUID: actor.actorUUID, health: actor.health - 1 } as unknown as ActorHealthData
    const healthPacket = new ActorHealthSyncPacket(actorHealthData, modLoader.clientLobby)
    actorPositionSyncController.receiveHealthSync(healthPacket)
    expect(actorPositionSyncController.storage.actorData[actor.actorUUID].health).toBe(actorHealthData.health)
  })

  test('given priority in packet less than one already set and priority sync set to health and position -> receivePositionSync -> ignores packet', () => {
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
    const prioritySync = { priority: Math.random() * 100, uuid: modLoader.me.uuid, distance: 0 }
    actorPositionSyncController.storage.actorData[actor.actorUUID] = { scene: actorPositionSyncController.storage.scene, actorUUID: actor.actorUUID, health: actor.health, prioritySync } as unknown as ActorPositionData
    expect(actorPositionSyncController.storage.actorData[actor.actorUUID].prioritySync).toBe(prioritySync)
    actorPositionSyncController.storage.prioritySync[actor.actorUUID] = prioritySync
    const actorPositionData = { prioritySync: { uuid: `Remote-${Math.random().toString(10)}`, priority: prioritySync.priority - 1 }, actorUUID: actor.actorUUID } as unknown as ActorPositionData
    const positionPacket = new ActorPositionSyncPacket(actorPositionData, modLoader.clientLobby)
    actorPositionSyncController.receivePositionSync(positionPacket)
    expect(actorPositionSyncController.storage.actorData[actor.actorUUID].prioritySync).toBe(prioritySync)
    expect(setRawPosFn).toHaveBeenCalledTimes(0)
  })

  test('given priority in packet greater than one already set and priority sync set to health and position -> receivePositionSync -> defines priority and updates rotation and position', () => {
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
    const prioritySync = { priority: Math.random() * 100, uuid: modLoader.me.uuid, distance: 0 }
    actorPositionSyncController.storage.actorData[actor.actorUUID] = { scene: actorPositionSyncController.storage.scene, actorUUID: actor.actorUUID, health: actor.health, prioritySync } as unknown as ActorPositionData
    expect(actorPositionSyncController.storage.actorData[actor.actorUUID].prioritySync).toBe(prioritySync)
    actorPositionSyncController.storage.prioritySync[actor.actorUUID] = prioritySync
    const actorPositionData = { prioritySync: { uuid: `Remote-${Math.random().toString(10)}`, priority: prioritySync.priority + 1, distance: 0 }, actorUUID: actor.actorUUID, position: '', rotation: '' } as unknown as ActorPositionData
    const positionPacket = new ActorPositionSyncPacket(actorPositionData, modLoader.clientLobby)
    actorPositionSyncController.receivePositionSync(positionPacket)
    expect(actorPositionSyncController.storage.actorData[actor.actorUUID].prioritySync).toBe(actorPositionData.prioritySync)
    expect(setRawPosFn).toHaveBeenCalledTimes(1)
    expect(setRawRotFn).toHaveBeenCalledTimes(1)
  })

  test('given priority in packet equals than one already set and distance less than local and priority sync set to health and position -> receivePositionSync -> defines priority and updates rotation and position', () => {
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
    const prioritySync = { priority: Math.random() * 100, distance: Math.random() * 100, uuid: modLoader.me.uuid }
    actorPositionSyncController.storage.actorData[actor.actorUUID] = { scene: actorPositionSyncController.storage.scene, actorUUID: actor.actorUUID, health: actor.health, prioritySync } as unknown as ActorPositionData
    expect(actorPositionSyncController.storage.actorData[actor.actorUUID].prioritySync).toBe(prioritySync)
    actorPositionSyncController.storage.prioritySync[actor.actorUUID] = prioritySync
    const actorPositionData = { prioritySync: { uuid: `Remote-${Math.random().toString(10)}`, priority: prioritySync.priority, distance: prioritySync.distance - 1 }, actorUUID: actor.actorUUID, position: '', rotation: '' } as unknown as ActorPositionData
    const positionPacket = new ActorPositionSyncPacket(actorPositionData, modLoader.clientLobby)
    actorPositionSyncController.receivePositionSync(positionPacket)
    expect(actorPositionSyncController.storage.actorData[actor.actorUUID].prioritySync).toBe(actorPositionData.prioritySync)
    expect(setRawPosFn).toHaveBeenCalledTimes(1)
    expect(setRawRotFn).toHaveBeenCalledTimes(1)
  })

  test('given priority in packet equals than one already set and distance greater than local and priority sync set to health and position -> receivePositionSync -> ignores packet', () => {
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
    const prioritySync = { priority: Math.random() * 100, uuid: modLoader.me.uuid, distance: Math.random() * 100 }
    actorPositionSyncController.storage.actorData[actor.actorUUID] = { scene: actorPositionSyncController.storage.scene, actorUUID: actor.actorUUID, health: actor.health, prioritySync } as unknown as ActorPositionData
    expect(actorPositionSyncController.storage.actorData[actor.actorUUID].prioritySync).toBe(prioritySync)
    actorPositionSyncController.storage.prioritySync[actor.actorUUID] = prioritySync
    const actorPositionData = { prioritySync: { uuid: `Remote-${Math.random().toString(10)}`, priority: prioritySync.priority, distance: prioritySync.distance + 1 }, actorUUID: actor.actorUUID } as unknown as ActorPositionData
    const positionPacket = new ActorPositionSyncPacket(actorPositionData, modLoader.clientLobby)
    actorPositionSyncController.receivePositionSync(positionPacket)
    expect(actorPositionSyncController.storage.actorData[actor.actorUUID].prioritySync).toBe(prioritySync)
    expect(setRawPosFn).toHaveBeenCalledTimes(0)
  })

  test('given priority in packet equals than one already and priority sync set to random -> receivePositionSync -> sets priority based on random', () => {
    actorPositionSyncController.syncDispatchers = [new RandomSyncDispatcher()]
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
    const prioritySync = { priority: Math.random() * 100, uuid: modLoader.me.uuid, distance: 0 }
    actorPositionSyncController.storage.actorData[actor.actorUUID] = { scene: actorPositionSyncController.storage.scene, actorUUID: actor.actorUUID, health: actor.health, prioritySync, position: '', rotation: '' } as unknown as ActorPositionData
    expect(actorPositionSyncController.storage.actorData[actor.actorUUID].prioritySync).toBe(prioritySync)
    actorPositionSyncController.storage.prioritySync[actor.actorUUID] = prioritySync
    const actorPositionData = { prioritySync: { uuid: `Remote-${Math.random().toString(10)}`, priority: prioritySync.priority, distance: prioritySync.distance }, actorUUID: actor.actorUUID, position: '', rotation: '' } as unknown as ActorPositionData
    const positionPacket = new ActorPositionSyncPacket(actorPositionData, modLoader.clientLobby)
    jest.spyOn(global.Math, 'random').mockReturnValue(1)
    actorPositionSyncController.receivePositionSync(positionPacket)
    expect(actorPositionSyncController.storage.actorData[actor.actorUUID].prioritySync).toBe(prioritySync)
    expect(setRawPosFn).toHaveBeenCalledTimes(0)
    expect(setRawRotFn).toHaveBeenCalledTimes(0)
    jest.spyOn(global.Math, 'random').mockReturnValue(0)
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
    const prioritySync = { priority: Math.random() * 100, uuid: modLoader.me.uuid, distance: 0 }
    actorPositionSyncController.storage.actorData[actor.actorUUID] = { scene: actorPositionSyncController.storage.scene, actorUUID: actor.actorUUID, health: actor.health, prioritySync } as unknown as ActorPositionData
    expect(actorPositionSyncController.storage.actorData[actor.actorUUID].prioritySync).toBe(prioritySync)
    actorPositionSyncController.storage.prioritySync[actor.actorUUID] = prioritySync
    const actorPositionData = { scene: actorPositionSyncController.storage.scene, prioritySync: { uuid: `Remote-${Math.random().toString(10)}`, priority: prioritySync.priority + 1 }, actorUUID: actor.actorUUID, position: '', rotation: '' } as unknown as ActorPositionData
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
    const prioritySync = { priority: Math.random() * 100, uuid: modLoader.me.uuid, distance: 0 }
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
    const prioritySync = { priority: Math.random() * 100, uuid: modLoader.me.uuid, distance: 0 }
    actorPositionSyncController.storage.actorData[actor.actorUUID] = { scene: actorPositionSyncController.storage.scene, actorUUID: actor.actorUUID, health: actor.health, prioritySync } as unknown as ActorPositionData
    expect(actorPositionSyncController.storage.actorData[actor.actorUUID].prioritySync).toBe(prioritySync)
    actorPositionSyncController.storage.prioritySync[actor.actorUUID] = prioritySync
    const actorPositionData = { scene: actorPositionSyncController.storage.scene + 1, prioritySync: { uuid: `Remote-${Math.random().toString(10)}`, priority: prioritySync.priority + 1 }, actorUUID: actor.actorUUID, position: '', rotation: '' } as unknown as ActorPositionData
    const positionPacket = new ActorPositionSyncPacket(actorPositionData, modLoader.clientLobby)
    actorPositionSyncController.receiveSync(positionPacket)
    expect(setRawPosFn).toHaveBeenCalledTimes(0)
    expect(setRawRotFn).toHaveBeenCalledTimes(0)
  })

  test('given correct buffer -> getBase64 -> calls correctly toString base64', () => {
    const toStringFn = jest.fn().mockImplementation((encoding) => {
      expect(encoding).toBe('base64')
    })
    const buffer = {
      toString: toStringFn
    } as unknown as Buffer
    actorPositionSyncController.getBase64(buffer)
  })
})
