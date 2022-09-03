import { AbstractPacket } from '../packets/abstractPacket'
import { IModLoaderAPI } from 'modloader64_api/IModLoaderAPI'
import { IOOTCore } from 'modloader64_api/OOT/OOTAPI'
import { INetworkController } from './interfaces/networkController'

export abstract class AbstractController implements INetworkController {
  core: IOOTCore

  modLoader: IModLoaderAPI

  eventHandlers: string[]

  constructor (core: IOOTCore, modLoader: IModLoaderAPI, eventHandlers: string[]) {
    this.core = core
    this.modLoader = modLoader
    this.eventHandlers = eventHandlers
  }

  abstract sync (frame: number): AbstractPacket[]

  abstract receiveSync (packet: AbstractPacket): void
}
