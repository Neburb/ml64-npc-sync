import { ActorHealthData } from '../../model/actorHealthData'
import { ActorHealthSyncPacket, ACTOR_HEALTH_SYNC_PACKET_TAG } from '../../packets/actorHealthSyncPacket'

describe('ActorHealthSyncPacket Test', () => {
  let packet: ActorHealthSyncPacket
  let actorData: ActorHealthData
  let lobby: string
  beforeEach(() => {
    actorData = { health: 100, scene: Math.random(), actorID: Math.random(), actorUUID: Math.random().toString(10) }
    packet = new ActorHealthSyncPacket(actorData, lobby)
  })
  test('given correct ActorHealthSyncPacket -> creation -> is successfully setup', () => {
    expect(packet.actorData).toBe(actorData)
    expect(packet.lobby).toBe(lobby)
    expect(packet.channel).toBe(ACTOR_HEALTH_SYNC_PACKET_TAG)
    expect(packet.packet_id).toBe(ACTOR_HEALTH_SYNC_PACKET_TAG)
  })
})
