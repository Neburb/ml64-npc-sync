import { DistanceSyncDispatcher, NUMBER_OF_POSITION_DECIMALS } from '../../../../src/ml64-npc-sync/controllers/actorPositionSyncController/syncDispatcher/distanceSyncDispatcher'

describe('DistanceSyncDispatcher Test', () => {
  beforeEach(() => { })

  test('given correct number -> moveDecimal -> move the correct number of decimals', () => {
    expect(NUMBER_OF_POSITION_DECIMALS).toBe(17)
    const randomNumber = Math.random()
    expect(DistanceSyncDispatcher.moveDecimal(randomNumber * Math.pow(10, NUMBER_OF_POSITION_DECIMALS))).toBeCloseTo(randomNumber)
  })
})
