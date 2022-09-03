import { PrioritySync } from '../../model/prioritySync'
import { ActorPositionData } from '../../model/actorPositionData'
import { ActorStorage } from './actorStorage'

export interface ActorPositionStorage extends ActorStorage {
  actorData: {
    [id: string]: ActorPositionData
  }
  prioritySync: {
    [id: string]: PrioritySync
  }
}
