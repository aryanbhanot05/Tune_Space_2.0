import React, { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      // detectSessionInUrl will complete the OAuth session on web
      await supabase.auth.getSession();
      router.replace("/(tabs)/search"); 
    })();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#121212",
      }}
    >
      <ActivityIndicator />
      <Text style={{ color: "#eaeaea", marginTop: 12 }}>
        Finishing Spotify sign-in…
      </Text>
    </View>
  );
}
