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
        if (navigator && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                resolve,
                (geolocationPositionError) => { // reject
                    // Note: must explicitly cast the `GeolocationPositionError` as an Error instance since bluebird explicitly expects a javascript Error object
                    // see http://bluebirdjs.com/docs/warning-explanations.html#warning-a-promise-was-rejected-with-a-non-error
                    // and `GeolocationPositionError` is not an Error instance, see https://developer.mozilla.org/en-US/docs/Web/API/GeolocationPositionError
                    return reject(new Error(geolocationPositionError));
                }
            );
        } else {
            // Browser does not support geolocation at all
            reject(new Error('Geolocation is unsupported'));
        }
    });
}