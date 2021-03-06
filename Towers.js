let Util = require('Util');
const Towers = {
    run: function (gameRoom) {
        let anyHostiles = Memory.MemRooms[gameRoom.name].AnyHostiles;
        if(anyHostiles || Game.time % Util.GAME_TIME_MODULO_1 === 0){
            const towers = FindTowers(gameRoom);
            anyHostiles = HostileCreeps(towers);
            if(!anyHostiles){
                anyHostiles = DamagedCreeps(towers);
            }
            if(!anyHostiles && Game.time % Util.GAME_TIME_MODULO_4 === 0){
                EmergencyRepair(towers);
            }
            if(anyHostiles !== Memory.MemRooms[gameRoom.name].AnyHostiles){
                Memory.MemRooms[gameRoom.name].AnyHostiles = anyHostiles;
            }
        }

        function FindTowers(gameRoom){
            let towers = [];
            if(Memory.MemRooms[gameRoom.name].TowerIds){
                for(let i = 0; i < Memory.MemRooms[gameRoom.name].TowerIds.length; i++){
                    towers[i] = Game.getObjectById(Memory.MemRooms[gameRoom.name].TowerIds[i]);
                }
            }else{
                towers = gameRoom.find(FIND_MY_STRUCTURES, {
                    filter: function (tower) {
                        return tower.structureType === STRUCTURE_TOWER && tower.store.getUsedCapacity(RESOURCE_ENERGY) > 0;
                    }
                });
                let towerIds = [];
                for(let i = 0; i < towers.length; i++){
                    towerIds[i] = towers[i].id;
                }
                Memory.MemRooms[gameRoom.name].TowerIds = towerIds;
            }
            return towers;
        }

        function EmergencyRepair(towers){
            const damagedStructures = gameRoom.find(FIND_STRUCTURES, {
                filter: function (structure) {
                    return (structure.hits < structure.hitsMax / 2
                        && structure.structureType !== STRUCTURE_WALL
                        && structure.structureType !== STRUCTURE_RAMPART)
                        ||
                        ((structure.structureType === STRUCTURE_RAMPART
                            || structure.structureType === STRUCTURE_WALL)
                            && structure.hits < Util.RAMPART_WALL_HITS_U_LVL5);
                }
            });

            for (let i = 0; i < towers.length; i++) {
                if (damagedStructures.length > 0 && towers[i].store.getUsedCapacity(RESOURCE_ENERGY) > 700) {
                    const val = ((i + 1) % damagedStructures.length);
                    towers[i].repair(damagedStructures[val]);
                }
            }
        }

        function HostileCreeps(towers){
            const hostileTargets = gameRoom.find(FIND_HOSTILE_CREEPS, {
                filter: function (hostile) {
                    return hostile.hits < hostile.hitsMax || hostile.pos.findInRange(FIND_STRUCTURES, 4).length > 0 || hostile.pos.findInRange(FIND_MY_CREEPS, 2).length > 0;
                }
            });
            if (hostileTargets.length > 0) {
                for (let i = 0; i < towers.length; i++) {
                    towers[i].attack(hostileTargets[((i + 1) % hostileTargets.length)]);
                }
                return hostileTargets;
            }
        }

        function DamagedCreeps(towers){
            let damagedCreeps = gameRoom.find(FIND_MY_CREEPS, {
                filter: function (creep) {
                    return creep.hits < creep.hitsMax;
                }
            });
            if(gameRoom.controller.isPowerEnabled){
                damagedCreeps = damagedCreeps.concat(gameRoom.find(FIND_MY_POWER_CREEPS, {filter: function (powerCreep) {return powerCreep.hits < powerCreep.hitsMax;}}));
            }
            if(damagedCreeps.length > 0){
                for (let i = 0; i < towers.length; i++) {
                    towers[i].heal(damagedCreeps[((i + 1) % damagedCreeps.length)]);
                }
                return damagedCreeps;
            }
        }
    }
};
module.exports = Towers;