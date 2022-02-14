import { Guid } from "guid-typescript";
import { QueueCollection, StackCollection } from "utils/StackNQueue";
import * as States from "utils/states";
import { CreepAgent } from "./creep";
// room agent will handle tasks within a room, such as mining and spawning
export class RoomAgent {
    Sources: Source[];
    Room: Room;
    Terrain: RoomTerrain;
    Spawns: StructureSpawn[];
    //not sure I need this
    //EnergyRequest: QueueCollection<RoomPosition>;
    harvestingSlots: number = 0;
    constructor(roomname: string){
        this.Room = Game.rooms[roomname]
        this.Sources = this.Room.find(FIND_SOURCES);
        this.Spawns = this.Room.find(FIND_MY_SPAWNS);
        this.Terrain = new Room.Terrain(this.Room.name);
        for (const source of this.Sources) {
            const pos = source.pos;
            const id = source.id;
            /*
            start the count of harvestable positions around a source at 9.
            When we subtract the number of walls around the source, the wall
            the source is in will be subtracted from the count, leading to
            an accurate count of how many harvesters can surround the source.
            */
            var harvestPos = 9;
            var record = {};
            /*
            try to count how many open spots are around a source for harvesting.
            the range and the loop check all the tiles surrounding the source
            */
            var range = [-1,0,1];
            for (let i = -1;i < 2;i++){
                for (let k = -1;k < 2;k++) {
                    if (this.Terrain.get(pos.x + i, pos.y + k) == TERRAIN_MASK_WALL) {
                        harvestPos = harvestPos - 1;
                    }
                }
            }
            /*
            set the source's number of harvesting slots so we don't send to
            many harvesters
            */
            source.harvestingSlots = harvestPos;
        }
        /*
        count the total number of harvestingSlots in the room
        */
        for(const source of this.Sources) {
            this.harvestingSlots = this.harvestingSlots + source.harvestingSlots;
        }

    }
    execute() {
        // need to add line to check proportion of workers to carriers and add carriers when needed
        const CreepsInRoom = this.Room.find(FIND_MY_CREEPS)
        //const creepBodies = { worker: 0, carrier: 0 };
        //const creepJobs = {harvesting: 0, hauling: 0, upgrading: 0}
        let creepBodies = this.Room.memory.creepBodies
        let creepJobs = this.Room.memory.creepJobs
        creepBodies['worker'] = (_.filter(CreepsInRoom, (creep) => creep.memory.body == 'worker')).length;
        creepBodies['carrier'] = (_.filter(CreepsInRoom, (creep) => creep.memory.body == 'carrier')).length;
        creepJobs['harvesting'] = (_.filter(CreepsInRoom, (creep) => creep.memory.job == 'harvesting')).length;
        creepJobs['hauling'] = (_.filter(CreepsInRoom, (creep) => creep.memory.job == 'hauling')).length;
        creepJobs['upgrading'] = (_.filter(CreepsInRoom, (creep) => creep.memory.job == 'upgrading')).length;
        console.log(`\tWorker Count: ${creepBodies['worker']}`);
        console.log(`\tCarrier Count: ${creepBodies['carrier']}`);
        if (creepBodies == undefined) {
            let creepBodies = { worker: 0 };
        }
        if (this.Spawns[0].spawning == null) {
            if (creepBodies['worker'] < 6 && (creepBodies['worker'] < creepBodies['carrier']) || (creepBodies.carrier + creepBodies.worker == 0)) {
                this.spawnWorker();
            } else {
                this.spawnHauler();
            }
        }

    }
    assignStates() {
        const CreepsInRoom = this.Room.find(FIND_MY_CREEPS)
        let creepJobs = this.Room.memory.creepJobs
        console.log("Assigning states to creeps.")
        for (const creep of CreepsInRoom) {
            const state = creep.Agent.StateStack
            if (state == undefined) {
                if (creep.memory.body == 'worker') {
                    switch (creep.memory.job) {
                        case 'upgrading':
                            creep.Agent.StateStack = new StackCollection<States.IState>();
                            creep.memory.job = 'upgrading';
                            creep.Agent.StateStack.push(new States.Upgrading(creep.Agent));
                            console.log("\tPushed upgrading state.")
                            break;
                        case 'harvesting':
                            creep.Agent.StateStack = new StackCollection<States.IState>();
                            creep.memory.job = 'harvesting'
                            creep.Agent.StateStack.push(new States.Harvesting(creep.Agent, this.Sources[0]));
                            console.log("\tPushed harvesting state.")
                            break;
                        default: break;
                    }
                    if (creepJobs.harvesting < creepJobs.upgrading) {
                        creep.Agent.StateStack = new StackCollection<States.IState>();
                        creep.memory.job = 'harvesting';
                        creep.Agent.StateStack.push(new States.Harvesting(creep.Agent, this.Sources[0]));
                    } else {
                        creep.Agent.StateStack = new StackCollection<States.IState>();
                        creep.memory.job = 'upgrading';
                        creep.Agent.StateStack.push(new States.Upgrading(creep.Agent));
                    }
                }
                if (creep.memory.body == 'carrier') {
                    creep.Agent.StateStack = new StackCollection<States.IState>();
                    creep.Agent.StateStack.push(new States.Hauling(creep.Agent));
                }
            }
        }
        console.log("Done assigning states to creeps.")
    }
    spawnWorker() {
        console.log('spawning a worker');
        this.Spawns[0].spawnCreep([WORK, WORK, MOVE], Guid.create().toString(), { memory: { body: "worker" } })
    }
    spawnHauler() {
        console.log('spawning a carrier');
        this.Spawns[0].spawnCreep([CARRY, CARRY, CARRY, MOVE, MOVE, MOVE], Guid.create().toString(), { memory: { body: "carrier" } })
    }
}
