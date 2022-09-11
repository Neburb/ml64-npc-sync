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
import { PositionSyncMode } from './positionSyncMode'

export const NUMBER_OF_POSITION_DECIMALS = 17
export const RANDOM_RATE = 100
const EXPORT_ENCODING = 'base64'

export class ActorPositionSyncController extends AbstractActorSyncController {
  positionSyncMode: PositionSyncMode

  storage: ActorPositionStorage = {
    scene: -1,
    actorData: {},
    prioritySync: {}
  }

  constructor (core: IOOTCore, modLoader: IModLoaderAPI, positionSyncMode: PositionSyncMode, actorCategories: ActorCategory[]) {
    super(core, modLoader, [ACTOR_HEALTH_SYNC_PACKET_TAG, ACTOR_POSITION_SYNC_PACKET_TAG], actorCategories)
    this.positionSyncMode = positionSyncMode
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
          actorData = { scene: this.storage.scene, health: actor.health, actorID: actor.actorID, actorUUID: actor.actorUUID, position: this.getBase64(actor.position.getRawPos()), rotation: this.getBase64(actor.rotation.getRawRot()) }
          this.storage.actorData[actor.actorUUID] = actorData
          this.storage.prioritySync[actor.actorUUID] = { uuid: this.modLoader.me.uuid, priority: 0, distance: 0 }
        }
        const prioritySync = this.storage.prioritySync[actor.actorUUID]
        if (actorData.health > 0) {
          if (actorData.prioritySync == null) {
            actorData.prioritySync = prioritySync
          } else {
            switch (this.positionSyncMode) {
              case PositionSyncMode.PositionAndHealth: {
                if (actor.health < actorData.health) {
                  actorData.health = actor.health
                  prioritySync.priority = prioritySync.priority + 1
                } else {
                  const actorPosition = actor.position
                  const linkPosition = this.core.link.position
                  const a = ActorPositionSyncController.moveDecimal(actorPosition.x) - ActorPositionSyncController.moveDecimal(linkPosition.x)
                  const b = ActorPositionSyncController.moveDecimal(actorPosition.y) - ActorPositionSyncController.moveDecimal(linkPosition.y)
                  const c = Math.sqrt(a * a + b * b)
                  prioritySync.distance = c
                }
                if (actorData.prioritySync.priority === prioritySync.priority) {
                  if (actorData.prioritySync.distance > prioritySync.distance) {
                    actorData.prioritySync = prioritySync
                  }
                } else if (actorData.prioritySync.priority < prioritySync.priority) {
                  actorData.prioritySync = prioritySync
                }
                break
              }
              case PositionSyncMode.Random: {
                const rand = Math.floor(Math.random() * RANDOM_RATE)
                if (rand === 0) {
                  prioritySync.priority = actorData.prioritySync?.priority + 1
                  actorData.prioritySync = prioritySync
                }
                break
              }
            }
          }
          if (actorData.prioritySync?.uuid === this.modLoader.me.uuid) {
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

  static moveDecimal (n: number): number {
    return n / Math.pow(10, NUMBER_OF_POSITION_DECIMALS)
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
    if (healthData.health < storagePositionData.health) {
      storagePositionData.health = healthData.health
    }
  }

  receivePositionSync (packet: ActorSyncPacket): void {
    const positionData = packet.actorData as ActorPositionData
    const storagePositionData = this.storage.actorData[positionData.actorUUID]
    if (positionData.prioritySync != null && storagePositionData.prioritySync != null) {
      if (positionData.prioritySync?.priority === storagePositionData.prioritySync?.priority) {
        if (this.positionSyncMode === PositionSyncMode.Random) {
          return
        }
        if (positionData.prioritySync?.distance > storagePositionData.prioritySync?.distance) {
          return
        }
      } else if (positionData.prioritySync?.priority < storagePositionData.prioritySync?.priority) {
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
