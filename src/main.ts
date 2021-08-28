import { ErrorMapper } from "utils/ErrorMapper";
import { StackCollection as Stack, QueueCollection as Queue, StackCollection } from "utils/StackNQueue"
import * as States from "utils/states";
import { RoomAgent } from "agents/room";
declare global {
  /*
    Example types, expand on these or remove them and add your own.
    Note: Values, properties defined here do no fully *exist* by this type definiton alone.
          You must also give them an implemention if you would like to use them. (ex. actually setting a `role` property in a Creeps memory)

    Types added in this `global` block are in an ambient, global context. This is needed because `main.ts` is a module file (uses import or export).
    Interfaces matching on name from @types/screeps will be merged. This is how you can extend the 'built-in' interfaces from @types/screeps.
  */
  // Memory extension samples
  interface Creep {
    state: Stack<States.State>;
  }

  interface Memory {
    uuid: number;
    log: any;
  }

  interface CreepMemory {
    body: string;
  }

  interface Game {
    Agents: RoomAgent[];
  }
  // Syntax for adding proprties to `global` (ex "global.log")
  namespace NodeJS {
    interface Global {
      log: any;
      creeps: Creep[] | undefined;
      Agents: RoomAgent[];
    }
  }
}
if (global.Agents == undefined) {
  global.Agents = [];
  for (const room in Game.rooms){
    global.Agents.push(new RoomAgent(room));
    console.log('Pushed an agent to global.')
  }
}
console.log(`Current game tick is ${Game.time}`);


//global.Agents.push(new RoomAgent('sim'));
// Start of my main loop
//function main(): void {}
// End of my main loop

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  console.log(`Current game tick is ${Game.time}`);
  for (const room of global.Agents) {
    room.execute();
  }
  for (const creepKey in Game.creeps) {
    const creep = Game.creeps[creepKey];
    creep.state.peek()?.execute();
    console.log(`Creep ${creep.name} has ${creep.state.size()} states stacked.`);
  }

  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }
});
