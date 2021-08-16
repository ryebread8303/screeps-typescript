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
export class Traveling implements State{
    Target: RoomPosition;
    Path: PathFinderPath;
    Actor: Creep;
    Incomplete: boolean = true;
    constructor(traveler: Id<Creep>, goal: {pos: RoomPosition, range: number}){
        this.Actor = <Creep>Game.getObjectById(traveler);
        this.Target = goal.pos;
        this.Path = PathFinder.search(this.Actor.pos, goal);
    }
    execute(){
        if (this.Actor.pos == this.Target ){
            this.Actor.state.pop();
        } else {
            this.Actor.moveByPath(this.Path.path);
        }
    }
}
