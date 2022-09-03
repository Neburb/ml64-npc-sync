# ML64 NPC Sync

Mod for ML64 to sync different attributes between NPCs

## Supported games

- Ocarina of Time

## Attributes synced

### Health

Health is synced in a way that, whoever kills that enemy, the death animation will be run. The other synced players will just have that enemy destroyed.
If someone enters an area with already dead enemies, the enemies will be automatically destroyed.
Bosses and mini-bosses should work too (Tested with mini-bossed, not yet with bosses)

### Position and rotation

I had to sync this based on a virtual `aggro` attribute. Whoever has the greatest aggro is the one that has the enemy synced

- Every player that enters in an area receives an aggro from each enemy from 0 -> 1 (With decimals). That means that intact enemies will be randomly synced by players
- If you hit an enemy, you'll increase that enemy's aggro by 1 point. That means that you'll sync that enemy, until another players hit it the same or more times than you

Regular NPCs are also synced, but due to not being able to hit them, they are just randomly synced by all players.

Syncing can get a bit yanking. Syncing definitely works with the position and rotation, but if you're not the one syncing the enemy, you'll notice it. It is playable netherless.

I didn't tried it with the whole game, just with some gameplays, and we didn't had any issue. There were a couple of situations were enemies weren't synced when they were dead, but it is not common.

## Dev

### Dependencies

There are some commands setup on yarn to fully setup the dev workplace.
You need `yarn` and `node`, obviously.
In case the modloader dependencies are not being found, run `yarn reload`, which is just an alias for `modloader64 --init`, that redo all the symlink with the actual modloader64 library.

Some optional dependencies might be needed globaly in case you want to run unit tests:

- jest
- ts-node
- ts-jest

You'll probably need to run `yarn install` to get those. You also might need to re-run `yarn reload` to create the modloader symlinks again.
