import { ActorPositionData } from '../../../../model/actorPositionData'
import { PrioritySync } from '../../../../model/prioritySync'
import { IActor } from 'modloader64_api/OOT/IActor'
import { IOOTCore } from 'modloader64_api/OOT/OOTAPI'

export interface ISyncDispatcher {
  assignPriority: (actorStorage: ActorPositionData, prioritySync: PrioritySync, actor: IActor, core: IOOTCore) => void
  hasPriorityOver: (prioritySync1: PrioritySync, prioritySync2: PrioritySync) => number
}
