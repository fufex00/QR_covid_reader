import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { Button, StyleSheet, Text, View, FlatList } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Header } from 'react-native-elements';

export default function App() {

  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [valid, setValid] = useState(false);

  const [text, setText] = useState(["Apunte a QR para escanear"]);

  const [personalData, setPersonalData] = useState([]);

  const askCameraPermission = () => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })()
  }

  //request camera permission
  useEffect(() => {
    askCameraPermission();
  }, []);

  //after qr code is scanned
  const handleQRCodeScanned = ({ type, data }) => {
    setScanned(true);
    setText("Esperando...");

    const requestOptions = {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ encryptedUser: data })
    };
    fetch('https://qr-covid-cr.herokuapp.com/api/decrypt', requestOptions)
      .then(response => response.json())
      .then(data => {
        if (data.validQr === false) {
          setValid(false);
          setText("No es un QR de certificación de vacunación Covid");
        } else {
          setValid(true);
          setText("Datos Personales");
          setPersonalData([
            { info: 'Emitido: ' + data.issuedAt, key: '1' },
            { info: 'Expira: ' + data.expiresAt, key: '2' },
            { info: 'Nombre: ' + data.givenName, key: '3' },
            { info: 'Apellidos: ' + data.familyName, key: '4' },
            { info: 'Fecha Nacimiento: ' + data.dateOfBirth, key: '5' },
            { info: 'Vacuna: ' + data.vaccination.vaccineType, key: '6' },
            { info: 'Fabricante: ' + data.vaccination.vaccineManufacturer, key: '7' },
            { info: 'Dosis: ' + data.vaccination.doseNumber + ' dosis de ' + data.vaccination.totalDoses + ' en total', key: '8' },
            { info: 'Fecha Aplicación: ' + data.vaccination.date, key: '9' },
            { info: 'País: ' + data.vaccination.country, key: '10' },
            { info: 'Emisor: ' + data.vaccination.issuer, key: '11' },
            { info: 'ID de certificado: ' + data.vaccination.certificateId, key: '12' },
          ]);
        }
      }).catch((err) => {
        setText(err);
      });

  };

  //check for permission and return the view
  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Solicitando permiso para usar la cámara</Text>
      </View>
    )
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={{ margin: 10 }}>Sin acceso a la cámara</Text>
        <Button title={'Permitir cámara'} onPress={() => askCameraPermission()}></Button>
      </View>
    )
  }

  //return the main view
  return (
    <View style={styles.container}>
      <Header
        centerComponent={{ text: 'CERTIFICACIÓN QR COVID', style: { color: '#fff', fontSize: 16 } }}
        containerStyle={{
          justifyContent: 'space-around',
        }}
      />
      <View style={styles.barcodebox}>
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : handleQRCodeScanned}
          style={{ height: 400, width: 400 }} />
      </View>
      {scanned && <Button title={'¿Escanear uno nuevo?'} onPress={() => { setScanned(false); setText("Esperando..."); }} color='tomato' />}
      <Text style={styles.maintext}>{text}</Text>
      {scanned && valid && <FlatList
        data={personalData}
        renderItem={({ item }) => (
          <Text style={styles.personalDataStyle}>{item.info}</Text>
        )}
      />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 20
  },
  maintext: {
    fontSize: 22,
    margin: 10,
    fontWeight: 'bold',
    fontFamily: 'sans-serif-light'
  },
  barcodebox: {
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 150,
    width: 150,
    overflow: 'hidden',
    borderRadius: 30,
    backgroundColor: 'tomato',
    marginBottom: 10
  },
  personalDataStyle: {
    paddingTop: 4,
    fontSize: 16,
    fontFamily: 'sans-serif-light'
  }
});
