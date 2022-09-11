import { IModLoaderAPI } from 'modloader64_api/IModLoaderAPI'
import { IOOTCore, IOotHelper } from 'modloader64_api/OOT/OOTAPI'
import { ActorHealthSyncController } from '../../src/ml64-npc-sync/controllers/actorHealthSync/actorHealthSyncController'
import { ActorSyncClient } from '../../src/ml64-npc-sync/clients/ActorSyncClient'
import { ActorPositionSyncController } from '../../src/ml64-npc-sync/controllers/actorPositionSyncController.ts/actorPositionSyncController'
import { INetworkController } from '../../src/ml64-npc-sync/controllers/interfaces/networkController'
import { ActorHealthSyncPacket, ACTOR_HEALTH_SYNC_PACKET_TAG } from '../../src/ml64-npc-sync/packets/actorHealthSyncPacket'
import { ActorHealthData } from '../../src/ml64-npc-sync/model/actorHealthData'
import { INetworkClient } from 'modloader64_api/NetworkHandler'
import { ACTOR_POSITION_SYNC_PACKET_TAG } from '../../src/ml64-npc-sync/packets/actorPositionSyncPacket'

describe('ActorSyncClient Test', () => {
  let actorSyncClient: ActorSyncClient
  let core: IOOTCore
  let modLoader: IModLoaderAPI
  beforeEach(() => {
    core = {
    } as unknown as IOOTCore
    modLoader = {
      clientLobby: `Lobby-${Math.random().toString(10)}`
    } as unknown as IModLoaderAPI
    actorSyncClient = new ActorSyncClient()
    actorSyncClient.core = core
    actorSyncClient.modLoader = modLoader
    expect(actorSyncClient.core).toBe(core)
    expect(actorSyncClient.modLoader).toBe(modLoader)
  })

  test('preinit -> correctly setup controllers', () => {
    actorSyncClient.preinit()
    expect(actorSyncClient.controllers.length).toBe(4)
    expect(actorSyncClient.controllers[0]).toBeInstanceOf(ActorHealthSyncController)
    expect(actorSyncClient.controllers[0].core).toBe(core)
    expect(actorSyncClient.controllers[0].modLoader).toBe(modLoader)
    expect(actorSyncClient.controllers[1]).toBeInstanceOf(ActorHealthSyncController)
    expect(actorSyncClient.controllers[1].core).toBe(core)
    expect(actorSyncClient.controllers[1].modLoader).toBe(modLoader)
    expect(actorSyncClient.controllers[2]).toBeInstanceOf(ActorPositionSyncController)
    expect(actorSyncClient.controllers[2].core).toBe(core)
    expect(actorSyncClient.controllers[2].modLoader).toBe(modLoader)
    expect(actorSyncClient.controllers[3]).toBeInstanceOf(ActorPositionSyncController)
    expect(actorSyncClient.controllers[3].core).toBe(core)
    expect(actorSyncClient.controllers[3].modLoader).toBe(modLoader)
  })

  test('given title screen -> onTick -> does nothing', () => {
    const mapFn = jest.fn()
    actorSyncClient.controllers = {
      map: mapFn
    } as unknown as INetworkController[]
    core.helper = {
      isTitleScreen: jest.fn().mockReturnValue(true)
    } as unknown as IOotHelper
    actorSyncClient.onTick(0)
    expect(mapFn).toHaveBeenCalledTimes(0)
  })

  test('given not title screen -> onTick -> process and send packets', () => {
    const actorData = { health: 0 } as unknown as ActorHealthData
    const packet = new ActorHealthSyncPacket(actorData, 'Lobby')
    const packets = [[packet], [packet, packet]]
    const mapFn = jest.fn().mockImplementation(() => {
      return packets
    })
    actorSyncClient.controllers = {
      map: mapFn
    } as unknown as INetworkController[]
    core.helper = {
      isTitleScreen: jest.fn().mockReturnValue(false)
    } as unknown as IOotHelper
    const sendPacketFn = jest.fn().mockImplementation((receivedPacket) => {
      expect(receivedPacket).toBe(packet)
    })
    modLoader.clientSide = {
      sendPacket: sendPacketFn
    } as unknown as INetworkClient
    actorSyncClient.onTick(0)
    expect(mapFn).toHaveBeenCalledTimes(1)
    expect(sendPacketFn).toHaveBeenCalledTimes(3)
  })

  test('given controller with event handler on list -> receiveSync -> process controllers with correct packet', () => {
    core.helper = {
      isTitleScreen: jest.fn().mockReturnValue(false)
    } as unknown as IOotHelper
    const actorData = { health: 0 } as unknown as ActorHealthData
    const packet = new ActorHealthSyncPacket(actorData, 'Lobby')
    const receiveSyncFn = jest.fn().mockImplementation((receivedPacket) => {
      expect(receivedPacket).toBe(packet)
    })
    const dummyController = {
      receiveSync: receiveSyncFn,
      eventHandlers: [ACTOR_HEALTH_SYNC_PACKET_TAG]
    } as unknown as INetworkController
    actorSyncClient.controllers = [dummyController]
    actorSyncClient.receiveSync(packet)
    expect(receiveSyncFn).toHaveBeenCalledTimes(1)
  })

  test('given controller with event handler not on list -> receiveSync -> ignores controller', () => {
    core.helper = {
      isTitleScreen: jest.fn().mockReturnValue(false)
    } as unknown as IOotHelper
    const actorData = { health: 0 } as unknown as ActorHealthData
    const packet = new ActorHealthSyncPacket(actorData, 'Lobby')
    const receiveSyncFn = jest.fn().mockImplementation((receivedPacket) => {
      expect(receivedPacket).toBe(packet)
    })
    const dummyController = {
      receiveSync: receiveSyncFn,
      eventHandlers: [ACTOR_POSITION_SYNC_PACKET_TAG]
    } as unknown as INetworkController
    actorSyncClient.controllers = [dummyController]
    actorSyncClient.receiveSync(packet)
    expect(receiveSyncFn).toHaveBeenCalledTimes(0)
  })
})
