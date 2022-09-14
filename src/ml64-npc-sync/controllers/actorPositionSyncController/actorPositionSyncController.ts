import { ActorPositionData } from '../../model/actorPositionData'
import { ActorHealthData } from '../../model/actorHealthData'
import { AbstractPacket } from '../../packets/abstractPacket'
import { ActorSyncPacket } from '../../packets/actorSyncPacket'
import { IModLoaderAPI } from 'modloader64_api/IModLoaderAPI'
import { ActorCategory } from 'modloader64_api/OOT/ActorCategory'
import { IOOTCore } from 'modloader64_api/OOT/OOTAPI'
import { ActorPositionStorage } from '../storages/actorPositionStorage'
import { ACTOR_HEALTH_SYNC_PACKET_TAG } from '../../packets/actorHealthSyncPacket'
import { ActorPositionSyncPacket, ACTOR_POSITION_SYNC_PACKET_TAG } from '../../packets/actorPositionSyncPacket'
import { AbstractActorSyncController } from '../abstractActorSyncController'
import { ISyncDispatcher } from './syncDispatcher/interfaces/syncDispatcher'

const EXPORT_ENCODING = 'base64'

export class ActorPositionSyncController extends AbstractActorSyncController {
  syncDispatchers: ISyncDispatcher[]

  storage: ActorPositionStorage = {
    scene: -1,
    actorData: {},
    prioritySync: {}
  }

  constructor (core: IOOTCore, modLoader: IModLoaderAPI, actorCategories: ActorCategory[], syncDispatchers: ISyncDispatcher[]) {
    super(core, modLoader, [ACTOR_HEALTH_SYNC_PACKET_TAG, ACTOR_POSITION_SYNC_PACKET_TAG], actorCategories)
    this.syncDispatchers = syncDispatchers
  }

  sync (_frame: number): AbstractPacket[] {
    const packets: AbstractPacket[] = []
    if (this.didSceneChange()) {
      this.storage.actorData = {}
      this.storage.prioritySync = {}
    }
    this.actorCategories.forEach((category) => {
      this.core.actorManager.getActors(category).forEach((actor) => {
        let actorData = this.storage.actorData[actor.actorUUID]
        if (actorData === undefined || actorData == null) {
          actorData = { scene: this.storage.scene, health: actor.health, actorID: actor.actorID, actorUUID: actor.actorUUID, category, position: this.getBase64(actor.position.getRawPos()), rotation: this.getBase64(actor.rotation.getRawRot()) }
          this.storage.actorData[actor.actorUUID] = actorData
          this.storage.prioritySync[actor.actorUUID] = { uuid: this.modLoader.me.uuid, priority: 0, distance: Number.MAX_SAFE_INTEGER }
        }
        const prioritySync = this.storage.prioritySync[actor.actorUUID]
        if (actorData.health > 0) {
          this.syncDispatchers.forEach((dispatcher) => {
            dispatcher.assignPriority(actorData, prioritySync, actor, this.core)
          })
          this.syncDispatchers.forEach((dispatcher) => {
            if (actorData.prioritySync != null && prioritySync !== actorData.prioritySync) {
              const priority = dispatcher.hasPriorityOver(prioritySync, actorData.prioritySync)
              if (priority < 0) {
                return true
              }
              if (priority > 0) {
                actorData.prioritySync = prioritySync
                return true
              }
            }
          })
          if (actorData.prioritySync?.uuid === this.modLoader.me.uuid) {
            actorData.prioritySync = prioritySync
            actorData.position = this.getBase64(actor.position.getRawPos())
            actorData.rotation = this.getBase64(actor.rotation.getRawRot())
            packets.push(new ActorPositionSyncPacket(actorData, this.modLoader.clientLobby))
          } else {
            actor.position.setRawPos(Buffer.from(actorData.position, EXPORT_ENCODING))
            actor.rotation.setRawRot(Buffer.from(actorData.rotation, EXPORT_ENCODING))
          }
        }
      })
    })
    return packets
  }

  getBase64 (buffer: Buffer): string {
    return buffer.toString(EXPORT_ENCODING)
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
    if (storagePositionData != null && healthData.health < storagePositionData.health) {
      storagePositionData.health = healthData.health
    }
  }

  receivePositionSync (packet: ActorSyncPacket): void {
    const positionData = packet.actorData as ActorPositionData
    const storagePositionData = this.storage.actorData[positionData.actorUUID]
    if (storagePositionData != null && positionData.prioritySync != null && storagePositionData.prioritySync != null) {
      let hasPriority = false
      if (positionData.prioritySync.uuid === storagePositionData.prioritySync.uuid) {
        hasPriority = true
      } else {
        this.syncDispatchers.forEach((dispatcher) => {
          if (positionData.prioritySync != null && storagePositionData.prioritySync != null) {
            const priority = dispatcher.hasPriorityOver(positionData.prioritySync, storagePositionData.prioritySync)
            if (priority < 0) {
              return true
            }
            if (priority > 0) {
              hasPriority = true
              return true
            }
          }
        })
      }
      if (!hasPriority) {
        return
      }
      storagePositionData.prioritySync = positionData.prioritySync
      const actor = this.getActor(positionData.actorUUID)
      if (actor != null) {
        storagePositionData.position = positionData.position
        storagePositionData.rotation = positionData.rotation
        actor.position.setRawPos(Buffer.from(positionData.position, EXPORT_ENCODING))
        actor.rotation.setRawRot(Buffer.from(positionData.rotation, EXPORT_ENCODING))
      }
    }
  }
}
