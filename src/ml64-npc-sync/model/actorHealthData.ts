import { ActorCategory } from 'modloader64_api/OOT/ActorCategory'
import { ActorData } from './actorData'

export interface ActorHealthData extends ActorData {
  health: number
  category: ActorCategory
}
