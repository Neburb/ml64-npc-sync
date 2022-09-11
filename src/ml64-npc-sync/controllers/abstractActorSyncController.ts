import { AbstractPacket } from '../packets/abstractPacket'
import { ActorCategory } from 'modloader64_api/OOT/ActorCategory'
import { IActor } from 'modloader64_api/OOT/IActor'
import { AbstractController } from './abstractController'
import { ActorStorage } from './storages/actorStorage'
import { IModLoaderAPI } from 'modloader64_api/IModLoaderAPI'
import { IOOTCore } from 'modloader64_api/OOT/OOTAPI'

export abstract class AbstractActorSyncController extends AbstractController {
  readonly actorCategories: ActorCategory[]

  abstract storage: ActorStorage

  abstract sync (frame: number): AbstractPacket[]

  abstract receiveSync (packet: AbstractPacket): void

  constructor (core: IOOTCore, modLoader: IModLoaderAPI, eventHandlers: string[], actorCategories: ActorCategory[]) {
    super(core, modLoader, eventHandlers)
    this.actorCategories = actorCategories
  }

  didSceneChange (): boolean {
    if (this.core.global.scene !== this.storage.scene) {
      this.storage.scene = this.core.global.scene
      return true
    }
    return false
  }

  getActor (uuid: string): IActor | null {
    return this.actorCategories.map((category) => { return (this.core.actorManager.getActors(category).filter((actor) => actor.actorUUID === uuid)) }).filter((array) => array.length > 0).shift()?.shift() ?? null
  }
}
