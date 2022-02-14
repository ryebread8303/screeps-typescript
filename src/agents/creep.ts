import { Guid } from "guid-typescript";
import { StackCollection as Stack, QueueCollection as Queue, StackCollection } from "../utils/StackNQueue";
import * as States from "../utils/states";

export class CreepAgent {
    Name: string | undefined;
    CreepID: Id<Creep>;
    StateStack: Stack<States.IState> = new Stack;
    constructor(id: Id<Creep>) {
        this.CreepID = id;
        this.Name = (<Creep>Game.getObjectById(id)).name;
        this.StateStack.push(new States.Idle(this));
    }
    harvest(source: Source) {
        this.StateStack.push(new States.Harvesting(this, source))
    }
}
