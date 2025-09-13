import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { signIn, signUp } from "../lib/supabase_auth";
import { createUser } from "../lib/supabase_crud";

export default function SupabaseAuth() {
    const router = useRouter();
    const { isSignIn: isSignInParam } = useLocalSearchParams();

    const [fontsLoaded] = useFonts({
        'Valestine': require('../assets/fonts/Valestine.ttf'),
        'Retro': require('../assets/fonts/Retro Vintage.ttf'),
        'Luckiest Guy': require('../assets/fonts/LuckiestGuy-Regular.ttf'),
    });

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [isSignIn, setIsSignIn] = useState(isSignInParam === 'true');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAuth = async () => {
        if (
            !email ||
            !password ||
            (!isSignIn && (!firstName.trim() || !lastName.trim()))
        ) {
            setError("Please fill in all required fields.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if (isSignIn) {
                await signIn(email, password);
            } else {
                const data = await signUp(email, password);
                const user = data.user || (data.session && data.session.user) || null;

                if (!user || !user.id) throw new Error("Sign up did not return a user object.");

                await createUser({
                    uuid: user.id,
                    first_name: firstName.trim(),
                    last_name: lastName.trim(),
                    email: email,
                });
            }

            router.replace("/(tabs)/main");

        } catch (err: any) {
            setError(err.message || "Authentication failed");
        } finally {
            setLoading(false);
        }
    };

    const handleGuest = () => {
        router.replace('../(tabs)/main');
    };

    if (!fontsLoaded) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ffffff" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Image style={styles.logo} source={require('../assets/images/Emotify.png')} />
            <Text style={[styles.guestText , { position: 'absolute', top: 180 }]}>
                {isSignIn ? <>Sign In to <Text style={styles.text}>Emotify</Text></> : "Listen for Free"}
            </Text>
            <View style={styles.textinputcontainer}>
                {!isSignIn && (
                    <>
                        <View style={styles.inputWrapper}>
                            <FontAwesome size={20} name="user" color="#000" />
                            <TextInput
                                style={styles.textinput}
                                placeholder="First Name"
                                placeholderTextColor="#6a6a6a"
                                value={firstName}
                                onChangeText={setFirstName}
                                autoCapitalize="words"
                            />
                        </View>
                        <View style={styles.inputWrapper}>
                            <FontAwesome size={20} name="user" color="#000" />
                            <TextInput
                                style={styles.textinput}
                                placeholder="Last Name"
                                placeholderTextColor="#6a6a6a"
                                value={lastName}
                                onChangeText={setLastName}
                                autoCapitalize="words"
                            />
                        </View>
                    </>
                )}

                <View style={styles.inputWrapper}>
                    <FontAwesome size={20} name="envelope" color="#000" />
                    <TextInput
                        style={styles.textinput}
                        placeholder="Email"
                        placeholderTextColor="#6a6a6a"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>
                <View style={styles.inputWrapper}>
                    <FontAwesome size={22} name="lock" color="#000" />
                    <TextInput
                        style={styles.textinput}
                        placeholder="Password"
                        placeholderTextColor="#6a6a6a"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                </View>
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity
                style={styles.signbutton}
                onPress={handleAuth}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#ffffff" />
                ) : (
                    <Text style={styles.signintext}>
                        {isSignIn ? "Sign In" : "Sign Up"}
                    </Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => {
                    setIsSignIn(!isSignIn);
                    setError(null);
                    setEmail('');
                    setPassword('');
                    setFirstName('');
                    setLastName('');
                }}
                style={styles.signbuttonfixed}
            >
                <Text style={styles.signintext}>
                    {isSignIn ? "Sign Up for Free" : "Go Back"}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleGuest} style={styles.guestButton}>
                <Text style={styles.guestText}>Continue as a guest</Text>
            </TouchableOpacity>
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
    text: {
        color: 'white',
        fontSize: 70,
        fontFamily: 'Retro',
        marginBottom: 40,
        width: '100%',
        textAlign: 'center',
    },
    textinputcontainer: {
        width: '100%',
        alignItems: 'center',
        gap: 20,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 5,
        borderWidth: 2,
        borderColor: 'white',
        width: '85%',
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    textinput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
    },
    signbutton: {
        borderRadius: 10,
        backgroundColor: '#fff',
        marginTop: 30,
        width: '50%',
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    signintext: {
        fontSize: 26,
        fontFamily: "Retro",
        color: '#211e1e',
    },
    signbuttonfixed: {
        position: 'absolute',
        bottom: 115,
        borderRadius: 10,
        backgroundColor: '#fff',
        marginTop: 30,
        width: '50%',
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    errorText: {
        color: 'red',
        marginTop: 10,
        textAlign: 'center',
    },
    guestButton: {
        borderRadius: 10,
        backgroundColor: '#696969ff',
        marginTop: 20,
        width: '70%',
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        position: 'absolute',
        bottom: 50,
    },
    guestText: {
        fontSize: 30,
        fontFamily: "Retro",
        color: 'white',
        textAlign: 'center',
        width: '100%',
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
        height: 100,
        resizeMode: 'contain',
        marginBottom: 40,
        position: 'absolute',
        top: 70,
    },
});
