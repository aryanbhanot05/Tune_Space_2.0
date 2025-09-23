// Imports necessary components and hooks from React Native and Expo
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

    // Loads custom fonts for the app. The component will render a loading state until the fonts are ready.
    const [fontsLoaded] = useFonts({
        'Valestine': require('../assets/fonts/Valestine.ttf'),
        'Retro': require('../assets/fonts/Retro Vintage.ttf'),
        'Luckiest Guy': require('../assets/fonts/LuckiestGuy-Regular.ttf'),
    });

    // Initiating state variables for form inputs, loading state, and error handling.
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [isSignIn, setIsSignIn] = useState(isSignInParam === 'true');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Asynchronous function to handle the authentication process (sign-in or sign-up).
    const handleAuth = async () => {
        // Basic input validation to ensure all required fields are filled.
        if (
            !email ||
            !password ||
            (!isSignIn && (!firstName.trim() || !lastName.trim()))
        ) {
            setError("Please fill in all required fields.");
            return;
        }

        // Sets the loading state to true and clears any previous errors.
        setLoading(true);
        setError(null);

        try {
            // If in sign-in mode, calls the signIn function.
            if (isSignIn) {
                await signIn(email, password);
            } else {
                // If in sign-up mode, calls the signUp function.
                const data = await signUp(email, password);
                const user = data.user || (data.session && data.session.user) || null;

                if (!user || !user.id) throw new Error("Sign up did not return a user object.");

                // Creates a user profile in the database with the provided details.
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

    // Function to handle navigating to the main app as a guest.
    const handleGuest = () => {
        router.replace('../(tabs)/main');
    };

    // Renders a loading indicator while fonts are loading.
    if (!fontsLoaded) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ffffff" />
            </View>
        );
    }

    return (
        // Ensures content is within the safe area of the device screen.
        <SafeAreaView style={styles.container}>

            {/* Displays the main app logo, specific text*/}
            <Image style={styles.logo} source={require('../assets/images/Emotify.png')} />
            <Text style={[styles.guestText, { position: 'absolute', top: 180 }]}>
                {isSignIn ? <>Sign In to <Text style={styles.text}>Emotify</Text></> : "Listen for Free"}
            </Text>
            <View style={styles.textinputcontainer}>

                {/* Conditionally renders first and last name inputs only for sign-up. */}
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

                {/* Input field for email. */}
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

                {/* Input field for password. */}
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

            {/* The main button for sign-in or sign-up. */}
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

            {/* Button to switch between sign-in and sign-up forms. */}
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

            {/* Button to proceed as a guest. */}
            <TouchableOpacity onPress={handleGuest} style={styles.guestButton}>
                <Text style={styles.guestText}>Continue as a guest</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

// Stylesheet for the component's UI.
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



// for notifying, The whole design is inspired by Aryan Bhanot's earlier work on the Tune Space music app.
// Here is the link to the original repository:

// https://github.com/aryanbhanot05/Tune_Space

// Thank You for reviewing my code!