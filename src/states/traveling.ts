/*
    feed the Traveling state the room position and desired range and it
    will construct a path to the goal. Call the travel method to move
    creep toward the goal.
*/
export namespace State {
    class Traveling {
        Target: RoomPosition;
        Path: PathFinderPath;
        Actor: Creep;
        Incomplete: boolean = true;
        constructor(traveler: Id<Creep>, goal: {pos: RoomPosition, range: number}){
            this.Actor = Game.getObjectById(traveler);
            this.Target = goal.pos;
            this.Path = PathFinder.search(this.Actor.pos, goal);
        }
        travel(){
            if (this.Actor.pos == this.Target ){
                this.Incomplete = false;
            } else {
                this.Actor.moveByPath(this.Path.path);
            }
        }
    }
}
