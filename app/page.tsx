"use client";
import React from "react";

export default function HomePage() {
  return (
    <main style={{padding:24,fontFamily:"system-ui"}}>
      <h1>WeatherVision — Dev Ready</h1>
      <p>App router is present. Your API routes and pages will work now.</p>
      <p>Open <code>/api/weather?city=London</code> to test the API.</p>
    </main>
  );
}
