import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Button, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';


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
        <View>
            <Text>We need Permission</Text>
            <Button onPress={requestPermission} title="Grant permission"/>
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
                </View>
            </CameraView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
    flex: 1,
    backgroundColor: '#211e1e',
},
camera: {
   flex: 1
  },
  fliplogocontainer:{
    width: '18%',
    aspectRatio: 1,
    margin: '10%'
  },
  filplogo:{
    width: '100%',
    height: '100%',
    resizeMode: 'contain'
  }
});