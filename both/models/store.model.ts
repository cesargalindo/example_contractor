export interface Store {
    _id?: string;
    gid?: string;       // Google Id
    name: string;
    address: string;
    phoneNumber?: string;
    website?: string;
    hours?: string;
    location: {
        coordinates?: Array<number>,        // [ lon, lat ]
        type: 'Point',
    };
    public?: number;
    ratings?: string;
    note?: string;
    image: string;
}

