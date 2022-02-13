import { ErrorMapper } from "utils/ErrorMapper";
import { StackCollection as Stack, QueueCollection as Queue, StackCollection } from "utils/StackNQueue"
import * as States from "utils/states";
import { RoomAgent } from "agents/room";
console.log('Start of environment refresh');
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
  interface Source {
    harvestingSlots: number;
  }
  interface Memory {
    uuid: number;
    log: any;
  }

  interface CreepMemory {
    body: string;
    job?: string;
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
    console.log('Pushed an agent to global.');
  }
}
console.log('End of environment refresh');
// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  console.log('Start of main loop');
  console.log(`Current game tick is ${Game.time}`);
  for (const creepKey in Game.creeps) {
    const creep = Game.creeps[creepKey];
    console.log(console.log(`Creep ${creep.name} started the loop with no state.`));
  }
  for (const room of global.Agents) {
    room.execute();
  }
  for (const creepKey in Game.creeps) {
    const creep = Game.creeps[creepKey];
    if (creep.spawning == false) {
      creep.state.peek()?.execute();
    }
  }

  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }
  console.log('End of main loop\r\n');
});
