import { onTick, Preinit } from 'modloader64_api/PluginLifecycle'
import { InjectCore } from 'modloader64_api/CoreInjection'
import { IModLoaderAPI } from 'modloader64_api/IModLoaderAPI'
import { ModLoaderAPIInject } from 'modloader64_api/ModLoaderAPIInjector'
import { NetworkHandler } from 'modloader64_api/NetworkHandler'
import { IOOTCore } from 'modloader64_api/OOT/OOTAPI'
import { INetworkController } from './controllers/interfaces/networkController'
import { getControllers } from './controllers'
import { AbstractPacket } from './packets/abstractPacket'
import { ACTOR_HEALTH_SYNC_PACKET_TAG } from './packets/actorHealthSyncPacket'
import { ACTOR_POSITION_SYNC_PACKET_TAG } from './packets/actorPositionSyncPacket'

export class ActorSyncClient {
  @InjectCore()
    core!: IOOTCore

  @ModLoaderAPIInject()
    modLoader!: IModLoaderAPI

  controllers!: INetworkController[]

  @Preinit()
  preinit (): void {
    this.controllers = getControllers(this.core, this.modLoader)
    console.log('Pre-init of actor sync')
  }

  @onTick()
  onTick (frame: number): void {
    if (this.core.helper.isTitleScreen()) {
      return
    }
    this.controllers.map((controller) => { return controller.sync(frame) }).reduce((accumulator, value) => accumulator.concat(value), []).forEach((packet) => {
      this.modLoader.clientSide.sendPacket(packet)
    })
  }

  @NetworkHandler(ACTOR_POSITION_SYNC_PACKET_TAG)
  receivePSync (packet: AbstractPacket): void {
    this.controllers.forEach((controller) => {
      if (controller.eventHandlers.includes(packet.channel)) {
        controller.receiveSync(packet)
      }
    })
  }

  @NetworkHandler(ACTOR_HEALTH_SYNC_PACKET_TAG)
  receiveHSync (packet: AbstractPacket): void {
    this.controllers.forEach((controller) => {
      if (controller.eventHandlers.includes(packet.channel)) {
        controller.receiveSync(packet)
      }
    })
  }
}
