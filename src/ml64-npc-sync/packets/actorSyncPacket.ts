
import { ActorData } from '../model/actorData'
import { AbstractPacket } from './abstractPacket'

export class ActorSyncPacket extends AbstractPacket {
  actorData: ActorData

  constructor (actorData: ActorData, tag: string, lobby: string) {
    super(tag, tag, lobby, true)
    this.actorData = actorData
  }
}
