import React, {Component, useState} from 'react';
import { StyleSheet, Button, Text, TextInput, View, Dimensions, AsyncStorage, Modal } from 'react-native';
import MapView from 'react-native-maps';
import * as Location from 'expo-location';


export default class App extends Component   {

    constructor(props) {
        super(props);

        this.state = {
            cargando: true,
            esModal: false,
            moviendose: false,
            coords: {
                latitude:0.0,
                longitude:0.0,
            },
            dispositivos: [],
        }

    }

    async componentDidMount() {

        let position = await AsyncStorage.getItem('USER_POSITION');
        console.log('position => ', JSON.parse(position) );

        if (position != null) {
            console.log('AsyncStorage.getItem("USER_POSITION") => ',  JSON.parse(position));

            // SI HAY POSICION GUARDADA
            let {coords} = this.state;
            coords.latitude= JSON.parse(position).latitude;
            coords.longitude= JSON.parse(position).longitude;

            // Actualizo posicion del usuario monitor
            await this.setState({coords});

        } else {

            // Obtengo y guardo posicion
            // Posicion inicial solo cuando se registra
            let { status } = await Location.requestPermissionsAsync();
            if (status !== 'granted') {
                alert('No tiene permiso para obtener posición del dispositivo');
            } else {
                let location = await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.High});
                let {coords} = await this.state;
                coords.latitude=location.coords.latitude;
                coords.longitude=location.coords.longitude;
                await this.setState({coords});
                console.log('coords => ', coords);
                AsyncStorage.setItem('USER_POSITION', JSON.stringify(coords) );
            }


        }

        this.timer = setInterval(async ()=> {
            if (!this.state.moviendose) {await this.obtenerDispositivos();}
        }, 6000);


    }


    async obtenerDispositivos() {
        await fetch(
            'http://xx.xx.xx.xx:xxxx/api/v1/tracking',
            {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                method: "GET",
                body: null
            }
        )
        .then(async (response) => await response.json())
        .then(async (responseJson) => {

            // console.log('responseJson => ', responseJson);

            if ( responseJson.success){
                let {dispositivos} = this.state;
                dispositivos = [... responseJson.devices];
                await this.setState({dispositivos});
            }
        })
        .catch((error) => {
            console.log('Error => ', error);
        });

        // console.log(this.state.dispositivos);

    }

    renderMarcadores() {
        const {dispositivos} = this.state;

        return (
            dispositivos.map((dispositivo, index) => {
                const coords = {
                    latitude: dispositivo.position.latitude,
                    longitude: dispositivo.position.longitude,
                };

                const metadata = `Dispositivo #: ${dispositivo.device}`;

                return (
                    <MapView.Marker
                        key={dispositivo.device}
                        coordinate={coords}
                        title={dispositivo.device}
                        description={metadata}
                    />
                )
            })
        )
    }


    render() {
        const {coords, dispositivos} = this.state;
        console.log(dispositivos);
        return (
            <View style={styles.container}>
              <MapView
                  style={styles.mapStyle}
                  zoomEnabled={true}
                  initialRegion={{
                      latitude: coords?.latitude,
                      longitude: coords?.longitude,
                      latitudeDelta: 0.0452,
                      longitudeDelta: 0.0221
                  }}
                  loadingEnabled={false}
                  showsUserLocation={true}
                  showsMyLocationButton={true}
                  showsBuildings={false}
                  zoomControlEnabled={true}
                  minZoomLevel={13}
                  maxZoomLevel={17}
                  onRegionChangeComplete={region => {
                      Math.round(Math.log(360 / region.latitudeDelta) / Math.LN2)
                  }}
              >
                <MapView.Marker
                    key={1}
                    coordinate={{
                        latitude: coords?.latitude,
                        longitude: coords?.longitude,
                    }}
                    title="Estoy aquí"
                    // onDragEnd={e => this.movementMarker(e.nativeEvent)}
                    // description={metadata}
                />
                {(dispositivos.length==0) ? null : this.renderMarcadores()}
              </MapView>

            </View>
        );
    }



}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    mapStyle: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
});