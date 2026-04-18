export interface GuardaComponente{

    id: string;
    name: string;
    recipeReference: string;
    mass: number;
    water: number;
    temp: number;
    obsolete: boolean;
    comments: string;
    type: number;
    version: number;
    bayonet: boolean;
    hard: boolean;
    agitationAutomatic: boolean;
    agitationDuration: string;
    circulate: boolean;
    noInventoryValidation: boolean;
    liquidsTank: boolean;
    directWaterLoad: boolean;
}