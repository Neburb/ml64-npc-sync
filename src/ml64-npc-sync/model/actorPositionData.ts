import { ActorHealthData } from './actorHealthData'
import { PrioritySync } from './prioritySync'

export interface ActorPositionData extends ActorHealthData {
  prioritySync?: PrioritySync
  position: string
  rotation: string
}
