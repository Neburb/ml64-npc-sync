# ML64 NPC Sync

Mod for ML64 to sync different attributes between NPCs
Only works with ML64 `stable` branch

## Supported games

- Ocarina of Time

## Attributes synced

### Health

Health is synced in a way that, whoever kills that enemy, the death animation will be run. The other synced players will just have that enemy destroyed.
If someone enters an area with already dead enemies, the enemies will be automatically destroyed.
Bosses and mini-bosses should work too (Tested with mini-bossed, not yet with bosses)

### Position and rotation

Position and rotation get synced by the player that is nearest the NPC.
I also added a sync attributed based on a virtual `aggro`. Whoever has the greatest aggro is the one that has the enemy synced

- If you hit an enemy, you'll increase that enemy's aggro by 1 point. That means that you'll sync that enemy, until another players hit it the same or more times than you
- Aggro gets lowered every frame until 0. That means that if you don't hit an enemy in a while, you won't sync that enemy

Regular NPCs are also synced.

Syncing can get a bit yanking. Syncing definitely works with the position and rotation, but if you're not the one syncing the enemy, you'll notice it. It is playable netherless.

I didn't tried it with the whole game, just with some gameplays, and we didn't had any issue. There were a couple of situations were enemies weren't synced when they were dead, but it is not common.

#### Non-NPC Actor syncing

There are also other things getting synced, like, boxes, mirrors, and other puzzle things. These can get a bit weird depending on the puzzle, like:

- Moving boxes sync works, but if someone moves that box, and you try to move it again, it will return to the original place you last moved it
- Some ice puzzles can be broken if players interacts between these.
In these situations it is better that one player move only one block, or that one player moves it and others just watch

#### Bosses

Bosses are tricky. Health is synced, but not death, as it could break the game. Position is also synced, but randomly, not based on position and aggro, as the game is unplayable if the boss is always hitting the same player

#### Animations

Animation is not synced between any actor

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
