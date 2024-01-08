
let gptStatusMapping: Record<string, number>, 
    displayNameMapping: Record<number, string>;

export interface Message {
    id: string;
    sender: string;
    snippet: string;
    internalDate: number;
    gptRes: {
        company: string;
        position: string;
        status: number;
    };
}

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