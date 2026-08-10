import { Loader } from "@googlemaps/js-api-loader"


export default async function getmapFunction({mapRef,lat,lng}:{mapRef:HTMLDivElement,lat: number,lng: number}) {
     const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_MAPS_API_KEY as string,
        version: "weekly"
      })

      


      const { Map } = await loader.importLibrary("maps")

      const position = {
        lat: lat ,
        lng: lng 
      }


      //init Marker 
      const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;


      //maps options
      const mapsOptions: google.maps.MapOptions = {
        center: position,
        zoom: 5,
        mapId: "MY_NEXTJS_MAPID"
      }
      //setup the map

      const map = new Map(mapRef as HTMLDivElement, mapsOptions)


      //set up marker 
      const marker = new AdvancedMarkerElement({
        map: map,
        position: position
      })


 
}
