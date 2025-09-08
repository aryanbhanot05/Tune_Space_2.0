import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function Signin(){

    const router = useRouter();

    const [fontsLoaded] = useFonts({
        'Valestine': require('../assets/fonts/Valestine.ttf'),
        'Retro': require('../assets/fonts/Retro Vintage.ttf'),
    });

    const [username, onChangeText] = useState('');
    const [pass, onChangePassword] = useState('');

    const handleGuest = () => {
        router.replace('../(tabs)/main');
    }
    return(
        <View style={styles.container}>
            <Text style={styles.text}>
                Emotify
            </Text>
            <View style={styles.textinputcontainer}> 
                <View style={styles.firstcontainer}>
                <FontAwesome size={20} name="user" />
            <TextInput 
            style={styles.textinput}
            onChangeText={onChangeText}
            value={username}
            placeholder='Username'/>
                </View>
                <View style={styles.secondcontainer}>
                    <FontAwesome size={22} name="lock"/>
                    <TextInput
                style={styles.textinput}
                onChangeText={onChangePassword}
                value={pass}
                placeholder='Password'/>
                </View>
            </View>
            <TouchableOpacity style={styles.signbutton}>
                <Text style={styles.signintext} >
                    Sign In
                </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleGuest} style={styles.signbutton}>
                <Text style={styles.signintext} >
                    Continue as a guest
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#211e1e',
        justifyContent: 'center',
        alignItems: 'center',
    },
    textinputcontainer:{
        gap: 10,
        alignItems: 'center'
    },
    firstcontainer:{
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
        borderRadius: 5,
        backgroundColor: 'white'
    },
    secondcontainer:{
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
        borderRadius: 5,
        backgroundColor: 'white'
    },
    text: {
        color: 'white',
        fontSize: 100,
        fontFamily: 'Retro',
    },
    textinput:{
        backgroundColor: 'white',
        borderRadius: 7,
        width: '70%',
        
    },
    signbutton:{
        borderRadius: 10,
        backgroundColor: 'lightgray',
        marginTop: 30,
        width: '50%',
        height: '4%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    signintext:{
        fontSize: 30,
        fontFamily: "Retro"
    },
})