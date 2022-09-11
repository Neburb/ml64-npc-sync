import { ActorPositionData } from '../../../model/actorPositionData'
import { PrioritySync } from '../../../model/prioritySync'
import { IActor } from 'modloader64_api/OOT/IActor'
import { IOOTCore } from 'modloader64_api/OOT/OOTAPI'
import { ISyncDispatcher } from './interfaces/syncDispatcher'

export abstract class AbstractSyncDispatcher implements ISyncDispatcher {
  assignPriority (actorStorage: ActorPositionData, prioritySync: PrioritySync, actor: IActor, core: IOOTCore): void {
    if (actorStorage.prioritySync == null) {
      actorStorage.prioritySync = prioritySync
    }
  }

  abstract hasPriorityOver (prioritySync1: PrioritySync, prioritySync2: PrioritySync): number
}
