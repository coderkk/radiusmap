export const kmToMiles = (km) => {
    return km * 0.62137119;
}

export const milesToMeters = (miles) => {
    return miles * 1069.344;
};

export const  kmToMeters = (km) => {
    return km * 1000;
};

export const  metersToKm = (meter) => {
    return meter / 1000;
};

export const  getDistance = (origin, destination) => {
    // return distance in meters
    var lon1 = toRadian(origin[1]),
        lat1 = toRadian(origin[0]),
        lon2 = toRadian(destination[1]),
        lat2 = toRadian(destination[0]);

    var deltaLat = lat2 - lat1;
    var deltaLon = lon2 - lon1;

    var a = Math.pow(Math.sin(deltaLat/2), 2) + Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(deltaLon/2), 2);
    var c = 2 * Math.asin(Math.sqrt(a));
    var EARTH_RADIUS = 6371;
    return c * EARTH_RADIUS * 1000;
}

export const toRadian = (degree) => {
    return degree*Math.PI/180;
}

export const getLocation = async () => {
    return new Promise((resolve, reject) => {

        if(!("geolocation" in navigator)) {
            reject(new Error('Geolocation is not available.'));
        }

        navigator.geolocation.getCurrentPosition(pos => {
            resolve(pos);
        }, err => {
            reject(err);
        });

    });
}