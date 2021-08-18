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
    Range: number;
    Path: PathFinderPath;
    Actor: Creep;
    Incomplete: boolean = true;
    constructor(traveler: Id<Creep>, goal: {pos: RoomPosition, range: number}){
        this.Actor = <Creep>Game.getObjectById(traveler);
        this.Target = goal.pos;
        this.Range = goal.range;
        this.Path = PathFinder.search(this.Actor.pos, goal);
    }
    execute(){
        if (this.Actor.pos == this.Target || this.Actor.pos.inRangeTo(this.Target.x,this.Target.y,this.Range)){
            this.Actor.state.pop();
        } else {
            const startingPos = this.Actor.pos;
            Game.map.visual.poly(this.Path.path);
            this.Actor.moveByPath(this.Path.path);
            const endingPos = this.Actor.pos;
            if (startingPos === endingPos) {
                this.Path = PathFinder.search(this.Actor.pos, this.Target);
                Game.map.visual.poly(this.Path.path);
                this.Actor.moveByPath(this.Path.path);
            }
        }
    }
}
