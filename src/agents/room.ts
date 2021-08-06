import { Guid } from "guid-typescript";

// room agent will handle tasks within a room, such as mining and spawning
export class RoomAgent {
        Sources: Source[];
        Room: Room;
        Spawns: StructureSpawn[];
        constructor(){
            this.Room = Game.rooms["sim"]
            this.Sources = this.Room.find(FIND_SOURCES);
            this.Spawns = this.Room.find(FIND_MY_SPAWNS);
        }
        execute () {
            this.Spawns[0].spawnCreep([WORK, WORK, MOVE], Guid.create().toString())
        }
}
