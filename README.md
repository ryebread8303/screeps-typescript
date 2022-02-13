# O'Ryan's TypeScript Screeps bot
This is my bot for Screeps World. I'm using this as my intro to JavaScript/TypeScript.

## Architecture
The bot currently has a RoomAgent object that handles spawns and assigning states to creeps based on their body type. Eventually it will handle creating structures and defending the room.

Creep behavior is handled by a stack of state objects. These states contain all the actions the creep will do. States can add other states, and can remove themselves from the stack when complete.

Currently I have these states:
- Traveling: This state is added by other states and contains all the movement related behaviors. It pops itself once the creep is at the destination.
- Harvesting: This state is added by the RoomAgent to worker creeps. It drop mines sources.
- Hauling: This state is added by the RoomAgent to carrier creeps. It finds energy dropped on the ground, and then takes it to storage.

My final architecture will look something like the following:
- Administrator: Object that checks the states of each room, and coordinates the rooms to share resources.
- RoomAgent: Object that runs the activities of each room.
- Creep States: Objects that handle actions of an individual creep.

## TODO
* Haulers should start a delivery if there are no more resources to pick up
* need to upgrade the room controller
* need to defend the room
* need to colonize other rooms
