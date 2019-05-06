const CreateJobs = {
    run: function (room) {
        let newJobsCounter = 0;
        let existingOpenJobsCounter = 0;
        const RCL = room.controller.level;

        for(const name in Memory.creeps) {
            if(!Game.creeps[name]) {
                delete Memory.creeps[name];
                console.log('Clearing non-existing creep memory:', name);
            }
        }

        // new jobs
        const activeSources = room.find(FIND_SOURCES_ACTIVE).map(function (p) {
            return {'name': 'ActiveSources', 'id': p.id, 'creeps': []};
        });

        const droppedResources = room.find(FIND_DROPPED_RESOURCES, {
            filter: (drop) => {
                return (drop.amount > 50);
            }
        }).map(function (p) {
            return {'name': 'DroppedResources', 'id': p.id, 'creeps': []};
        });

        const spawnsAndExtensionsNeedEnergy = room.find(FIND_MY_STRUCTURES, {
            filter: (structure) => {
                return ((structure.structureType === STRUCTURE_SPAWN || structure.structureType === STRUCTURE_EXTENSION) && structure.energy < structure.energyCapacity);
            }
        }).map(function (p) {
            return {'name': 'SpawnsAndExtensionsNeedEnergy', 'id': p.id, 'creeps': []};
        });

        const towersNeedEnergy = room.find(FIND_MY_STRUCTURES, {
            filter: (tower) => {
                return (tower.structureType === STRUCTURE_TOWER && tower.energy < tower.energyCapacity);
            }
        }).map(function (p) {
            return {'name': 'TowersNeedEnergy', 'id': p.id, 'creeps': []};
        });

        const fullLinks = room.find(FIND_MY_STRUCTURES, { // only find the links that are adjacent to storage
            filter: (link) => {
                return (link.structureType === STRUCTURE_LINK && link.energy >= 600 && link.room.storage.pos.inRangeTo(link, 1));
            }
        }).map(function (p) {
            return {'name': 'FullLinks', 'id': p.id, 'creeps': []};
        });

        const fullContainers = room.find(FIND_STRUCTURES, {
            filter: (container) => {
                return (container.structureType === STRUCTURE_CONTAINER && _.sum(container.store) > 700);
            }
        }).map(function (p) {
            return {'name': 'FullContainers', 'id': p.id, 'creeps': []};
        });

        const ownedControllers = room.find(FIND_STRUCTURES, {
            filter: (controller) => {
                return (controller.structureType === STRUCTURE_CONTROLLER);
            }
        }).map(function (p) {
            return {'name': 'OwnedControllers', 'id': p.id, 'creeps': []};
        });

        const damagedStructures = room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return (
                    structure.hits < structure.hitsMax / 1.5 // health at 75%
                    &&
                    (
                        (
                            structure.structureType === STRUCTURE_RAMPART && (RCL < 8 && structure.hits < 1000 || RCL === 8 && structure.hits < 10000) ||
                            structure.structureType === STRUCTURE_WALL && (RCL < 8 && structure.hits < 1000 || RCL === 8 && structure.hits < 10000) ||
                            structure.structureType === STRUCTURE_ROAD && structure.hits < structure.hitsMax / 2
                        )
                        ||
                        (
                            structure.structureType !== STRUCTURE_RAMPART &&
                            structure.structureType !== STRUCTURE_WALL &&
                            structure.structureType !== STRUCTURE_ROAD
                        )
                    )
                );
            }
        }).map(function (p) {
            return {'name': 'DamagedStructures', 'id': p.id, 'creeps': []};
        });

        const constructions = room.find(FIND_CONSTRUCTION_SITES).map(function (p) {
            return {'name': 'Constructions', 'id': p.id, 'creeps': []};
        });

        const activeExtractors = room.find(FIND_MY_STRUCTURES, {
            filter: (extractor) => {
                return (extractor.structureType === STRUCTURE_EXTRACTOR && extractor.isActive());
            }
        });
        const activeMinerals = [];
        if(activeExtractors.length > 0){
            activeMinerals.push(...activeExtractors[0].pos.findInRange(FIND_MINERALS, 0).map(function (p) {
                return {'name': 'ActiveMinerals', 'id': p.id, 'creeps': []};
            }));
        }
        // TODO there are other jobs to create - protector jobs

        let newJobs = [];
        newJobs.push(...activeSources);
        newJobs.push(...droppedResources);
        newJobs.push(...spawnsAndExtensionsNeedEnergy);
        newJobs.push(...towersNeedEnergy);
        newJobs.push(...fullLinks);
        newJobs.push(...fullContainers);
        newJobs.push(...ownedControllers);
        newJobs.push(...damagedStructures);
        newJobs.push(...constructions);
        newJobs.push(...activeMinerals);

        const closedJobs = Memory.closedJobs;
        const openJobs = Memory.openJobs;

        let newOpenJobs = [];
        // loop through all new jobs
        for (const newJobCount in newJobs) {
            const newJob = newJobs[newJobCount];
            let isClosedJobFound = false;
            let foundExistingOpenJob = undefined;

            for (const closedJobsCount in closedJobs) { // first look through the closed jobs
                const closedJob = closedJobs[closedJobsCount];
                if (closedJob !== undefined && closedJob.id === newJob.id) {
                    isClosedJobFound = true;
                    break;
                }
            }
            if (!isClosedJobFound) {
                for (const openJobsCount in openJobs) { // if not in closed jobs then look in open jobs
                    const openJob = openJobs[openJobsCount];
                    if (openJob !== undefined) {
                        if (openJob.id === newJob.id) {
                            foundExistingOpenJob = openJob;
                            break;
                        }
                    }
                }
            }

            if (foundExistingOpenJob !== undefined) {
                newOpenJobs.push(foundExistingOpenJob); // existing open jobs are re-saved in the memory
                existingOpenJobsCounter++;
            } else if (!isClosedJobFound) { // new job found - now it is created
                newOpenJobs.push(newJob);
                newJobsCounter++;
            }
        }
        Memory.openJobs = newOpenJobs;
        console.log("CreateJobs " + room.name + ", new: " + newJobsCounter + ", existing: " + existingOpenJobsCounter);
    }
};
module.exports = CreateJobs;