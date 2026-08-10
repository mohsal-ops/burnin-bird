'use server'
import db from "@/db/db"

export default async function GetPlaces(){
    const places = await db.location.findMany()
    const HowmanyPlaces = places?.length


    if(places === undefined){
        return undefined
    }

    return { places , HowmanyPlaces}

}