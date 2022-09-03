import { ActorPositionData } from '../../src/ml64-npc-sync/model/actorPositionData'
import { ActorPositionSyncPacket, ACTOR_POSITION_SYNC_PACKET_TAG } from '../../src/ml64-npc-sync/packets/actorPositionSyncPacket'

describe('ActorHealthSyncPacket Test', () => {
  let packet: ActorPositionSyncPacket
  let actorData: ActorPositionData
  let lobby: string
  beforeEach(() => {
    actorData = { health: 100, scene: Math.random(), actorID: Math.random(), actorUUID: Math.random().toString(10), position: Math.random().toString(10), rotation: Math.random().toString(10) }
    packet = new ActorPositionSyncPacket(actorData, lobby)
  })
  test('given correct ActorHealthSyncPacket -> creation -> is successfully setup', () => {
    expect(packet.actorData).toBe(actorData)
    expect(packet.lobby).toBe(lobby)
    expect(packet.channel).toBe(ACTOR_POSITION_SYNC_PACKET_TAG)
    expect(packet.packet_id).toBe(ACTOR_POSITION_SYNC_PACKET_TAG)
  })
})
