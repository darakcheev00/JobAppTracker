
let gptStatusMapping: Record<string, number>, 
    displayNameMapping: Record<number, string>;

export default class SharedDataManager {

    static setGptStatusMapping(mapping: Record<string, number>) {
        gptStatusMapping = mapping;
    }

    static getGptStatusMapping() {
        return gptStatusMapping;
    }

    static setDisplayNameMapping(mapping: Record<number, string>) {
        displayNameMapping = mapping;
    }

    static getDisplayNameMapping() {
        return displayNameMapping;
    }
    
}