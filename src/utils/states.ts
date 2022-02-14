import { CreepAgent } from "agents/creep";

export interface IState {
    Agent: CreepAgent;
    execute(): void;
}

abstract class State implements IState {
    Agent: CreepAgent;
    constructor(agent: CreepAgent) {
        this.Agent = agent;
    }
    getCreep() : Creep {
        return <Creep>Game.getObjectById(this.Agent.CreepID);
    }
    execute(): void {

    }
}

export class Idle extends State implements IState { }

export class Upgrading extends State implements IState{
    Controller: StructureController;
    constructor(agent: CreepAgent) {
        super(agent);
        this.Controller = <StructureController>this.getCreep().room.controller;
    }
    execute() {
        const creep = this.getCreep()
        if (creep.upgradeController(this.Controller) == ERR_NOT_IN_RANGE) {
            this.Agent.StateStack.push(new Traveling(this.Agent, { pos: this.Controller.pos, range: 1 }));
            this.Agent.StateStack.peek()?.execute();
        }
    }
}
export class Hauling extends State implements IState{
    Delivering: Boolean;
    constructor(agent: CreepAgent) {
        super(agent);
        this.Delivering = false;
    }
    execute() {
        const creep = this.getCreep()
        //if we have no free storage, we should be delivering
        if (creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0)
        {
            this.Delivering = true;
        }
        //if there is nothing for us to pick up, we should be delivering
        //const drops = creep.room.find(FIND_DROPPED_RESOURCES);
        const nearestDrop = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, { filter: {resourceType: RESOURCE_ENERGY} });
        if (nearestDrop == null) {
            creep.say("No rsc");
            this.Delivering = true;
            return;
        }
        if (this.Delivering)
        {
            const storage = creep.room.find(FIND_MY_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_EXTENSION ||
                        structure.structureType == STRUCTURE_SPAWN ||
                        structure.structureType == STRUCTURE_TOWER) &&
                        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                }
            })
            const nearestStorage = creep.pos.findClosestByRange(storage);
            switch (creep.transfer(nearestStorage!, RESOURCE_ENERGY))
            {
                case ERR_NOT_IN_RANGE:
                    creep.say("mv. t str")
                    this.Agent.StateStack.push(new Traveling(this.Agent, { pos: nearestStorage!.pos, range: 1 }))
                    this.Agent.StateStack.peek()?.execute();
                    break;
                case OK:
                    creep.say("Delivered");
                    this.Delivering = false;
                    break;
            }
        } else // if we aren't delivering, we need to be picking up dropped energy
        {
            switch (creep.pickup(nearestDrop!))
            {
                case ERR_NOT_IN_RANGE:
                    creep.say("mv. t rsc")
                    console.log(`Hauler ${creep.name} found energy at ${nearestDrop.pos}`)
                    this.Agent.StateStack.push(new Traveling(this.Agent, { pos: nearestDrop.pos, range: 1 }))
                    this.Agent.StateStack.peek()?.execute();
                    break;
                case ERR_FULL:
                    this.Delivering = true;
                    break;
            }
        }
    }
}
export class Harvesting extends State implements IState{
    Target: Source;
    constructor(agent: CreepAgent, source: Source) {
        super(agent);
        this.Target = source;
    }
    execute() {
        const HarvestReturn = this.getCreep().harvest(this.Target);
        if (HarvestReturn == ERR_NOT_IN_RANGE) {
            this.Agent.StateStack.push(new Traveling(this.Agent, { pos: this.Target.pos, range: 1 }));
            this.Agent.StateStack.peek()?.execute();
        }

    }
}
/**
 * A state object that handles moving a creep to where it needs to be.
 * @param traveler the ID of the creep that will move
 * @param goal An object containing the pos of the target and the range we need to be in.
 */
export class Traveling extends State implements IState {
    Target: RoomPosition;
    Range: number;
    Path: PathFinderPath;
    Incomplete: boolean = true;
    constructor(agent: CreepAgent, goal: { pos: RoomPosition, range: number }) {
        super(agent);
        this.Target = goal.pos;
        this.Range = goal.range;
        this.Path = this.findPath();
    }
    execute() {
        const creep = this.getCreep();
        if (creep.pos == this.Target || creep.pos.inRangeTo(this.Target.x, this.Target.y, this.Range)) {
            this.Agent.StateStack.pop();
            console.log(`Creep ${creep.name} popped Traveling`)
        } else {
            console.log(`Creep ${creep.name} traveling to ${this.Target}`)
            const startingPos = creep.pos;
            new RoomVisual(creep.room.name).poly(this.Path.path);
            creep.moveByPath(this.Path.path);
            const endingPos = creep.pos;
            if (startingPos === endingPos) {
                new RoomVisual(creep.room.name).poly(this.Path.path);
                creep.moveByPath(this.Path.path);
            }
        }
    }
    findPath() {
        const creep = this.getCreep();
        creep.say('pth.')
        const roomName = creep.room.name
        return PathFinder.search(
            creep.pos,
            { pos: this.Target, range: this.Range },
            // this callback function sets the cost matrix
            // for the room. This helps path around things.
            // I might use this to help keep creep away from
            // hazards later, or to keep creep on roads
            { roomCallback: (roomName) => {
            const room = Game.rooms[roomName];
            if(!room) { return false };
            const costs = new PathFinder.CostMatrix;
            room.find(FIND_STRUCTURES).forEach(function (struct) {
                if (struct.structureType === STRUCTURE_ROAD) {
                    // Favor roads over plain tiles
                    costs.set(struct.pos.x, struct.pos.y, 1);
                } else if (struct.structureType !== STRUCTURE_CONTAINER &&
                    (struct.structureType !== STRUCTURE_RAMPART ||
                        !struct.my)) {
                    // Can't walk through non-walkable buildings
                    costs.set(struct.pos.x, struct.pos.y, 0xff);
                }
            });

            // Avoid creeps in the room
            room.find(FIND_CREEPS).forEach(function (creep) {
                costs.set(creep.pos.x, creep.pos.y, 0xff);
            });

            return costs;
        }}
        );

    }
}
