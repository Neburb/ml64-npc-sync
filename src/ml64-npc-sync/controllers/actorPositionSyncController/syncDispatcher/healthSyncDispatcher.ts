import { ActorPositionData } from '../../../model/actorPositionData'
import { PrioritySync } from '../../../model/prioritySync'
import { IActor } from 'modloader64_api/OOT/IActor'
import { IOOTCore } from 'modloader64_api/OOT/OOTAPI'
import { AbstractSyncDispatcher } from './abstractSyncDispatcher'

export const NUMBER_OF_POSITION_DECIMALS = 17

export class HealthSyncDispatcher extends AbstractSyncDispatcher {
  assignPriority (actorStorage: ActorPositionData, prioritySync: PrioritySync, actor: IActor, core: IOOTCore): void {
    super.assignPriority(actorStorage, prioritySync, actor, core)
    if (actor.health < actorStorage.health) {
      actorStorage.health = actor.health
      prioritySync.priority = prioritySync.priority + 1
    }
  }

  hasPriorityOver (prioritySync1: PrioritySync, prioritySync2: PrioritySync): number {
    return prioritySync1.priority - prioritySync2.priority
  }
}
