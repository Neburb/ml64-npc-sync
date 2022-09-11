import { ActorPositionData } from '../../../model/actorPositionData'
import { PrioritySync } from '../../../model/prioritySync'
import { IActor } from 'modloader64_api/OOT/IActor'
import { IOOTCore } from 'modloader64_api/OOT/OOTAPI'
import { AbstractSyncDispatcher } from './abstractSyncDispatcher'

export const NUMBER_OF_POSITION_DECIMALS = 17

export class DistanceSyncDispatcher extends AbstractSyncDispatcher {
  assignPriority (actorStorage: ActorPositionData, prioritySync: PrioritySync, actor: IActor, core: IOOTCore): void {
    super.assignPriority(actorStorage, prioritySync, actor, core)
    const actorPosition = actor.position
    const linkPosition = core.link.position
    const a = DistanceSyncDispatcher.moveDecimal(actorPosition.x) - DistanceSyncDispatcher.moveDecimal(linkPosition.x)
    const b = DistanceSyncDispatcher.moveDecimal(actorPosition.y) - DistanceSyncDispatcher.moveDecimal(linkPosition.y)
    const c = Math.sqrt(a * a + b * b)
    prioritySync.distance = c
  }

  hasPriorityOver (prioritySync1: PrioritySync, prioritySync2: PrioritySync): number {
    return prioritySync2.distance - prioritySync1.distance
  }

  static moveDecimal (n: number): number {
    return n / Math.pow(10, NUMBER_OF_POSITION_DECIMALS)
  }
}
