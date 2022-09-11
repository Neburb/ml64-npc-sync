import { ActorPositionData } from '../../../model/actorPositionData'
import { PrioritySync } from '../../../model/prioritySync'
import { IActor } from 'modloader64_api/OOT/IActor'
import { IOOTCore } from 'modloader64_api/OOT/OOTAPI'
import { AbstractSyncDispatcher } from './abstractSyncDispatcher'

export const RANDOM_RATE = 100

export class RandomSyncDispatcher extends AbstractSyncDispatcher {
  assignPriority (actorStorage: ActorPositionData, prioritySync: PrioritySync, actor: IActor, core: IOOTCore): void {
    super.assignPriority(actorStorage, prioritySync, actor, core)
  }

  hasPriorityOver (prioritySync1: PrioritySync, prioritySync2: PrioritySync): number {
    return (Math.floor(Math.random() * RANDOM_RATE) === 0) ? 1 : 0
  }
}
