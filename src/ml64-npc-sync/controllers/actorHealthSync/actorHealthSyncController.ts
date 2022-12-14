import { ActorHealthData } from '../../model/actorHealthData'
import { AbstractPacket } from '../../packets/abstractPacket'
import { ActorHealthSyncPacket, ACTOR_HEALTH_SYNC_PACKET_TAG } from '../../packets/actorHealthSyncPacket'
import { IModLoaderAPI } from 'modloader64_api/IModLoaderAPI'
import { ActorCategory } from 'modloader64_api/OOT/ActorCategory'
import { IOOTCore } from 'modloader64_api/OOT/OOTAPI'
import { ActorHealthStorage } from '../storages/actorHealthStorage'
import { AbstractActorSyncController } from '../abstractActorSyncController'
import { HealthSyncMode } from './healthSyncMode'

export class ActorHealthSyncController extends AbstractActorSyncController {
  healthSyncMode: HealthSyncMode

  storage: ActorHealthStorage = {
    scene: -1,
    actorData: {}
  }

  constructor (core: IOOTCore, modLoader: IModLoaderAPI, actorCategories: ActorCategory[], healthSyncMode: HealthSyncMode) {
    super(core, modLoader, [ACTOR_HEALTH_SYNC_PACKET_TAG], actorCategories)
    this.healthSyncMode = healthSyncMode
  }

  sync (_frame: number): AbstractPacket[] {
    const packets: AbstractPacket[] = []
    if (this.didSceneChange()) {
      this.storage.actorData = {}
    }
    this.actorCategories.forEach((category) => {
      this.core.actorManager.getActors(category).forEach((actor) => {
        let actorData = this.storage.actorData[actor.actorUUID]
        if (actorData === undefined || actorData == null) {
          actorData = { scene: this.storage.scene, actorID: actor.actorID, actorUUID: actor.actorUUID, health: actor.health, category }
          this.storage.actorData[actor.actorUUID] = actorData
        }
        if (actorData.health > 0) {
          if (actorData.health !== actor.health) {
            actorData.health = actor.health
            packets.push(new ActorHealthSyncPacket(actorData, this.modLoader.clientLobby))
          }
        }
      })
    })
    return packets
  }

  receiveSync (packet: AbstractPacket): void {
    const healthPacket = packet as ActorHealthSyncPacket
    if (healthPacket.actorData.scene !== this.storage.scene) {
      return
    }

    const actorData = healthPacket.actorData as ActorHealthData

    if (!this.actorCategories.includes(actorData.category)) {
      return
    }

    const actor = this.getActor(healthPacket.actorData.actorUUID)
    if (actor !== undefined && actor != null) {
      if (actor.health < actorData.health) {
        actorData.health = actor.health
        this.modLoader.clientSide.sendPacket(new ActorHealthSyncPacket(actorData, this.modLoader.clientLobby))
      } else {
        this.storage.actorData[healthPacket.actorData.actorUUID] = actorData
        actor.health = actorData.health
        if (actorData.health <= 0 && this.healthSyncMode === HealthSyncMode.HealthAndDeath) {
          actor.destroy()
        }
      }
    } else {
      const actorStorageData = this.storage.actorData[healthPacket.actorData.actorUUID]
      if (actorStorageData !== undefined && actorData.category === actorStorageData.category) {
        actorData.health = 0
        this.modLoader.clientSide.sendPacket(new ActorHealthSyncPacket(actorData, this.modLoader.clientLobby))
      }
    }
  }
}
