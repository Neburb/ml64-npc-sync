import { SidedProxy, ProxySide } from 'modloader64_api/SidedProxy/SidedProxy'
import { ActorSyncClient } from './ActorSyncClient'

export default class Main {
  @SidedProxy(ProxySide.CLIENT, ActorSyncClient)
    client!: ActorSyncClient
}
