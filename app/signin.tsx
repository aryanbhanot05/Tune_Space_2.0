import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { getSession, signIn, signUp } from "../lib/supabase_auth"; // Ensure getSession is exported from supabase_auth
import { createUser } from "../lib/supabase_crud";

export default function SignInScreen() {
  const router = useRouter();

  // State for Form Mode (true = Sign In, false = Sign Up)
  const [isSignIn, setIsSignIn] = useState(true);

  // Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Session Check on Mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await getSession();
        if (session) {
          router.replace("/(tabs)/main");
        }
      } catch (err) {
        console.log("No active session");
      }
    };
    checkSession();
  }, []);

  const handleAuth = async () => {
    setError(null);

    // Basic Validation
    if (!email || !password || (!isSignIn && (!firstName.trim() || !lastName.trim()))) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      if (isSignIn) {
        await signIn(email, password);
      } else {
        const response = await signUp(email, password);

        const user = response.user || (response.session && response.session.user);
        if (user && user.id) {
          await createUser({
            uuid: user.id,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            email: email,
          });
        }
      }
      router.replace("/(tabs)/main");
    } catch (err: any) {
      setError("Authentication failed (Invalid Credentials).");
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    router.replace('../(tabs)/main');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, width: '100%' }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* LOGO & TEXT */}
          <Image
            style={styles.logo}
            source={require('../assets/images/Emotify.png')}
          />
          <Text style={styles.headerText}>
            {isSignIn ? "Welcome to Emotify!" : "Join the Rhythm"}
          </Text>
          <Text style={styles.subText}>
            Millions of songs, free on <Text style={styles.brandText}>Emotify</Text>
          </Text>

          {/* INPUTS CONTAINER */}
          <View style={styles.formContainer}>

            {/* Name Inputs (Only for Sign Up) */}
            {!isSignIn && (
              <View style={styles.row}>
                <View style={[styles.inputWrapper, { flex: 1, marginRight: 10 }]}>
                  <FontAwesome name="user" size={20} color="#000000ff" />
                  <TextInput
                    style={styles.textInput}
                    placeholder="First Name"
                    placeholderTextColor="#000000ff"
                    value={firstName}
                    onChangeText={setFirstName}
                  />
                </View>
                <View style={[styles.inputWrapper, { flex: 1 }]}>
                  <FontAwesome name="user" size={20} color="#000000ff" />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Last Name"
                    placeholderTextColor="#000000ff"
                    value={lastName}
                    onChangeText={setLastName}
                  />
                </View>
              </View>
            )}

            {/* Email Input */}
            <View style={styles.inputWrapper}>
              <FontAwesome name="envelope" size={20} color="#000000ff" />
              <TextInput
                style={styles.textInput}
                placeholder="Email Address"
                placeholderTextColor="#000000ff"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <FontAwesome name="lock" size={24} color="#000000ff" style={{ marginLeft: 2 }} />
              <TextInput
                style={styles.textInput}
                placeholder="Password"
                placeholderTextColor="#000000ff"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {/* Error Message */}
            {error && <Text style={styles.errorText}>{error}</Text>}

            {/* PRIMARY ACTION BUTTON */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleAuth}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#11161a" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {isSignIn ? "Sign In" : "Create Account"}
                </Text>
              )}
            </TouchableOpacity>

            {/* SECONDARY TOGGLE BUTTON */}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                setIsSignIn(!isSignIn);
                setError(null);
              }}
            >
              <Text style={styles.secondaryButtonText}>
                {isSignIn ? "New here? Sign Up" : "Already have an account? Sign In"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* GUEST BUTTON */}
          <TouchableOpacity onPress={handleGuest} style={styles.guestButton}>
            <Text style={styles.guestText}>Continue as Guest</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#11161a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#11161a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    width: '100%',
    height: 210,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  headerText: {
    fontSize: 38,
    fontWeight: 'bold', 
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
  },
  subText: {
    fontSize: 18,
    color: '#ccc',
    marginBottom: 40,
    textAlign: 'center',
  },
  brandText: {
    color: 'white',
    textDecorationLine: 'underline',
  },
  formContainer: {
    width: '100%',
    gap: 15,
    marginBottom: 30,
    alignItems: 'center'
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 30,
    paddingHorizontal: 15,
    height: 45,
    marginBottom: 5,
  },
  textInput: {
    flex: 1,
    marginLeft: 5,
    fontSize: 13,
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  primaryButton: {
    backgroundColor: '#ffffffff',
    borderRadius: 30,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    width: '70%'

  },
  primaryButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#11161a',
  },
  secondaryButton: {
    padding: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#ccc',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  guestButton: {
    paddingVertical: 15,
    width: '100%',
    alignItems: 'center',
  },
  guestText: {
    color: '#666',
    fontSize: 18,
    fontWeight: 'bold', 
  },
  errorText: {
    color: '#ff4d4d',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 5,
  }
});