"use client"
import React, { useEffect, useRef } from 'react'
import getmapFunction from './getmapFunction'

type MapProps = {
  lat: number
  lng: number
} & React.HTMLAttributes<HTMLDivElement> // <-- allows className, style, etc.

export default function Map({ lat, lng, className, style, ...rest }: MapProps) {


  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getmapFunction({mapRef: mapRef.current as HTMLDivElement,lat:lat as number,lng:lng as number})
  }, [lat])


  return (
    <div className={className} style={{ ...style}} ref={mapRef} {...rest} />
  )
}
