
import { ActorHealthData } from '@ml64-npc-sync/model/actorHealthData'
import { ActorSyncPacket } from './actorSyncPacket'

export const ACTOR_HEALTH_SYNC_PACKET_TAG: string = 'ActorHealthSyncPacket'

export class ActorHealthSyncPacket extends ActorSyncPacket {
  constructor (actorData: ActorHealthData, lobby: string) {
    super(actorData, ACTOR_HEALTH_SYNC_PACKET_TAG, lobby)
  }
}
