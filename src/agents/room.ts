import { Guid } from "guid-typescript";
import { StackCollection } from "utils/StackNQueue";
import * as States from "utils/states";
// room agent will handle tasks within a room, such as mining and spawning
export class RoomAgent {
    Sources: Source[];
    Room: Room;
    Spawns: StructureSpawn[];
        constructor(roomname: string){
            this.Room = Game.rooms[roomname]
            this.Sources = this.Room.find(FIND_SOURCES);
            this.Spawns = this.Room.find(FIND_MY_SPAWNS);
        }
        execute () {
            this.Spawns[0].spawnCreep([WORK, WORK, MOVE], Guid.create().toString())
            for (const creep of this.Room.find(FIND_MY_CREEPS)) {
                let harvester: Creep = creep;
                let state: StackCollection<States.State> = harvester.state;
                if (state == undefined || state.size() == 0) {
                    harvester.state = new StackCollection<States.State>();
                    harvester.state.push(new States.Harvesting(harvester.id,this.Sources[0]));
                }
            }
        }
}
