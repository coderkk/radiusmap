<script>
import { ref, reactive, computed, watch, onMounted } from 'vue';
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
    const distance = ref(0);
    const markerRadius = ref(10);
    const marker = ref(null);
    const markerCircle = ref(null);
    const mapContainer = ref(null);
    const iconSize = ref([25, 40]);
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

    // currentMarkerIcon.value = leaflet.icon({
    //   iconUrl: 'data:image/png;base64,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',
    //   shadowUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACkAAAApCAQAAAACach9AAACJ0lEQVR4Ae3ShY6bQRADYIeZ3v+9yszMDZPlkSWtslPuiS6+C+8n/zNp4p/froi8Jq/Jxk+TkwmHX//Wz8lG3jNjTeaguabD6HAVbphMwIIzqtd+rzKYhsgUNNcqo3fEBlyyOWmwhbbS4b8SaLBu7SGlpL9gklw3YpYR6J5Bm0zAguspZjvqSVQxqvxsPSJJKYIFKh5A2VIDyMgYfYB9hvcmI0VPTxVZS81ER7qiBoFqBAa9MKOKLzzv2BE3EOnlmDTrNRXryToGOGR65nhvSphjMP6b6WJ6xMYYxSW7l1Pp6CSzbLFPgAN3NGLKPRn3c59qxzapCTPUFNVKh0vUe24azMkW+uRm/B8UU3O3Eiw4nOrrafOSF5gS7PqHUotBQQ6f11p22HDOi+66i2LIHcWJOZrTP+rkhOl7n8YcTzCQIuIvyZPQrvs5Br0OdTsyB+YYrwKokXvsgOIXZzbeQ0DMnhHIqGOdBMEl9qKYAo3pBbbDNkijUSgjv/PrMFhwRwS2YbbMzqg+SzdukoxbeiSEVlgyK6yFmjSYtDxhTXRv1OsgsCb2jflu8hLMyC0P7Qg54NE1qc/MF5PqeAHWSfDL3zxN9dsQ+YD3zEeRS4GeYgFm5I7HNiJPfP4V7/CKeUvwsxpqhkwFzMgjj33Vwe+EnuIxngn8FvNTSCkwmJG+rQm8J/MId/EQL3nZwe2EmSNm9ufkFq9xHzcJPscnLGMRomBKqdzOY2EH+IPOLMEAAAAASUVORK5CYII=',
    //   iconSize:     [25, 41], // size of the icon
    //   shadowSize:   [41, 41], // size of the shadow
    //   iconAnchor:   [0, 0], // point of the icon which will correspond to marker's location
    //   shadowAnchor: [0, 0],  // the same for the shadow
    //   popupAnchor:  [0, 0] // point from which the popup should open relative to the iconAnchor
    // });

    currentMarkerIcon.value = leaflet.icon({
      iconUrl: 'data:image/png;base64,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',
    });

    const setPlacePosition = (latitude, longitude) => {
      pinMarker.value = leaflet.latLng(latitude, longitude);
      localStorage.setItem("pinMarker", JSON.stringify({latitude: latitude, longitude: longitude}));
    }

    const setCurrentPlacePosition = () => {
      getLocation().then((pos) => {
        setPlacePosition(pos.coords.latitude, pos.coords.longitude);
        setMapToPlacePosition();
        distance.value = marker_distance();
      });
    };

    const setMapToPlacePosition = () => {
      let latlng = pinMarker.value;
      mapCenter.value = leaflet.latLng(latlng.lat, latlng.lng);
    };

    watch(detectDistance, (detect) => {
      if (detect) {
        detectRadiusDistance();
      } else {
        removeDetectRadiusDistance();
      }
      localStorage.setItem("detectDistance", detect);
    });

    const detectRadiusDistance = () => {
      removeDetectRadiusDistance();
      watchPositionId = navigator.geolocation.watchPosition((pos) => {
        currentMarker.value = leaflet.latLng(pos.coords.latitude, pos.coords.longitude);
        localStorage.setItem("currentMarker", JSON.stringify({latitude: pos.coords.latitude, longitude: pos.coords.longitude}));
        distance.value = marker_distance();
      }, (error) => {
        console.log('detectRadiusDistance', error);
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
    });

    return {
      zoom,
      iconSize,
      distanceDisplay,
      radiusInMeters,
      currentMarker,
      markerRadius,
      pinMarker,
      moveMarker,
      marker,
      markerCircle,
      mapContainer,
      mapCenter,
      setMapToPlacePosition,
      marker_distance,
      outOfRange,
      detectDistance,
      setCurrentPlacePosition,
      currentMarkerIcon,
    }
  },
};
</script>

<template>
  <div id="mapLayer">
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
      <l-control-layers />

      <l-marker ref="marker" :lat-lng="pinMarker" draggable @move="moveMarker" :zIndexOffset="999" />
      <l-circle ref="markerCircle" :lat-lng="pinMarker" :radius="radiusInMeters" :fill="true" :fill-color="outOfRange" />

      <l-marker :lat-lng="currentMarker" :visible="detectDistance" :zIndexOffset="100"/>

      <l-control class="leaflet-control leaflet-options-control">
        <button @click="setCurrentPlacePosition" class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Set to Current Location</button>

        <label class="block mt-2">
          <span class="block text-sm font-medium text-gray-700">Radius</span>
          <select class="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" v-model="markerRadius">
            <option value="10">10 KM</option>
            <option value="20">20 KM</option>
            <option value="30">30 KM</option>
          </select>
        </label>

        <div class="flex mt-2">
          <label class="flex items-center">
            <input type="checkbox" class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded" v-model="detectDistance">
            <span  class="font-medium text-gray-700 ml-3">Detect Distance</span>
          </label>
        </div>
        <label class="block mt-2" v-if="detectDistance">
          <span class="font-medium text-gray-700">Distance : <strong>{{distanceDisplay}} KM</strong></span>
        </label>
      </l-control>

      <l-control-scale position="bottomleft" />
    </l-map>
  </div>
</template>

<style scored>
  #mapLayer {
    height: calc(100% - 70px);
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
