import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function WelcomeScreen() {

  const router = useRouter();

  const HandleAnalyzeMood = () =>{
    router.push('/capture');
  };
  return (
    <View style={styles.container}>
      <Text  style={styles.text}>Welcome Back (User)</Text>
      
      <TouchableOpacity style={styles.logocontainer} onPress={HandleAnalyzeMood} >
        <Image style={styles.logo} source={require('../../assets/images/Emotify.png')} />
      </TouchableOpacity>
      <Text style={styles.text}>Press The Button above to start.</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#10151b',
    gap: 100,
    
  },
  text: {
    color: 'white',
    fontSize: 25,
  },
  desc: {
    fontSize: 15,
    color: 'white',
  },
  button: {
    color: 'black',
    fontSize: 20,
    fontWeight: 'bold'
  },
  logocontainer:{
    width: '60%',
    aspectRatio: 1,
  },

  logo: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain'
  },
});
