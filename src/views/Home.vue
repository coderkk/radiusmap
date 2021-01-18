<script>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue';
import leaflet from 'leaflet'
import "leaflet/dist/leaflet.css";

import { kmToMeters, getDistance, getLocation, metersToKm } from '@/libs/utils.js';

import {
  LMap,
  LIcon,
  LTileLayer,
  LMarker,
  LCircle,
  LControlScale,
  LControl,
  LControlLayers,
} from "@vue-leaflet/vue-leaflet";

export default {
  components: {
    LMap,
    LIcon,
    LTileLayer,
    LMarker,
    LCircle,
    LControlScale,
    LControl,
    LControlLayers,
  },
  setup() {
    const zoom = ref(12);
    const detectDistance = ref(false);
    const followMyLocation = ref(false);
    const distance = ref(0);
    const markerRadius = ref(10);
    const marker = ref(null);
    const markerCircle = ref(null);
    const mapContainer = ref(null);
    const currentMarkerIcon = ref(null);

    const getDefaultPosition = () => {
      let defaultPosition = null;
      let lastPinLocation = localStorage.getItem("pinMarker");
      if ( lastPinLocation !== undefined ) {
        try {
          lastPinLocation = JSON.parse(lastPinLocation);
          defaultPosition = leaflet.latLng(lastPinLocation.latitude, lastPinLocation.longitude);
        } catch (e) {}
      }

      if (defaultPosition === null) defaultPosition = leaflet.latLng(5.960631696373147, 116.07158660888673);
      return defaultPosition;
    };

    let watchPositionId = null;
    let defaultLatLng = getDefaultPosition();
    
    const currentMarker = ref(defaultLatLng);
    const pinMarker = ref(defaultLatLng);
    const mapCenter = ref(defaultLatLng);

    currentMarkerIcon.value = leaflet.icon({
        iconUrl: 'data:image/png;base64,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',
        shadowUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACkAAAApCAQAAAACach9AAACJ0lEQVR4Ae3ShY6bQRADYIeZ3v+9yszMDZPlkSWtslPuiS6+C+8n/zNp4p/froi8Jq/Jxk+TkwmHX//Wz8lG3jNjTeaguabD6HAVbphMwIIzqtd+rzKYhsgUNNcqo3fEBlyyOWmwhbbS4b8SaLBu7SGlpL9gklw3YpYR6J5Bm0zAguspZjvqSVQxqvxsPSJJKYIFKh5A2VIDyMgYfYB9hvcmI0VPTxVZS81ER7qiBoFqBAa9MKOKLzzv2BE3EOnlmDTrNRXryToGOGR65nhvSphjMP6b6WJ6xMYYxSW7l1Pp6CSzbLFPgAN3NGLKPRn3c59qxzapCTPUFNVKh0vUe24azMkW+uRm/B8UU3O3Eiw4nOrrafOSF5gS7PqHUotBQQ6f11p22HDOi+66i2LIHcWJOZrTP+rkhOl7n8YcTzCQIuIvyZPQrvs5Br0OdTsyB+YYrwKokXvsgOIXZzbeQ0DMnhHIqGOdBMEl9qKYAo3pBbbDNkijUSgjv/PrMFhwRwS2YbbMzqg+SzdukoxbeiSEVlgyK6yFmjSYtDxhTXRv1OsgsCb2jflu8hLMyC0P7Qg54NE1qc/MF5PqeAHWSfDL3zxN9dsQ+YD3zEeRS4GeYgFm5I7HNiJPfP4V7/CKeUvwsxpqhkwFzMgjj33Vwe+EnuIxngn8FvNTSCkwmJG+rQm8J/MId/EQL3nZwe2EmSNm9ufkFq9xHzcJPscnLGMRomBKqdzOY2EH+IPOLMEAAAAASUVORK5CYII=',
        iconRetinaUrl: 'data:image/png;base64,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',
        iconSize:    [25, 41],
        iconAnchor:  [12, 41],
        popupAnchor: [1, -34],
        tooltipAnchor: [16, -28],
        shadowSize:  [41, 41]
    });

    const setPlacePosition = (latitude, longitude) => {
      pinMarker.value = leaflet.latLng(latitude, longitude);
      localStorage.setItem("pinMarker", JSON.stringify({latitude: latitude, longitude: longitude}));
    }

    const setCurrentPlacePosition = () => {
      getLocation().then((pos) => {
        console.log(pos);
        setPlacePosition(pos.coords.latitude, pos.coords.longitude);
        setMapToPlacePosition(pinMarker.value);
        distance.value = marker_distance();
      });
    };

    const setMapToPlacePosition = (latlng) => {
      mapCenter.value = leaflet.latLng(latlng.lat, latlng.lng);
    };

    const detectRadiusDistance = () => {
      removeDetectRadiusDistance();
      watchPositionId = navigator.geolocation.watchPosition((pos) => {
        currentMarker.value = leaflet.latLng(pos.coords.latitude, pos.coords.longitude);
        localStorage.setItem("currentMarker", JSON.stringify({latitude: pos.coords.latitude, longitude: pos.coords.longitude}));
        distance.value = marker_distance();
        if (followMyLocation.value) {
          setMapToPlacePosition(currentMarker.value);
        }
      }, (error) => {
        console.log('[detectRadiusDistance][error]', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      });
      distance.value = marker_distance();
    };

    const removeDetectRadiusDistance = () => {
      if (navigator.geolocation.clearWatch && watchPositionId !== null) {
        navigator.geolocation.clearWatch(watchPositionId);
      }
    }

    const moveMarker = (el) => {
      let latLng = el.latlng;
      setPlacePosition(latLng.lat, latLng.lng);
      distance.value = marker_distance();
    }

    const arrLatLng = (latLng) => {
      return [latLng.lat, latLng.lng]
    }

    const marker_distance = () => {
      let markerDistance = getDistance(arrLatLng(currentMarker.value), arrLatLng(pinMarker.value));
      markerDistance = metersToKm(markerDistance);
      return markerDistance;
    };

    const radiusInMeters = computed(() => {
      return kmToMeters(markerRadius.value);
    });

    const distanceDisplay = computed(() => {
      return Number(distance.value).toFixed(4);
    });

    const outOfRange = computed(() => {
      return (distance.value > markerRadius.value && detectDistance.value) ? '#ff0000' : '#35495d';
    });

    // Watch
    watch(detectDistance, (detect) => {
      if (detect) {
        detectRadiusDistance();
      } else {
        removeDetectRadiusDistance();
      }
      localStorage.setItem("detectDistance", detect);
    });

    watch(followMyLocation, (follow) => {
      if (follow && detectDistance.value) {
        setMapToPlacePosition(currentMarker.value);
      }
      localStorage.setItem("followMyLocation", follow);
    });
    // End Watch

    // Lifecycle
    onMounted(() => {
      let lastPinLocation = localStorage.getItem("pinMarker");
      if ( lastPinLocation !== undefined ) {
        try {
          lastPinLocation = JSON.parse(lastPinLocation);
          setPlacePosition(lastPinLocation.latitude, lastPinLocation.longitude);
        } catch (e) {
          setCurrentPlacePosition();
        }
      } else {
        setCurrentPlacePosition();
      }

      let lastCurrentLocation = localStorage.getItem("currentMarker");
      if ( lastCurrentLocation !== undefined ) {
        try {
          lastCurrentLocation = JSON.parse(lastCurrentLocation);
          currentMarker.value = leaflet.latLng(lastCurrentLocation.latitude, lastCurrentLocation.longitude);
        } catch (e) {}
      }

      let detect = localStorage.getItem("detectDistance");
      if ( detect !== null ) {
        detect = (detect === "true");
        try {
          detectDistance.value = detect;
          // if (detect) detectRadiusDistance();
        } catch (e) {}
      }

      let lastFollowMyLocation = localStorage.getItem("followMyLocation");
      if ( lastFollowMyLocation !== null ) {
        lastFollowMyLocation = (lastFollowMyLocation === "true");
        try {
          followMyLocation.value = lastFollowMyLocation
        } catch (e) {}
      }
    });

    onUnmounted(() => {
      // Clear timer when exit
      removeDetectRadiusDistance();
    });
    // End Lifecycle

    return {
      zoom,
      markerRadius,
      mapCenter,
      pinMarker,
      currentMarker,
      detectDistance,
      distanceDisplay,
      followMyLocation,
      currentMarkerIcon,
      radiusInMeters,
      moveMarker,
      mapContainer,
      marker,
      markerCircle,
      outOfRange,
      setCurrentPlacePosition,
      setMapToPlacePosition,
    }
  },
};
</script>

<template>
  <div id="mapLayer" class="h-full">
    <l-map
      ref="mapContainer"
      id="mapContainer"
      v-model="zoom"
      v-model:zoom="zoom"
      :center="mapCenter"
    >
      <l-tile-layer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        layer-type="base"
        name="OpenStreetMap"
        attribution="&copy; <a href='https://openstreetmap.org/copyright'>OpenStreetMap contributors</a>"
      ></l-tile-layer>

      <l-marker ref="marker" :lat-lng="pinMarker" draggable @move="moveMarker" :zIndexOffset="999" />
      <l-circle ref="markerCircle" :lat-lng="pinMarker" :radius="radiusInMeters" :fill="true" :fill-color="outOfRange" />

      <l-marker :lat-lng="currentMarker" :visible="detectDistance" :zIndexOffset="100" :icon="currentMarkerIcon" />

      <l-control class="leaflet-control leaflet-options-control">
        <button @click="setCurrentPlacePosition" class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-xs sm:text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Set to Current Location</button>

        <label class="block mt-2">
          <span class="block sm:text-xs sm:text-sm font-medium text-gray-700">Radius</span>
          <select class="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-xs sm:text-sm" v-model="markerRadius">
            <option value="10">10 KM</option>
            <option value="20">20 KM</option>
            <option value="30">30 KM</option>
          </select>
        </label>

        <div class="flex mt-2">
          <label class="flex items-center">
            <input type="checkbox" class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded" v-model="detectDistance">
            <span  class="text-xs sm:text-sm font-medium text-gray-700 ml-3">Detect Distance</span>
          </label>
        </div>
        <label class="block mt-2" v-if="detectDistance">
          <span class="text-xs sm:text-sm font-medium text-gray-700">Distance : <strong>{{distanceDisplay}} KM</strong></span>
        </label>
        <div class="flex mt-2" v-if="detectDistance">
          <label class="flex items-center">
            <input type="checkbox" class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded" v-model="followMyLocation">
            <span  class="text-xs sm:text-sm font-medium text-gray-700 ml-3">Follow My Location</span>
          </label>
        </div>
      </l-control>

      <l-control-scale position="bottomleft" />
    </l-map>
  </div>
</template>

<style scored>
  #mapLayer {
    width: 100%;
  }
  .leaflet-options-control {
    background: white;
    border: 1px solid steelblue;
    border-radius: 0.6em;
    padding: 0.5em;
    text-align: left;
  }
  .leaflet-control-layers-base {
    text-align: left;
  }
</style>
