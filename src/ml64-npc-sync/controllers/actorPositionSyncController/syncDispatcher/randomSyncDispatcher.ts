import { PrioritySync } from '../../../model/prioritySync'
import { AbstractSyncDispatcher } from './abstractSyncDispatcher'

export const RANDOM_RATE = 100

export class RandomSyncDispatcher extends AbstractSyncDispatcher {
  hasPriorityOver (prioritySync1: PrioritySync, prioritySync2: PrioritySync): number {
    return (Math.floor(Math.random() * RANDOM_RATE) === 0) ? 1 : 0
  }
}
