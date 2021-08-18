export interface State {
    execute(): void;
}

export class Harvesting implements State{
    Actor: Creep;
    Target: Source;
    constructor(harvester: Id<Creep>, source: Source) {
        this.Actor = <Creep>Game.getObjectById(harvester);
        this.Target = source;
    }
    execute() {
        const HarvestReturn = this.Actor.harvest(this.Target);
        if (HarvestReturn == ERR_NOT_IN_RANGE) {
            this.Actor.state.push(new Traveling(this.Actor.id, { pos: this.Target.pos, range: 1 }));
            this.Actor.state.peek()?.execute();
        }

    }
}
export class Traveling implements State {
    Target: RoomPosition;
    Range: number;
    Path: PathFinderPath;
    Actor: Creep;
    Incomplete: boolean = true;
    constructor(traveler: Id<Creep>, goal: { pos: RoomPosition, range: number }) {
        this.Actor = <Creep>Game.getObjectById(traveler);
        this.Target = goal.pos;
        this.Range = goal.range;
        this.Path = this.findPath();
    }
    execute() {
        if (this.Actor.pos == this.Target || this.Actor.pos.inRangeTo(this.Target.x, this.Target.y, this.Range)) {
            this.Actor.state.pop();
        } else {
            const startingPos = this.Actor.pos;
            Game.map.visual.poly(this.Path.path, { fill: 'aqua' });
            this.Actor.moveByPath(this.Path.path);
            const endingPos = this.Actor.pos;
            if (startingPos === endingPos) {
                Game.map.visual.poly(this.Path.path, { fill: 'aqua' });
                this.Actor.moveByPath(this.Path.path);
            }
        }
    }
    findPath() {
        this.Actor.say('Finding path.')
        const roomName = this.Actor.room.name
        return PathFinder.search(
            this.Actor.pos,
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
