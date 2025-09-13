import { useFonts } from 'expo-font';
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { getSession } from "../lib/supabase_auth";

export default function SignIn_Page() {
    const router = useRouter();

    const [fontsLoaded] = useFonts({
        'Valestine': require('../assets/fonts/Valestine.ttf'),
        'Retro': require('../assets/fonts/Retro Vintage.ttf'),
        'Luckiest Guy': require('../assets/fonts/LuckiestGuy-Regular.ttf'),
    });

    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const checkSession = async () => {
            try {
                const currentSession = await getSession();
                if (currentSession) {
                    router.replace("/(tabs)/main");
                }
            } catch (err) {
                console.error("Error checking session:", err);
            } finally {
                setLoading(false);
            }
        };
        checkSession();
    }, []);

    const handleGuest = () => {
        router.replace('../(tabs)/main');
    };

    if (!fontsLoaded || loading) {
        return (
            <View style={styles.loadingContainer}>
                <Image
                    style={styles.loadingLogo}
                    source={require('../assets/images/Emotify.png')}
                    resizeMode="contain"
                />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Image style={styles.logo} source={require('../assets/images/Emotify.png')} />
            <Text style={styles.quotesText}>Millions of Songs</Text>
            <Text style={styles.quotesText}>Free On <Text style={styles.text}>Emotify !</Text></Text>
            <Text style={styles.quotesText}>Melodies to Match Moods</Text>

            <View style={styles.buttonContainer}>
                <View style={styles.signbuttonContainer}>

                    <TouchableOpacity
                        style={styles.authButton}
                        onPress={() => router.push({ pathname: '/signin_followup', params: { isSignIn: 'true' } })}
                    >
                        <Text style={styles.authButtonText}>Sign In</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.authButton}
                        onPress={() => router.push({ pathname: '/signin_followup', params: { isSignIn: 'false' } })}
                    >
                        <Text style={styles.authButtonText}>Sign Up</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    onPress={handleGuest}
                    style={styles.guestButton}
                >
                    <Text style={styles.guestText}>Continue as a guest</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#11161a',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#11161a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingLogo: {
        width: 250,
        height: 250,
        opacity: 0.5,
    },
    text: {
        color: 'white',
        fontSize: 70,
        fontFamily: 'Retro',
        marginBottom: 40,
    },
    subtitle: {
        color: '#ccc',
        fontSize: 24,
        fontFamily: 'PlayfairDisplay',
        marginBottom: 20,
    },
    quotesText: {
        fontSize: 29,
        fontFamily: "Luckiest Guy",
        color: 'white',
        textAlign: 'center',
        width: '100%',
    },
    logo: {
        width: '100%',
        height: 270,
        resizeMode: 'contain',
        marginBottom: 40,
    },
    buttonContainer: {
        width: '100%',
        alignItems: 'center',
        gap: 20,
        marginTop: 30,
    },
    signbuttonContainer: {
        alignItems: 'center',
        gap: 20,
        marginTop: 30,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '80%',
    },
    authButton: {
        borderRadius: 10,
        backgroundColor: '#fff',
        width: '46.5%',
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    authButtonText: {
        fontSize: 26,
        fontFamily: "Retro",
        color: '#211e1e',
    },
    guestButton: {
        borderRadius: 10,
        backgroundColor: '#888',
        width: '80%',
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    guestText: {
        fontSize: 30,
        fontFamily: "Retro",
        color: 'white',
        width: '100%',
        textAlign: 'center',
    },
});