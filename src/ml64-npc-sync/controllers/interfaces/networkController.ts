import { AbstractPacket } from '../../packets/abstractPacket'
import { IOOTCore } from 'modloader64_api/OOT/OOTAPI'
import { IModLoaderAPI } from 'modloader64_api/IModLoaderAPI'

export interface INetworkController {
  core: IOOTCore

  modLoader: IModLoaderAPI

  eventHandlers: string[]

  sync: (frame: number) => AbstractPacket[]

  receiveSync: (packet: AbstractPacket) => void
}
