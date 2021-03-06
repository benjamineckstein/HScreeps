const Util = {
    // if over target - terminal should send to another owned room that has under the target
    TERMINAL_TARGET_RESOURCE: 3000,
    TERMINAL_TARGET_ENERGY: 30000,
    // if over max - then try and sell
    TERMINAL_MAX_RESOURCE: 6000,
    TERMINAL_MAX_ENERGY: 90000,
    // if storage contains more or equal of high then creep should transfer to terminal until high_transfer is in terminal
    STORAGE_ENERGY_HIGH: 300000,
    STORAGE_ENERGY_HIGH_TRANSFER: 100000,
    STORAGE_ENERGY_MEDIUM: 100000,
    STORAGE_ENERGY_MEDIUM_TRANSFER: 80000,
    STORAGE_ENERGY_LOW: 10000, // abort transfer when storage is lower than this
    STORAGE_ENERGY_LOW_TRANSFER: 50000,

    STORAGE_HIGH: 10000,
    STORAGE_HIGH_TRANSFER: 8000,
    STORAGE_MEDIUM: 6000,
    STORAGE_MEDIUM_TRANSFER: 6000,
    STORAGE_LOW: 0, // abort transfer when storage is lower than this
    STORAGE_LOW_TRANSFER: 6000,

    // job type int enum
    OBJECT_JOB : 1,
    FLAG_JOB : 2,

    MINIMUM_ENERGY_REQUIRED : 200,  // the smallest creep that a spawn can create

    OBSERVER_SCAN_RADIUS_POWER_DEPOSIT : 5, // the radius around the flagged observer when scanning for power banks or deposits
    DEPOSIT_MAX_LAST_COOLDOWN : 80, // if the deposit is over this value then ignore it and end the deposit job

    TRANSPORTER_MAX_CARRY : 1000, // used in JobAttackPowerBank to generate JobTransportPowerBank
    GENERATE_TRANSPORTER_WHEN_POWERBANK_HITS_UNDER : 200000, // used in JobAttackPowerBank to determine when powerbank hit is low when to generate transporter jobs

    DO_EXTRACTING_WHEN_STORAGE_UNDER_MINERAL : 200000, // stop extracting mineral when one has more than this
    RAMPART_WALL_MAX_HITS_WHEN_STORAGE_ENERGY : 600000, // when storage energy is over this value then go crazy with upgrading ramparts and walls
    RAMPART_WALL_HITS_U_LVL5 : 1000,
    RAMPART_WALL_HITS_U_LVL8 : 100000,
    RAMPART_WALL_HITS_O_LVL8 : 2000000,

    // Game.time % modulo value below - stack expensive ticks on top of each other
    GAME_TIME_MODULO_1 : 2,
    GAME_TIME_MODULO_2 : 6,
    GAME_TIME_MODULO_3 : 12,
    GAME_TIME_MODULO_4 : 30,
    GAME_TIME_MODULO_5 : 18000,
    GAME_TIME_MODULO_6 : 240000,

    ErrorLog: function (functionParentName, functionName, message) {
        const messageId = functionParentName + ' ' + functionName;
        console.log('!!--------------- ' + messageId + ' ---------------!!');
        console.log(message);
        if (!Memory.ErrorLog) {
            Memory.ErrorLog = {};
        }
        if (!Memory.ErrorLog[messageId]) {
            Memory.ErrorLog[messageId] = {};
            Memory.ErrorLog[messageId][message] = 1;
        } else if (!Memory.ErrorLog[messageId][message]) {
            Memory.ErrorLog[messageId][message] = 1;
        } else {
            Memory.ErrorLog[messageId][message] = Memory.ErrorLog[messageId][message] + 1;
        }
    },
    InfoLog: function (functionParentName, functionName, message) {
        const messageId = functionParentName + ' ' + functionName;
        console.log('----------------- ' + messageId + '----------------- ');
        console.log(message);
        if (!Memory.InfoLog) {
            Memory.InfoLog = {};
        }
        if (!Memory.InfoLog[messageId]) {
            Memory.InfoLog[messageId] = {};
            Memory.InfoLog[messageId][message] = 1;
        } else if (!Memory.InfoLog[messageId][message]) {
            Memory.InfoLog[messageId][message] = 1;
        } else {
            Memory.InfoLog[messageId][message] = Memory.InfoLog[messageId][message] + 1;
        }
    },
    Info: function (functionParentName, functionName, message) {
        console.log(functionParentName + ' ' + functionName + ' | ' + message);
    },
    Warning: function (functionParentName, functionName, message) {
        console.log('WARNING! ' + functionParentName + ' ' + functionName + ' | ' + message);
    },
    /**@return {number}*/
    FreeSpaces: function (pos) { // get the number of free spaces around a pos
        let freeSpaces = 0;
        const terrain = Game.map.getRoomTerrain(pos.roomName);
        for (let x = pos.x - 1; x <= pos.x + 1; x++) {
            for (let y = pos.y - 1; y <= pos.y + 1; y++) {
                const t = terrain.get(x, y);
                if (t === 0 && (pos.x !== x || pos.y !== y)) {
                    freeSpaces++;
                }
            }
        }
        return freeSpaces;
    },

    /**@return {boolean}*/
    IsHighway: function(roomName){
        const parsed = /^[WE]([0-9]+)[NS]([0-9]+)$/.exec(roomName);
        return (parsed[1] % 10 === 0) || (parsed[2] % 10 === 0);
    },

    DeleteJob: function(job, jobKey, roomName){
        // this.Info('Util', 'DeleteJob', 'job deleted ' + jobKey);
        if(Memory.MemRooms[roomName] && job.JobType === this.FLAG_JOB && job.CreepType !== 'T' && job.CreepType !== 'B') {
            // if job is a flag job then remember to decrease the number og allowed creeps in the room creeptype T and B should never be changed
            if(Memory.MemRooms[roomName].MaxCreeps
                && Memory.MemRooms[roomName].MaxCreeps[job.CreepType]
                && Memory.MemRooms[roomName].MaxCreeps[job.CreepType].M
                && Memory.MemRooms[roomName].MaxCreeps[job.CreepType].M > 0){
                Memory.MemRooms[roomName].MaxCreeps[job.CreepType].M -= 1;
            }
        }
        Memory.MemRooms[roomName].RoomJobs[jobKey] = undefined;
    }
};
module.exports = Util;
