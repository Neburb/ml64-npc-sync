import { ActorHealthData } from '../../model/actorHealthData'
import { ActorStorage } from './actorStorage'

export interface ActorHealthStorage extends ActorStorage {
  actorData: {
    [id: string]: ActorHealthData
  }
}
