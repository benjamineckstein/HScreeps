let CreateJobs = require('CreateJobs');
let AssignJobs = require('AssignJobs');
let ExecuteJobs = require('ExecuteJobs');
let Towers = require('Towers');
let Links = require('Links');
let Terminals = require('Terminals');
let Factories = require('Factories');
let PowerSpawns = require('PowerSpawns');
let Util = require('Util');
let Observers = require('Observers');
let PowerCreeps = require('PowerCreeps');
let Labs = require('Labs');

module.exports.loop = function () {

    Controller();

    function Controller(){
        if (!Memory.MemRooms) {
            Memory.MemRooms = {};
        }
        if(Game.time % Util.GAME_TIME_MODULO_2 === 0){
            if (Game.time % Util.GAME_TIME_MODULO_3 === 0) {
                if (Game.time % Util.GAME_TIME_MODULO_4 === 0) { // tick burst from https://docs.screeps.com/cpu-limit.html#Bucket
                    CreateJobs.run();
                    Links.run();
                    if (Game.time % Util.GAME_TIME_MODULO_5 === 0) {
                        Util.Info('Main', 'Controller', '--------------- main reset of memory ---------------');

                        const foundCreeps = {};
                        for (const memRoomKey in Memory.MemRooms) {
                            const memRoom = Memory.MemRooms[memRoomKey];
                            delete memRoom.links; // remove links - maybe the buildings have been deleted ect.
                            delete memRoom.FctrId; // remove FctrId - maybe the buildings have been deleted ect.
                            delete memRoom.PowerSpawnId; // remove PowerSpawnId - maybe the buildings have been deleted ect.
                            delete memRoom.TowerIds; // remove TowerIds - maybe a tower have been deleted ect.
                            delete memRoom.ObserverId; // remove ObserverId - maybe an observer have been deleted ect.
                            MaxCreepsCleanup(memRoomKey, memRoom, foundCreeps);
                            UnusedRoomsCleanup(memRoomKey, memRoom);
                        }
                        if(Game.time % Util.GAME_TIME_MODULO_6 === 0){ // approx every 3 days
                            delete Memory.Paths; // remove Paths to make room for new paths
                            delete Memory.InfoLog;
                            Util.InfoLog('Main', 'Controller', 'reset memory logs ' + Game.time);
                        }
                    }
                    Terminals.run();
                    Factories.run();
                }
                AssignJobs.run();
            }
            Labs.run();
        }
        ExecuteJobs.run();
        for (const gameRoomKey in Game.rooms) {
            const gameRoom = Game.rooms[gameRoomKey];
            if(gameRoom.controller && gameRoom.controller.my && Memory.MemRooms[gameRoom.name]){
                Towers.run(gameRoom);
                if(gameRoom.controller.level === 8){
                    Observers.run(gameRoom, gameRoomKey);
                    PowerSpawns.run(gameRoom);
                }
            }
        }
        PowerCreeps.run();
        if (Game.cpu.bucket >= 9000){
            //Util.Info('Main', 'Controller', 'Game.cpu.bucket ' + Game.cpu.bucket);
            Game.cpu.generatePixel();
        }
    }

    function MaxCreepsCleanup(memRoomKey, memRoom, foundCreeps){
        // search through MaxCreeps to see if they all have an alive creep and that there are only one of each creep names in MaxCreeps
        for (const creepTypesKey in memRoom.MaxCreeps) {
            let creepOfTypeFound = false;
            for (const creepKey in memRoom.MaxCreeps[creepTypesKey]) {
                if (creepKey !== 'M') {
                    let foundCreep = false;
                    for (const creepName in Memory.creeps) {
                        if (creepName === creepKey) {
                            foundCreep = true;
                            for (const foundCreepsKey in foundCreeps) {
                                if (foundCreepsKey === creepKey) {
                                    foundCreep = false;
                                    break;
                                }
                            }
                            foundCreeps[creepKey] = memRoomKey;
                            break;
                        }
                    }
                    if (!foundCreep) {
                        Util.ErrorLog('Main', 'Main', 'Lingering MaxCreeps found and removed ' + creepKey + ' in ' + memRoomKey);
                        // this bug might happen when there are an error somewhere in the code that prevents the normal creep memory cleanup
                        memRoom.MaxCreeps[creepTypesKey][creepKey] = undefined;
                    }else{
                        creepOfTypeFound = true;
                    }
                }else{
                    memRoom.MaxCreeps[creepTypesKey][creepKey] = undefined; // reset - remove M
                }
            }
            if(!creepOfTypeFound){
                memRoom.MaxCreeps[creepTypesKey] = undefined; // remove creep type altogether
            }
        }
        return foundCreeps;
    }

    function UnusedRoomsCleanup(memRoomKey, memRoom){
        if (memRoom.RoomLevel <= 0 && Object.keys(memRoom.RoomJobs).length === 0) {
            let foundCreep = false;
            for (const creepType in memRoom.MaxCreeps) {
                const maxCreep = memRoom.MaxCreeps[creepType];
                if (maxCreep && Object.keys(maxCreep).length > 1) { // more than 'M' is present - a creep is still attached to the room. wait until it dies
                    foundCreep = true;
                    break;
                }
            }
            if (!foundCreep) {
                // room is unowned and there are no jobs in it - remove the room
                Memory.MemRooms[memRoomKey] = undefined;
                Util.InfoLog('Main', 'Main', 'removed unused room ' + memRoomKey);
            }
        }
    }
};

// TODOs:
// TODO FillStrg-container can be very expensive!
// TODO possible optimization: when a creep is looking for spawnOrExtensions nearby it might as well do the spawn replenish at that point and remove the dedicated spawn look for creeps to replenish
// TODO flag jobs may spawn in neighbor room when it could spawn in own room - look at bestLinearDistance

// attack NPC strongholds
// harvest middle rooms
// harvest neutral rooms
// move creeps in formation

// if doing long distance work creep should make sure it has enough timeToLive to do the job
// add constructions
// monitor creeps and see if they can work more quickly by optimizing its actions - remove 'pausing' ticks
