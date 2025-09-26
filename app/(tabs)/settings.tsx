import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';
import { deleteUser, updateUser } from '../../lib/supabase_crud';
import AnimatedTabButton from '@/components/AnimatedTabButton';

const AnimatedBackButton = ({ onPress }: { onPress: () => void }) => {
  // Hooks are defined UNCONDITIONALLY at the top level of this component.
  // Start the animation value off-screen (e.g., -100 units above its final position)
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    // Animate the value to 0 (its natural position) on mount
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 1000, // Fast and smooth slide-in
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []); // Only runs when this component mounts

  return (
    // Apply the translateY transformation to the entire Back Button wrapper
    <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity style={styles.backBtn} onPress={onPress}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const SectionContent = ({ activeSection, state, handlers }: {
  activeSection: string;
  state: any;
  handlers: any;
}) => {
  const { firstName, lastName, email, msg, notificationsEnabled, darkModeEnabled, feedbackText } = state;
  const { setFirstName, setLastName, setEmail, handleUpdate, handleDelete, handleLogout, setNotificationsEnabled, setDarkModeEnabled, setFeedbackText, handleSendFeedback } = handlers;

  switch (activeSection) {
    case 'account':
      return (
        <View style={styles.sectionContent}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <View style={styles.field}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First Name"
              placeholderTextColor="#888"
              autoCapitalize="words"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last Name"
              placeholderTextColor="#888"
              autoCapitalize="words"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor="#888"
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
          <TouchableOpacity style={styles.updateBtn} onPress={handleUpdate}>
            <Ionicons name="save-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.updateBtnTxt}>Update Info</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={18} color="#fff" style={{ marginRight: 7 }} />
            <Text style={styles.deleteBtnTxt}>Delete Account</Text>
          </TouchableOpacity>
          {msg ? <Text style={styles.msg}>{msg}</Text> : null}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="exit-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.logoutBtnTxt}>Logout</Text>
          </TouchableOpacity>
        </View>
      );
    case 'general':
      return (
        <View style={styles.sectionContent}>
          <Text style={styles.sectionTitle}>General Settings</Text>
          <View style={[styles.field, { marginTop: 15 }]}>
            <View style={styles.row}>
              <Text style={styles.label}>Notifications</Text>
              <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} trackColor={{ false: '#888', true: '#1DB954' }} />
            </View>
          </View>
          <View style={styles.field}>
            <View style={styles.row}>
              <Text style={styles.label}>Dark Mode</Text>
              <Switch value={darkModeEnabled} onValueChange={setDarkModeEnabled} trackColor={{ false: '#888', true: '#1DB954' }} />
            </View>
          </View>
        </View>
      );
    case 'about':
      return (
        <View style={styles.sectionContent}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              <Text style={styles.bold}>Tune Space</Text> — Crafted with <Text style={styles.heart}>♥</Text> by Aryan Bhanot{"\n"}
              Version 1.0.0{"\n"}
              <Text style={styles.meta}>© 2025 Arydew. All rights reserved.</Text>
            </Text>
          </View>
        </View>
      );
    case 'feedback':
      return (
        <View style={styles.sectionContent}>
          <Text style={styles.sectionTitle}>Feedback</Text>
          <View style={styles.field}>
            <Text style={styles.label}>Your Feedback</Text>
            <TextInput
              style={[styles.input, styles.feedbackInput]}
              value={feedbackText}
              onChangeText={setFeedbackText}
              placeholder="Tell us what you think..."
              placeholderTextColor="#888"
              multiline
              numberOfLines={4}
            />
          </View>
          <TouchableOpacity style={styles.updateBtn} onPress={handleSendFeedback}>
            <Ionicons name="send-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.updateBtnTxt}>Send Feedback</Text>
          </TouchableOpacity>
        </View>
      );
    default:
      return null;
  }
};

