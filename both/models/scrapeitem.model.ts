export interface ScrapeItem {
    _id?: string;
    owner?: string;
    name: string;
    size?: number;
    unit?: string;
    quantity: number;           // quantity = 1, prices contain different quantity values
    price: number;
    image?: string;
    storeId: string;
    created: number;            // timestamp
    startDate?: number;
    endDate?: number;
    category?: string;    
    upc?: string;    
    status?: number;            // -2, rejected, -1 duplicate, 0 - inactive, 1 - flagged, 2 - active    
    note?: string;    
    mitems?: Array<mitem>;
}

interface mitem {
    created?: number;            // date item was matched - added to ScrapeItem
    itemId?: string;
    quantity?: number;  
}
