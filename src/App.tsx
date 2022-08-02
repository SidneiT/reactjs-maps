import { Button, CssBaseline, Grid, MenuItem, Select, SelectChangeEvent, styled, ThemeProvider } from '@mui/material';
import axios from 'axios';
import { Loader } from 'google-maps';
import { sample, shuffle } from 'lodash';
import React, { useEffect, useRef, useState } from 'react';

import Navbar from './components/Navbar';
import theme from './theme';
import { getCurrentPosition } from './utils/geolocation';
import { makeCarIcon, makeMarkerIcon, Map } from './utils/map';
import { Socket, connect as ioConnect } from 'socket.io-client'

const colors = [
  "#b71c1c",
  "#4a148c",
  "#2e7d32",
  "#e65100",
  "#2962ff",
  "#c2185b",
  "#FFCD00",
  "#3e2723",
  "#03a9f4",
  "#827717",
  "#667788",
  "#124c4c",
  "#300000",
];


type LatLng = { lat: number, lng: number }

type Route = {
  id: string,
  title: string,
  startPosition: LatLng,
  endPosition: LatLng,
  points: LatLng[]
}


const GOOGLE_MAPS_API_KEY = "";

const loader = new Loader(GOOGLE_MAPS_API_KEY);

const Form = styled("form")(({ theme: _theme }) => ({
  margin: _theme.spacing(1),
}));

const MapContainer = styled("div")(({ theme: _theme }) => ({
  width: "100%",
  height: "100%",
}));

function App() {
  const mapRef = useRef<Map>();
  const socketIORef = useRef<Socket>();
  const [routes, setRoutes] = useState<Route[]>([])
  const [routeSelected, setRouteSelected] = useState<Route | undefined>(undefined)


  useEffect(() => {
    if (socketIORef.current?.connected) {
      return;
    }
    socketIORef.current = ioConnect("http://localhost:3000");

    const newPositionHandler = (data: { routeId: string; path: LatLng }) => {
      mapRef.current!.moveCurrentMarker(data.routeId, {
        lat: data.path.lat,
        lng: data.path.lng,
      });
    };
    socketIORef.current?.on("new-position", newPositionHandler);

    const finishedRouteHandler = (data: { routeId: string }) => {
      mapRef.current?.removePath(data.routeId);
      alert(`Rota ${data.routeId} finalizada`);
    };

    socketIORef.current?.on("finished-route", finishedRouteHandler);

    return () => {
      socketIORef.current?.off("new-position", newPositionHandler);
      socketIORef.current?.off("finished-route", finishedRouteHandler);
    };
  }, [mapRef]);

  useEffect(() => {
    return () => {
      if (socketIORef.current?.connected) {
        socketIORef.current?.disconnect();
      }
    };
  }, []);


  useEffect(() => {
    (async () => {
      await loader.load();
      const position = await getCurrentPosition({ enableHighAccuracy: true });
      const divMap = document.getElementById("map") as HTMLDivElement;
      mapRef.current = new Map(divMap, {
        zoom: 15,
        center: position,
      });
    })();
  }, []);

  useEffect(() => {
    axios
      .get('http://localhost:3000/routes')
      .then(res => setRoutes(res.data))
  }, [])


  const selectRouteHandler = (e: SelectChangeEvent) => {
    const id = e.target.value
    const selectedRoute = routes.find(r => r.id === id)
    setRouteSelected(selectedRoute)
  }

  const onSubmitHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const color = sample(shuffle(colors)) as string;

    mapRef.current?.addPath(
      routeSelected!.id,
      {
        title: `Rota ${routeSelected!.title}`,
        position: {
          lat: routeSelected!.startPosition.lat,
          lng: routeSelected!.startPosition.lng
        },
        icon: makeCarIcon(color)
      },
      {
        title: `Rota ${routeSelected!.title}`,
        position: {
          lat: routeSelected!.endPosition.lat,
          lng: routeSelected!.endPosition.lng
        },
        icon: makeMarkerIcon(color)
      }
    )

    socketIORef.current!.emit('get-directions', {
      routeId: routeSelected!.id,
    })
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Navbar />
      <Grid container style={{ width: "100%", height: "100%" }}>
        <Grid item xs={12} sm={3}>
          <Form onSubmit={onSubmitHandler}>
            <Select fullWidth displayEmpty defaultValue="" onChange={selectRouteHandler}>
              <MenuItem value="" disabled>
                <em>Selecione uma rota</em>
              </MenuItem>
              {
                routes.map(route => (
                  <MenuItem value={route.id} key={route.id}>{route.title}</MenuItem>
                ))
              }
            </Select>
            <div style={{ textAlign: "center", margin: theme.spacing(1) }}>
              <Button type="submit" variant="contained">
                Iniciar Rota
              </Button>
            </div>
          </Form>
        </Grid>
        <Grid item xs={12} sm={9}>
          <MapContainer id="map" />
        </Grid>
      </Grid>
    </ThemeProvider>
  );
}

export default App;
