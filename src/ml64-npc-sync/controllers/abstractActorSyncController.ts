import { AbstractPacket } from '../packets/abstractPacket'
import { ActorCategory } from 'modloader64_api/OOT/ActorCategory'
import { IActor } from 'modloader64_api/OOT/IActor'
import { AbstractController } from './abstractController'
import { ActorStorage } from './storages/actorStorage'

export abstract class AbstractActorSyncController extends AbstractController {
  abstract readonly ACTOR_CATEGORIES_TO_BE_SYNCED: ActorCategory[]

  abstract storage: ActorStorage

  abstract sync (frame: number): AbstractPacket[]

  abstract receiveSync (packet: AbstractPacket): void

  didSceneChange (): boolean {
    if (this.core.global.scene !== this.storage.scene) {
      this.storage.scene = this.core.global.scene
      return true
    }
    return false
  }

  getActor (uuid: string): IActor | null {
    return this.ACTOR_CATEGORIES_TO_BE_SYNCED.map((category) => { return (this.core.actorManager.getActors(category).filter((actor) => actor.actorUUID === uuid)) }).filter((array) => array.length > 0).shift()?.shift() ?? null
  }
}
