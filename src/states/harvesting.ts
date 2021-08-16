//state will handle mining from sources
export namespace State {
    class Havesting {
        Actor: Creep;
        constructor(harvester: Id<Creep>) {
            this.Actor = <Creep>Game.getObjectById(harvester);

        }
    }
}
