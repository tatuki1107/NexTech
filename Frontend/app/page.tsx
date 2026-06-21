'use client'
import { useEffect, useState } from "react";

export default function Home() {
  const [data, setData] = useState("");

  useEffect(() => {
    fetch("http://localhost:3001/api")
      .then(res => res.json())
      .then(data => setData(data.message))
      .catch(() => setData("API error"));
  }, []);
  
  return <div>{data}</div>;
}