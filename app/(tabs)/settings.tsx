import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function SettingsPage() {

  return (
    <View style={styles.container}>

      <View style={styles.top}>
        <Text style={styles.title}>Account Settings</Text>
      </View>

      {/* Settings Card */}
      <View style={styles.card}>
        <View style={styles.field}>
          <Text style={styles.label}>First Name</Text>
          <TextInput
            style={styles.input}
            placeholder="First Name"
            placeholderTextColor="#888"
            autoCapitalize="words"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Last Name"
            placeholderTextColor="#888"
            autoCapitalize="words"
          />
        </View>


        <TouchableOpacity style={styles.updateBtn}>
          <Ionicons name="save-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.updateBtnTxt}>Update Info</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={18} color="#fff" style={{ marginRight: 7 }} />
          <Text style={styles.deleteBtnTxt}>Delete Account</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutBtn}>
          <Ionicons name="exit-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.logoutBtnTxt}>Logout</Text>
        </TouchableOpacity>
      </View>

    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    alignItems: "center",
    justifyContent: "flex-start",
    position: "relative"
  },
  field: {
    width: "100%",
    marginBottom: 18,
  },
  label: {
    color: "#b4b4b4",
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 6,
    marginLeft: 2,
    letterSpacing: 0.3,
  },
  top: {
    width: "100%",
    paddingTop: 30,
    height: 140,
    alignItems: "center",
    marginBottom: 10,
  },
  welcome: {
    fontSize: 38,
    marginTop: 32,
    color: "#1DB954",
    fontWeight: "bold",
    marginBottom: 14,
    letterSpacing: 1,
    textAlign: "center"
  },
  card: {
    backgroundColor: "#23272f",
    borderRadius: 22,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    alignItems: "center"
  },
  input: {
    width: "100%",
    backgroundColor: "#191c24",
    color: "#e3ffdd",
    marginBottom: 15,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 12,
    fontSize: 18,
    borderWidth: 1,
    borderColor: "#232f24"
  },
  updateBtn: {
    backgroundColor: "#1DB954",
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 28,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 8,
    width: 275
  },
  updateBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 17 },
  deleteBtn: {
    backgroundColor: "#D32F2F",
    borderRadius: 10, paddingVertical: 12, paddingHorizontal: 26,
    alignItems: "center", marginBottom: 10, width: 275,
    flexDirection: "row", justifyContent: "center"
  },
  deleteBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 16 },
  logoutBtn: {
    backgroundColor: "#283043",
    borderRadius: 10, paddingVertical: 12, paddingHorizontal: 26,
    alignItems: "center", marginTop: 10, width: 275,
    flexDirection: "row", justifyContent: "center"
  },
  logoutBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 16 },
  msg: {
    color: "#88dda5",
    textAlign: "center",
    marginVertical: 12,
    fontSize: 15,
    fontWeight: "500"
  },
  footerBar: {
    position: "absolute",
    bottom: 0,
    paddingBottom: 22,
    right: 25,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 30,
    backgroundColor: "#191c24",
    borderTopWidth: 2,
    borderTopColor: "#23272f",
    paddingTop: 12,
    paddingHorizontal: 24,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: -3 },
    shadowRadius: 14,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    left: 0,
    width: "100%",
    justifyContent: "center"
  },
  fabNormal: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#232c45",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 1, height: 2 },
    shadowRadius: 8,

  },
  fabLabel: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
    marginBottom: 5,
    textAlign: "center",
  },
  fabSelected: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "#1DB954",
    alignItems: "center",
    justifyContent: "center",
    elevation: 9,
    shadowColor: "#59f79b",
    shadowOpacity: 0.55,
    shadowOffset: { width: 1, height: 3 },
    shadowRadius: 12,
    transform: [{ scale: 1.1 }],
    borderWidth: 2,
    borderColor: "#ffd309",
  },
  fabLabelSelected: {
    color: "#ffd309",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 4,
    textShadowColor: "#0005",
    textShadowRadius: 3,
    letterSpacing: 0.8,
    marginBottom: 4,
    textAlign: "center",
  },
  infoContainer: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: {
    color: "#b3b3b3",
    fontSize: 15,
    textAlign: "center",
    letterSpacing: 0.2,
    lineHeight: 22,
  },
  bold: {
    color: "#1DB954",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 0.3,
  },
  heart: {
    color: "#de2c66",
    fontWeight: "bold",
  },
  meta: {
    color: "#888",
    fontSize: 13,
    fontStyle: "italic",
  },
  title: {
    color: "#fff",
    fontSize: 38,
    fontWeight: "bold",
    letterSpacing: 1,
    marginTop: 22,
  }

});

// for notifying, The whole design is inspired by Aryan Bhanot's earlier work on the Tune Space music app.
// Here is the link to the original repository:

// https://github.com/aryanbhanot05/Tune_Space/blob/master/app/Settings.tsx

// Thank You for reviewing my code!