export default function SettingsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  const expandAnim = useRef(new Animated.Value(0)).current; // 0: collapsed, 1: expanded
  const contentOpacityAnim = useRef(new Animated.Value(0)).current;

  // useEffect(() => {
  //   supabase.auth.getSession().then(({ data: { session } }) => {
  //     if (!session?.user?.id) {
  //       router.replace('/');
  //       return;
  //     }
  //     setUserId(session.user.id);
  //     getUserById(session.user.id).then(user => {
  //       if (user) {
  //         setFirstName(user.first_name || '');
  //         setLastName(user.last_name || '');
  //         setEmail(user.email || '');
  //       }
  //     });
  //   });
  // }, []);

  const handleUpdate = async () => {
    setMsg('');
    try {
      if (!userId) return;
      await updateUser(userId, { first_name: firstName, last_name: lastName, email });
      setMsg('Account info updated!');
    } catch {
      setMsg('Update failed.');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  const handleDelete = async () => {
    setMsg('');
    if (!userId) return;
    Alert.alert('Are you sure?', 'This will delete your account forever!', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteUser(userId);
          await supabase.auth.signOut();
          router.replace('/');
        },
      },
    ]);
  };

  const handleSendFeedback = () => {
    Alert.alert('Feedback', 'Feedback submitted! (Placeholder)');
    setFeedbackText('');
  };

  // const renderBackButton = () => {
  //       // Start the animation value off-screen (e.g., -100 units above its final position)
  //       const slideAnim = useRef(new Animated.Value(-100)).current; 

  //       useEffect(() => {
  //           // Animate the value to 0 (its natural position) on mount
  //           Animated.timing(slideAnim, {
  //               toValue: 0,
  //               duration: 350, // Fast and smooth slide-in
  //               easing: Easing.out(Easing.cubic),
  //               useNativeDriver: true,
  //           }).start();
  //       }, []);

  //       return (
  //           // Apply the translateY transformation to the entire Back Button wrapper
  //           <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
  //               <TouchableOpacity style={styles.backBtn} onPress={() => setActiveSection(null)}>
  //                   <Ionicons name="arrow-back" size={24} color="#fff" />
  //                   <Text style={styles.backText}>Back</Text>
  //               </TouchableOpacity>
  //           </Animated.View>
  //       );
  //   };

  const handleSectionOpen = (section: string) => {
    setActiveSection(section);

    // Sequence for opening: Expand (1000ms) then fade in content (300ms)
    Animated.sequence([
      Animated.timing(expandAnim, {
        toValue: 1,
        duration: 1000, // 1 second expansion as requested
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacityAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ]).start();
  }

  const handleSectionClose = () => {
    // Sequence for closing: Fade out content (300ms) then collapse (500ms)
    Animated.sequence([
      Animated.timing(contentOpacityAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(expandAnim, {
        toValue: 0,
        duration: 500, // Faster collapse for quick return
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      })
    ]).start(() => {
      setActiveSection(null);
      // Ensure content opacity is reset for the next open animation
      contentOpacityAnim.setValue(0);
    });
  }

  const stateProps = { firstName, lastName, email, msg, notificationsEnabled, darkModeEnabled, feedbackText };
  const handlerProps = { setFirstName, setLastName, setEmail, handleUpdate, handleDelete, handleLogout, setNotificationsEnabled, setDarkModeEnabled, setFeedbackText, handleSendFeedback };


  // const renderAccountSection = () => (
  //   <View style={styles.fullScreenContainer}>
  //     <AnimatedBackButton onPress={() => setActiveSection(null)} />
  //     <View style={styles.sectionCard}>
  //       <Text style={styles.sectionTitle}>Account Settings</Text>
  //       <View style={styles.field}>
  //         <Text style={styles.label}>First Name</Text>
  //         <TextInput
  //           style={styles.input}
  //           value={firstName}
  //           onChangeText={setFirstName}
  //           placeholder="First Name"
  //           placeholderTextColor="#888"
  //           autoCapitalize="words"
  //         />
  //       </View>
  //       <View style={styles.field}>
  //         <Text style={styles.label}>Last Name</Text>
  //         <TextInput
  //           style={styles.input}
  //           value={lastName}
  //           onChangeText={setLastName}
  //           placeholder="Last Name"
  //           placeholderTextColor="#888"
  //           autoCapitalize="words"
  //         />
  //       </View>
  //       <View style={styles.field}>
  //         <Text style={styles.label}>Email</Text>
  //         <TextInput
  //           style={styles.input}
  //           value={email}
  //           onChangeText={setEmail}
  //           placeholder="Email"
  //           placeholderTextColor="#888"
  //           autoCapitalize="none"
  //           keyboardType="email-address"
  //         />
  //       </View>
  //       <TouchableOpacity style={styles.updateBtn} onPress={handleUpdate}>
  //         <Ionicons name="save-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
  //         <Text style={styles.updateBtnTxt}>Update Info</Text>
  //       </TouchableOpacity>
  //       <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
  //         <Ionicons name="trash-outline" size={18} color="#fff" style={{ marginRight: 7 }} />
  //         <Text style={styles.deleteBtnTxt}>Delete Account</Text>
  //       </TouchableOpacity>
  //       {msg ? <Text style={styles.msg}>{msg}</Text> : null}
  //       <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
  //         <Ionicons name="exit-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
  //         <Text style={styles.logoutBtnTxt}>Logout</Text>
  //       </TouchableOpacity>
  //     </View>
  //   </View>
  // );

  // const renderGeneralSection = () => (
  //   <View style={styles.fullScreenContainer}>
  //     <AnimatedBackButton onPress={() => setActiveSection(null)} />
  //     <View style={styles.sectionCard}>
  //       <Text style={styles.sectionTitle}>General Settings</Text>
  //       <View style={styles.field}>
  //         <View style={styles.row}>
  //           <Text style={styles.label}>Notifications</Text>
  //           <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} trackColor={{ false: '#888', true: '#1DB954' }} />
  //         </View>
  //       </View>
  //       <View style={styles.field}>
  //         <View style={styles.row}>
  //           <Text style={styles.label}>Dark Mode</Text>
  //           <Switch value={darkModeEnabled} onValueChange={setDarkModeEnabled} trackColor={{ false: '#888', true: '#1DB954' }} />
  //         </View>
  //       </View>
  //     </View>
  //   </View>
  // );

  // const renderAboutSection = () => (
  //   <View style={styles.fullScreenContainer}>
  //     <AnimatedBackButton onPress={() => setActiveSection(null)} />
  //     <View style={styles.sectionCard}>
  //       <Text style={styles.sectionTitle}>About</Text>
  //       <Text style={styles.infoText}>
  //         <Text style={styles.bold}>Tune Space</Text> — Crafted with <Text style={styles.heart}>♥</Text> by Aryan Bhanot{"\n"}
  //         Version 1.0.0{"\n"}
  //         <Text style={styles.meta}>© 2025 Arydew. All rights reserved.</Text>
  //       </Text>
  //     </View>
  //   </View>
  // );

  // const renderFeedbackSection = () => (
  //   <View style={styles.fullScreenContainer}>
  //     <AnimatedBackButton onPress={() => setActiveSection(null)} />
  //     <View style={styles.sectionCard}>
  //       <Text style={styles.sectionTitle}>Feedback</Text>
  //       <View style={styles.field}>
  //         <Text style={styles.label}>Your Feedback</Text>
  //         <TextInput
  //           style={[styles.input, styles.feedbackInput]}
  //           value={feedbackText}
  //           onChangeText={setFeedbackText}
  //           placeholder="Tell us what you think..."
  //           placeholderTextColor="#888"
  //           multiline
  //           numberOfLines={4}
  //         />
  //       </View>
  //       <TouchableOpacity style={styles.updateBtn} onPress={handleSendFeedback}>
  //         <Ionicons name="send-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
  //         <Text style={styles.updateBtnTxt}>Send Feedback</Text>
  //       </TouchableOpacity>
  //     </View>
  //   </View>
  // );

  // if (activeSection === 'account') return renderAccountSection();
  // if (activeSection === 'general') return renderGeneralSection();
  // if (activeSection === 'about') return renderAboutSection();
  // if (activeSection === 'feedback') return renderFeedbackSection();

  return (

    <View style={styles.container}>
      {/* Main Content (Title and Buttons) - Fades out to simulate blur/background change */}
      <Animated.View style={[
        styles.mainContent,
        {
          opacity: expandAnim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [1, 0.3, 0], // Fades out to 0 opacity
          })
        }
      ]}>
        <View style={styles.top}>
          <Text style={styles.title}>Settings</Text>
        </View>
        <View style={styles.card}>
          <AnimatedTabButton
            title="Account"
            iconName="person-outline"
            onPress={() => handleSectionOpen('account')}
          />
          <AnimatedTabButton
            title="General"
            iconName="settings-outline"
            onPress={() => handleSectionOpen('general')}
          />
          <AnimatedTabButton
            title="About"
            iconName="information-circle-outline"
            onPress={() => handleSectionOpen('about')}
          />
          <AnimatedTabButton
            title="Feedback"
            iconName="chatbubble-outline"
            onPress={() => handleSectionOpen('feedback')}
          />
        </View>
      </Animated.View>

      {/* The Expanding Full-Screen Overlay for the Section Content */}
      <Animated.View
        pointerEvents={activeSection ? 'auto' : 'none'} // Enable/disable touch events based on visibility
        style={[
          styles.expandingOverlay,
          {
            // Use a tiny scale origin (0.1) that expands to full screen (1)
            transform: [{ scale: expandAnim }],
            // Fade in the whole overlay quickly just to make it appear
            opacity: expandAnim.interpolate({
              inputRange: [0, 0.01, 1],
              outputRange: [0, 1, 1],
              extrapolate: 'clamp',
            }),
          },
        ]}
      >
        {/* Inner Wrapper for Content and Back Button */}
        <Animated.View style={[
          styles.expandedContentWrapper,
          { opacity: contentOpacityAnim }
        ]}>
          <AnimatedBackButton onPress={handleSectionClose} />
          {activeSection && (
            <View style={styles.sectionCard}>
              <SectionContent activeSection={activeSection} state={stateProps} handlers={handlerProps} />
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </View>

    // <View style={styles.container}>
    //   <View style={styles.top}>
    //     <Text style={styles.title}>Settings</Text>
    //   </View>
    //   <View style={styles.card}>
    //     <TouchableOpacity style={styles.tabBtn} onPress={() => setActiveSection('account')}>
    //       <Ionicons name="person-outline" size={24} color="#1DB954" style={styles.tabIcon} />
    //       <Text style={styles.tabTitle}>Account</Text>
    //     </TouchableOpacity>
    //     <TouchableOpacity style={styles.tabBtn} onPress={() => setActiveSection('general')}>
    //       <Ionicons name="settings-outline" size={24} color="#1DB954" style={styles.tabIcon} />
    //       <Text style={styles.tabTitle}>General</Text>
    //     </TouchableOpacity>
    //     <TouchableOpacity style={styles.tabBtn} onPress={() => setActiveSection('about')}>
    //       <Ionicons name="information-circle-outline" size={24} color="#1DB954" style={styles.tabIcon} />
    //       <Text style={styles.tabTitle}>About</Text>
    //     </TouchableOpacity>
    //     <TouchableOpacity style={styles.tabBtn} onPress={() => setActiveSection('feedback')}>
    //       <Ionicons name="chatbubble-outline" size={24} color="#1DB954" style={styles.tabIcon} />
    //       <Text style={styles.tabTitle}>Feedback</Text>
    //     </TouchableOpacity>
    //   </View>
    // </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',

  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
    paddingTop: 40,
  },
  expandingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // Start from a small scale point (simulating the button size)
    transformOrigin: 'top center',
    backgroundColor: "#11161a", // Same background as container for smooth transition
    zIndex: 10, // Ensure it sits above the main content
    paddingHorizontal: 20,
    paddingTop: 70, // Match the padding of the main container
  },
  expandedContentWrapper: {
    flex: 1,
    width: '100%',
  },
  sectionContent: {
    // Style for the inner content once expanded
    width: '100%',
  },
  sectionCard: {
    width: "100%",
    backgroundColor: "#212121",
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 8,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: 'center',
  },
  field: {
    width: "100%",
    marginBottom: 18,
  },
  infoContainer: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
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
    alignItems: "flex-start",
    marginBottom: 20,
  },
  title: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
  },
  mainContent: {
    width: '100%',
    flex: 1,
  },
  card: {
    flex: 1,
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(35,39,47,0.5)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
  },
  tabIcon: {
    marginRight: 12,
  },
  tabTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#b4b4b4',
    flex: 1,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(35,39,47,0.7)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 20,
    width: 80,
    // marginTop: 10,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: 'rgba(25,28,36,0.8)',
    color: '#e3ffdd',
    marginBottom: 15,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 12,
    fontSize: 18,
    borderWidth: 1,
    borderColor: '#232f24',
  },
  feedbackInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  updateBtn: {
    backgroundColor: '#1DB954',
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 28,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 8,
    width: 275,
  },
  updateBtnTxt: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 17,
  },
  deleteBtn: {
    backgroundColor: '#D32F2F',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 26,
    alignItems: 'center',
    marginBottom: 10,
    width: 275,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  deleteBtnTxt: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  logoutBtn: {
    backgroundColor: '#283043',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 26,
    alignItems: 'center',
    marginTop: 10,
    width: 275,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  logoutBtnTxt: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  msg: {
    color: '#88dda5',
    textAlign: 'center',
    marginVertical: 12,
    fontSize: 15,
    fontWeight: '500',
  },
  infoText: {
    color: '#b3b3b3',
    fontSize: 15,
    textAlign: 'center',
    letterSpacing: 0.2,
    lineHeight: 22,
  },
  bold: {
    color: '#1DB954',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  heart: {
    color: '#de2c66',
    fontWeight: 'bold',
  },
  meta: {
    color: '#888',
    fontSize: 13,
    fontStyle: 'italic',
  },
});

// for notifying, The whole design is inspired by Aryan Bhanot's earlier work on the Tune Space music app.
// Here is the link to the original repository:

// https://github.com/aryanbhanot05/Tune_Space/blob/master/app/Settings.tsx

// Thank You for reviewing my code!