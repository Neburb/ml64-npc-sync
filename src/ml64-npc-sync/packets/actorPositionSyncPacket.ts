
import { ActorHealthData } from '@ml64-npc-sync/model/actorHealthData'
import { ActorSyncPacket } from './actorSyncPacket'

export const ACTOR_POSITION_SYNC_PACKET_TAG: string = 'ActorPositionSyncPacket'

export class ActorPositionSyncPacket extends ActorSyncPacket {
  constructor (actorData: ActorHealthData, lobby: string) {
    super(actorData, ACTOR_POSITION_SYNC_PACKET_TAG, lobby)
  }
}
