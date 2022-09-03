import { IModLoaderAPI } from 'modloader64_api/IModLoaderAPI'
import { IOOTCore } from 'modloader64_api/OOT/OOTAPI'
import { AbstractController } from '../../controllers/abstractController'
import { AbstractPacket } from '../../packets/abstractPacket'

class DummyController extends AbstractController {
  sync (frame: number): AbstractPacket[] {
    throw new Error('Method not implemented.')
  }

  receiveSync (packet: AbstractPacket): void {
    throw new Error('Method not implemented.')
  }
}

describe('AbstractController Test', () => {
  let abstractController: AbstractController
  let core: IOOTCore
  let modLoader: IModLoaderAPI
  let eventHandlers: string[]
  beforeEach(() => {
    core = {
    } as unknown as IOOTCore
    modLoader = {
    } as unknown as IModLoaderAPI
    eventHandlers = [Math.random().toString(10), Math.random().toString(10)]
    abstractController = new DummyController(core, modLoader, eventHandlers)
  })
  test('given correct AbstractController -> creation -> is successfully setup', () => {
    expect(abstractController.core).toBe(core)
    expect(abstractController.modLoader).toBe(modLoader)
    expect(abstractController.eventHandlers).toBe(eventHandlers)
  })
})
