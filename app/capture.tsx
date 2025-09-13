import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';


export default function CaptureScreen(){

    const [permission, requestPermission] = useCameraPermissions();

    const [facing, setFacing] = useState<'front' | 'back'>('front');

    function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

    if(!permission){
        return <View/>;
    }

    if(!permission.granted){
        return(
        <View style={styles.grantpermission}>
            <Text style={styles.grant}>We need Permission</Text>
            <TouchableOpacity style={styles.grantpermisson} onPress={requestPermission} >
                <Text style={{fontSize: 20}}>Grant Permission</Text>
            </TouchableOpacity>
        </View>
        )
    }

    return (
        <View style={styles.container}>
            <CameraView style={styles.camera} facing={facing}>
                <View>
                    <TouchableOpacity style={styles.fliplogocontainer} onPress={toggleCameraFacing}>
                        <Image style={styles.filplogo} source={require('../assets/images/CameraFlip.png')}/>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.capture}>
                        <Image style={styles.filplogo} source={require('../assets/images/capture.png')}/>
                    </TouchableOpacity>
                </View>
            </CameraView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
    flex: 1,

},
camera: {
  },
  fliplogocontainer:{
    width: '15%',
    aspectRatio: 1,
    margin: '7%'
  },
  filplogo:{
    width: '100%',
    height: '100%',
    resizeMode: 'contain'
  },
  grantpermission:{
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  grant:{
    fontSize: 25,
    fontWeight: 'bold',
  },
  grantpermisson:{
    backgroundColor: 'skyblue',
    width: '40%',
    height: '4%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15
  },
  capture:{
    width: '25%',
  }

});