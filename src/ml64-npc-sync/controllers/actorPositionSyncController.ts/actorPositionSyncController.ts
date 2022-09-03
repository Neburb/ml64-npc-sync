import { ActorPositionData } from '../../model/actorPositionData'
import { ActorHealthData } from '../../model/actorHealthData'
import { AbstractPacket } from '../../packets/abstractPacket'
import { ActorSyncPacket } from '../../packets/actorSyncPacket'
import { IModLoaderAPI } from 'modloader64_api/IModLoaderAPI'
import { ActorCategory } from 'modloader64_api/OOT/ActorCategory'
import { IOOTCore } from 'modloader64_api/OOT/OOTAPI'
import { ActorPositionStorage } from '../storages/actorPositionSyncStorage'
import { ACTOR_HEALTH_SYNC_PACKET_TAG } from '../../packets/actorHealthSyncPacket'
import { ActorPositionSyncPacket, ACTOR_POSITION_SYNC_PACKET_TAG } from '../../packets/actorPositionSyncPacket'
import { AbstractActorSyncController } from '../abstractActorSyncController'

export class ActorPositionSyncController extends AbstractActorSyncController {
  readonly ACTOR_CATEGORIES_TO_BE_SYNCED: ActorCategory[] = [ActorCategory.ENEMY, ActorCategory.BOSS, ActorCategory.MISC, ActorCategory.PROP_2, ActorCategory.NPC]

  storage: ActorPositionStorage = {
    scene: -1,
    actorData: {},
    prioritySync: {}
  }

  constructor (core: IOOTCore, modLoader: IModLoaderAPI) {
    super(core, modLoader, [ACTOR_HEALTH_SYNC_PACKET_TAG, ACTOR_POSITION_SYNC_PACKET_TAG])
  }

  sync (_frame: number): AbstractPacket[] {
    const packets: AbstractPacket[] = []
    if (this.didSceneChange()) {
      this.storage.actorData = {}
      this.storage.prioritySync = {}
    }
    this.ACTOR_CATEGORIES_TO_BE_SYNCED.forEach((category) => {
      this.core.actorManager.getActors(category).forEach((actor) => {
        let actorData = this.storage.actorData[actor.actorUUID]
        if (actorData === undefined || actorData == null) {
          actorData = { scene: this.storage.scene, health: actor.health, actorID: actor.actorID, actorUUID: actor.actorUUID, position: this.getBase64(actor.position.getRawPos()), rotation: this.getBase64(actor.rotation.getRawRot()) }
          this.storage.actorData[actor.actorUUID] = actorData
          this.storage.prioritySync[actor.actorUUID] = { uuid: this.modLoader.me.uuid, aggro: Math.random() }
        }
        const prioritySync = this.storage.prioritySync[actor.actorUUID]
        if (actorData.health > 0) {
          if (actor.health < actorData.health) {
            actorData.health = actor.health
            prioritySync.aggro = prioritySync.aggro + 1
          }
          if ((actorData.prioritySync == null) || actorData.prioritySync.aggro < prioritySync.aggro) {
            actorData.prioritySync = prioritySync
          }
          if (actorData.prioritySync?.uuid === this.modLoader.me.uuid) {
            actorData.position = this.getBase64(actor.position.getRawPos())
            actorData.rotation = this.getBase64(actor.rotation.getRawRot())
            packets.push(new ActorPositionSyncPacket(actorData, this.modLoader.clientLobby))
          }
        }
      })
    })
    return packets
  }

  getBase64 (buffer: Buffer): string {
    return buffer.toString('base64')
  }

  receiveSync (packet: AbstractPacket): void {
    const actorSyncPacket = packet as ActorSyncPacket
    if (actorSyncPacket.actorData.scene !== this.storage.scene) {
      return
    }
    if ('position' in actorSyncPacket.actorData) {
      this.receivePositionSync(actorSyncPacket)
    } else {
      this.receiveHealthSync(actorSyncPacket)
    }
  }

  receiveHealthSync (packet: ActorSyncPacket): void {
    const healthData = packet.actorData as ActorHealthData
    const storagePositionData = this.storage.actorData[healthData.actorUUID]
    if (healthData.health < storagePositionData.health) {
      storagePositionData.health = healthData.health
    }
  }

  receivePositionSync (packet: ActorSyncPacket): void {
    const positionData = packet.actorData as ActorPositionData
    const storagePositionData = this.storage.actorData[positionData.actorUUID]
    if (positionData.prioritySync != null && storagePositionData.prioritySync != null && positionData.prioritySync?.aggro >= storagePositionData.prioritySync?.aggro) {
      storagePositionData.prioritySync = positionData.prioritySync
      const actor = this.getActor(positionData.actorUUID)
      if (actor != null) {
        actor.position.setRawPos(Buffer.from(positionData.position, 'base64'))
        actor.rotation.setRawRot(Buffer.from(positionData.rotation, 'base64'))
      }
    }
  }
}
