import { ErrorMapper } from "utils/ErrorMapper";
import { StackCollection as Stack, QueueCollection as Queue, StackCollection } from "utils/StackNQueue"
import * as States from "utils/states";
import { RoomAgent } from "agents/room";
import { CreepAgent } from "agents/creep";
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
    Agent: CreepAgent;
  }
  interface Source {
    harvestingSlots: number;
  }
  interface Memory {
    uuid: number;
    log: any;
  }

  interface RoomMemory {
    creepJobs: { harvesting: number, hauling: number, upgrading: number }
    creepBodies: { worker: number, carrier: number }
  }
  interface CreepMemory {
    id?: Id<Creep>;
    body: string;
    job?: string;
    agent?: string;
  }

  interface Game {
  }
  // Syntax for adding proprties to `global` (ex "global.log")
  namespace NodeJS {
    interface Global {
      log: any;
      CreepAgents: CreepAgent[];
      RoomAgents: RoomAgent[];
    }
  }
}
if (global.RoomAgents == undefined) {
  global.RoomAgents = [];
  for (const room in Game.rooms){
    global.RoomAgents.push(new RoomAgent(room));
    console.log('\tPushed an agent to global.');
  }
}
if (global.CreepAgents == undefined) {
  global.CreepAgents = [];
  for (const creepname in Memory.creeps) {
    global.CreepAgents.push(new CreepAgent(Game.creeps[creepname].id));
  }
}
for (const room of global.RoomAgents) {
  room.assignStates();
}

console.log('End of environment refresh');
// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  console.log('Start of main loop');
  console.log(`\tCurrent game tick is ${Game.time}`);
  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
    if (Memory.creeps[name].id == null) {
      Memory.creeps[name].id = Game.creeps[name].id
    }
    if (Game.creeps[name].Agent == null) {
      Game.creeps[name].Agent = _.first(_.filter(global.CreepAgents, (agent) => agent.Name == name));
    }
  }

  for (const room of global.RoomAgents) {
    room.execute();
  }
  global.CreepAgents.forEach(function (item) {
      item!.StateStack.peek()?.execute();
    })
  console.log('End of main loop\r\n');
});
