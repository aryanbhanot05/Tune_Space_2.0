import AnimatedTabButton from '@/components/AnimatedTabButton';
import { PointsDisplay } from '@/components/PointsDisplay';
import { useNotifications } from '@/contexts/NotificationContext';
import PointsService, { POINTS_VALUES } from '@/lib/pointsService';
import { useTheme } from '@/lib/themeContext';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, FlatList, Modal, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { VideoBackground } from '../../components/VideoBackground';
import { supabase } from '../../lib/supabase';
import { deleteUser, getUserById, updateUser } from '../../lib/supabase_crud';

// Theme selection options for the dropdown
const themeOptions = [
  { label: 'Blue Theme', value: 'bg1' },
  { label: 'Option 1', value: 'bg2' },
  { label: 'Option 2', value: 'bg3' },
  { label: 'Option 3', value: 'bg4' },
  { label: 'Option 4', value: 'bg5' },
  { label: 'Option 5', value: 'bg6' },
  { label: 'Option 6', value: 'bg7' },
  { label: 'Option 7', value: 'bg8' },
  { label: 'Option 8', value: 'bg9' },
  { label: 'Option 9', value: 'bg10' },
];

// Type definition for a theme option
type ThemeOption = {
  label: string;
  value: string;
};

// DropdownItem: Renders a single selectable option in the dropdown
const DropdownItem = ({ item, onSelect }: { item: ThemeOption; onSelect: (item: ThemeOption) => void }) => (
  <TouchableOpacity
    style={styles.option}
    onPress={() => onSelect(item)}
  >
    <Text style={styles.optionText}>{item.label}</Text>
  </TouchableOpacity>
);


// CustomDropdown: Full dropdown component for theme selection
const CustomDropdown = ({ selectedTheme, onSelect, isModalVisible, toggleModal }: {
  selectedTheme: string;
  onSelect: (themeValue: string) => void;
  isModalVisible: boolean;
  toggleModal: () => void;
}) => {
  // Handles selection and closes modal
  const handleSelect = (item: ThemeOption) => {
    onSelect(item.value);
    toggleModal();
  };

  // Renders dropdown modal
  const renderDropdown = () => {
    return (
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={toggleModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={toggleModal}
        >
          {/* Centers dropdown content vertically + horizontally */}
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View style={styles.dropdownContent}>
              {/* FlatList for rendering all available theme options */}
              <FlatList
                data={themeOptions}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                  <DropdownItem item={item} onSelect={handleSelect} />
                )}
              />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  // Dropdown button + modal
  return (
    <View style={styles.dropdownContainer}>
      <TouchableOpacity
        style={styles.button}
        onPress={toggleModal}
      >
        <Text style={styles.buttonText}>
          {selectedTheme || 'Select Theme'}
        </Text>
        <Ionicons
          name={isModalVisible ? "chevron-up" : "chevron-down"}
          size={16}
          color="#333"
        />
      </TouchableOpacity>

      {renderDropdown()}
    </View>
  );
};

// SectionContent: Dynamically renders settings content based on the selected section
const SectionContent = ({ activeSection, state, handlers }: {
  activeSection: string;
  state: any;
  handlers: any;
}) => {
  const { firstName, lastName, msg, notificationsEnabled, feedbackText, selectedThemeLabel, isThemeDropdownVisible } = state;
  const { setFirstName, setLastName, handleUpdate, handleDelete, handleLogout, setNotificationsEnabled, setFeedbackText, handleSendFeedback, setSelectedTheme, toggleThemeDropdown, handleNotificationToggle, sendTestNotification } = handlers;

  // Rewards-specific state (safe for all sections; only used when activeSection === 'rewards')
  const [currentPoints, setCurrentPoints] = useState<number>(0);
  const [weeklyTotals, setWeeklyTotals] = useState<number[]>([]);
  const [weeklyLabels, setWeeklyLabels] = useState<string[]>([]);

  useEffect(() => {
    const pointsService = PointsService.getInstance();
    // Initialize with current cached points
    setCurrentPoints(pointsService.getCurrentPoints());

    // Subscribe to live changes
    const unsubscribe = pointsService.subscribe((points: number) => {
      setCurrentPoints(points);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Load last 7 days of points history when Rewards is opened
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const pointsService = PointsService.getInstance();
        const history = await pointsService.getPointsHistory(100);

        // Prepare last 7 days (oldest -> newest)
        const dayTotals: number[] = [];
        const dayLabels: string[] = [];
        const now = new Date();

        for (let i = 6; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(now.getDate() - i);
          const key = d.toDateString();
          const label = d.toLocaleDateString(undefined, { weekday: 'short' }); // Mon, Tue, ...

          const totalForDay = history
            .filter(tx => new Date(tx.timestamp).toDateString() === key)
            .reduce((sum, tx) => sum + tx.points, 0);

          dayTotals.push(totalForDay);
          dayLabels.push(label);
        }

        setWeeklyTotals(dayTotals);
        setWeeklyLabels(dayLabels);
      } catch (error) {
        console.error('Error loading points history:', error);
      }
    };

    if (activeSection === 'rewards') {
      loadHistory();
    }
  }, [activeSection]);

  const milestoneSize = 1000;
  const progressWithinMilestone = Math.min(currentPoints % milestoneSize, milestoneSize);
  const progressRatio = milestoneSize === 0 ? 0 : progressWithinMilestone / milestoneSize;
  const nextMilestone = Math.max(milestoneSize, Math.ceil((currentPoints + 1) / milestoneSize) * milestoneSize);

  // Handle which section is active and render appropriate content
  switch (activeSection) {
    // ================= ACCOUNT SECTION =================
    case 'account':
      return (
        <View style={styles.sectionContent}>
          {/* Input for first name */}
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

          {/* Input for last name */}
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

          {/* Update info button */}
          <TouchableOpacity style={styles.updateBtn} onPress={handleUpdate}>
            <Ionicons name="save-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.updateBtnTxt}>Update Info</Text>
          </TouchableOpacity>

          {/* Delete account button */}
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={18} color="#fff" style={{ marginRight: 7 }} />
            <Text style={styles.deleteBtnTxt}>Delete Account</Text>
          </TouchableOpacity>

          {/* Feedback or success message after actions */}
          {msg ? <Text style={styles.msg}>{msg}</Text> : null}

          {/* Logout button */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="exit-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.logoutBtnTxt}>Logout</Text>
          </TouchableOpacity>
        </View>
      );

    // ================= GENERAL SETTINGS SECTION =================
    case 'general':
      return (
        <View style={styles.sectionContent}>
          {/* Notifications toggle */}
          <View style={[styles.field, { marginTop: 15 }]}>
            <View style={styles.row}>
              <Text style={styles.label}>Notifications</Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationToggle || (() => console.warn('handleNotificationToggle not available'))}
                trackColor={{ false: '#888', true: '#1DB954' }}
              />
            </View>
          </View>

          {/* Theme selection dropdown */}
          <View style={[styles.field, { marginTop: 15 }]}>
            <Text style={styles.label}>App Theme</Text>
            <CustomDropdown
              selectedTheme={selectedThemeLabel}
              onSelect={setSelectedTheme}
              isModalVisible={isThemeDropdownVisible}
              toggleModal={toggleThemeDropdown}
            />
          </View>
        </View>
      );

    // ================= ABOUT SECTION =================
    case 'about':
      return (
        <View style={styles.sectionContent}>
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              <Text style={styles.bold}>Tune Space</Text> — Crafted with <Text style={styles.heart}>♥</Text> by Aryan Bhanot{"\n"}
              Version 1.0.0{"\n"}
              <Text style={styles.meta}>© 2025 Arydew. All rights reserved.</Text>
            </Text>
          </View>
        </View>
      );

    // ================= FEEDBACK SECTION =================
    case 'feedback':
      return (
        <View style={styles.sectionContent}>
          {/* Feedback input box */}
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

          {/* Send feedback button */}
          <TouchableOpacity style={styles.updateBtn} onPress={handleSendFeedback}>
            <Ionicons name="send-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.updateBtnTxt}>Send Feedback</Text>
          </TouchableOpacity>
        </View>
      );

    // ================= REWARDS SECTION =================
    case 'rewards':
      return (
        <View style={styles.sectionContent}>
          {/* Points Display */}
          <View style={styles.pointsSection}>
            <Text style={styles.label}>Your Points</Text>
            <Text style={styles.pointsSubtitle}>
              Keep listening to unlock more rewards!
            </Text>
            <View style={styles.pointsDisplayContainer}>
              <PointsDisplay size="large" showLabel={true} />
            </View>

            {/* Progress toward next milestone */}
            <View style={styles.pointsProgressWrapper}>
              <View style={styles.pointsProgressTrack}>
                <View
                  style={[
                    styles.pointsProgressFill,
                    { width: `${Math.max(5, progressRatio * 100)}%` }, // ensure a minimal visible bar
                  ]}
                />
              </View>
              <Text style={styles.pointsProgressLabel}>
                Next reward at {nextMilestone.toLocaleString()} pts
              </Text>
            </View>
          </View>

          {/* Weekly Points History */}
          <View style={styles.historySection}>
            <Text style={styles.label}>Last 7 Days</Text>
            <View style={styles.historyChart}>
              {weeklyTotals.map((total, index) => {
                const max = Math.max(...weeklyTotals, 1);
                const heightPercent = max === 0 ? 0 : (total / max) * 100;
                return (
                  <View key={index} style={styles.historyBarWrapper}>
                    <View style={styles.historyBarTrack}>
                      <View
                        style={[
                          styles.historyBarFill,
                          { height: `${Math.max(8, heightPercent)}%` }, // keep a small visible bar
                        ]}
                      />
                    </View>
                    <Text style={styles.historyBarLabel}>
                      {weeklyLabels[index] || ''}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Points Breakdown */}
          <View style={styles.field}>
            <Text style={styles.label}>How to Earn Points</Text>
            <View style={styles.pointsList}>
              <View style={styles.pointsItem}>
                <Ionicons name="camera-outline" size={20} color="#FFD700" />
                <Text style={styles.pointsItemText}>Detect Emotion</Text>
                <Text style={styles.pointsValue}>+{POINTS_VALUES.EMOTION_DETECTED} pts</Text>
              </View>
              <View style={styles.pointsItem}>
                <Ionicons name="play-circle-outline" size={20} color="#FFD700" />
                <Text style={styles.pointsItemText}>Play a Song</Text>
                <Text style={styles.pointsValue}>+{POINTS_VALUES.SONG_PLAYED} pts</Text>
              </View>
              <View style={styles.pointsItem}>
                <Ionicons name="add-circle-outline" size={20} color="#FFD700" />
                <Text style={styles.pointsItemText}>Add to Playlist</Text>
                <Text style={styles.pointsValue}>+{POINTS_VALUES.SONG_ADDED_TO_PLAYLIST} pts</Text>
              </View>
              <View style={styles.pointsItem}>
                <Ionicons name="search-outline" size={20} color="#FFD700" />
                <Text style={styles.pointsItemText}>Search Music</Text>
                <Text style={styles.pointsValue}>+{POINTS_VALUES.SEARCH_PERFORMED} pts</Text>
              </View>
              <View style={styles.pointsItem}>
                <Ionicons name="calendar-outline" size={20} color="#FFD700" />
                <Text style={styles.pointsItemText}>Daily Login</Text>
                <Text style={styles.pointsValue}>+{POINTS_VALUES.DAILY_LOGIN} pts</Text>
              </View>
            </View>
          </View>
        </View>
      );


    // ================= DEFAULT CASE (if no section selected) =================
    default:
      return null;
  }
};

export default function SettingsPage() {
  // --- ROUTER PARAMS ---
  const { openSection } = useLocalSearchParams<{ openSection?: string }>();

  // --- THEME CONTEXT ---
  const { selectedTheme, setTheme } = useTheme();

  // --- NOTIFICATION CONTEXT ---
  const { sendNotification, getUserPreferences, updateUserPreferences, sendTestNotification } = useNotifications();

  // --- USE STATE ---
  const [userId, setUserId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState<any>(null);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [isThemeDropdownVisible, setThemeDropdownVisible] = useState(false);

  // --- ANIMATED VALUES ---
  const expandAnim = useRef(new Animated.Value(0)).current;
  const contentOpacityAnim = useRef(new Animated.Value(0)).current;
  const backButtonSlideAnim = useRef(new Animated.Value(-100)).current;

  // LOAD USER DATA ON ACCOUNT SECTION OPEN
  useEffect(() => {
    if (activeSection === 'account') {
      supabase.auth.getSession().then(({ data: { session } }) => {

        // If no session (not logged in), send user to homepage
        if (!session?.user?.id) {
          router.replace('/');
          return;
        }

        // Set user ID and fetch user profile from database
        setUserId(session.user.id);
        getUserById(session.user.id).then(user => {
          if (user) {
            setFirstName(user.first_name || '');
            setLastName(user.last_name || '');
            setEmail(user.email || '');
          }
        });
      });
    }
  }, [activeSection]);

  // LOAD POINTS ON REWARDS SECTION OPEN
  useEffect(() => {
    if (activeSection === 'rewards') {
      const loadPoints = async () => {
        try {
          const pointsService = PointsService.getInstance();
          await pointsService.refresh();
        } catch (error) {
          console.error('Error loading points:', error);
        }
      };
      loadPoints();
    }
  }, [activeSection]);

  // LOAD NOTIFICATION PREFERENCES ON GENERAL SECTION OPEN
  useEffect(() => {
    if (activeSection === 'general') {
      const loadNotificationPreferences = async () => {
        try {
          let preferences = null;

          // Try to get from Supabase first
          if (getUserPreferences) {
            preferences = await getUserPreferences();
          }

          // If Supabase fails, try local storage
          if (!preferences) {
            try {
              const AsyncStorage = require('@react-native-async-storage/async-storage').default;
              const localPrefs = await AsyncStorage.getItem('notification_preferences');
              if (localPrefs) {
                preferences = JSON.parse(localPrefs);
              }
            } catch (storageError) {
              console.warn('Failed to load from local storage:', storageError);
            }
          }

          if (preferences) {
            setNotificationPreferences(preferences);
            setNotificationsEnabled(preferences.system_enabled || false);
          } else {
            // Set default preferences
            setNotificationsEnabled(true);
          }
        } catch (error) {
          console.error('Error loading notification preferences:', error);
          // Set default preferences on error
          setNotificationsEnabled(true);
        }
      };
      loadNotificationPreferences();
    }
  }, [activeSection, getUserPreferences]);

  // SECTION OPEN ANIMATION
  const handleSectionOpen = (section: string) => {
    setActiveSection(section);
    backButtonSlideAnim.setValue(-100);
    Animated.sequence([
      // Animate open sequence
      Animated.timing(expandAnim, {
        toValue: 1,
        duration: 700,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
      // Fade in content + slide in back button in parallel
      Animated.parallel([
        Animated.timing(contentOpacityAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(backButtonSlideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  // SECTION CLOSE ANIMATION
  const handleSectionClose = () => {
    Animated.sequence([
      // Fade out content and slide out back button together
      Animated.parallel([
        Animated.timing(contentOpacityAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(backButtonSlideAnim, {
          toValue: -100,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      // Shrink section container back
      Animated.timing(expandAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Reset everything once animation finishes
      setActiveSection(null);
      contentOpacityAnim.setValue(0);
      backButtonSlideAnim.setValue(-100);
    });
  };

  // AUTO-OPEN SECTION WHEN NAVIGATED WITH PARAMETER
  useEffect(() => {
    if (openSection && !activeSection) {
      // Small delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        handleSectionOpen(openSection);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [openSection, activeSection]);

  // UPDATE ACCOUNT INFO
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

  // LOGOUT FUNCTION
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  // DELETE ACCOUNT FUNCTION
  const handleDelete = async () => {
    setMsg('');
    if (!userId) return;

    // Confirm deletion before proceeding
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

  // FEEDBACK HANDLER (TEMP)
  const handleSendFeedback = () => {
    Alert.alert('Feedback', 'Feedback submitted! (Placeholder)');
    setFeedbackText('');
  };

  // NOTIFICATION TOGGLE HANDLER
  const handleNotificationToggle = async (enabled: boolean) => {
    setNotificationsEnabled(enabled);

    // Check if notification functions are available
    if (!sendNotification) {
      console.warn('Notification functions not available');
      Alert.alert('Info', 'Notification service not available. Using local settings only.');
      return;
    }

    try {
      // Try to update preferences in Supabase if available
      if (updateUserPreferences) {
        const success = await updateUserPreferences({
          system_enabled: enabled,
          music_enabled: enabled,
          push_enabled: enabled,
        });

        if (!success) {
          console.warn('Failed to update Supabase preferences, using local storage');
        }
      }

      // Store preferences locally as fallback
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem('notification_preferences', JSON.stringify({
          system_enabled: enabled,
          music_enabled: enabled,
          push_enabled: enabled,
          updated_at: new Date().toISOString(),
        }));
      } catch (storageError) {
        console.warn('Failed to save to local storage:', storageError);
      }

      // Send a test notification if enabled
      if (enabled) {
        await sendNotification(
          'Notifications Enabled',
          'You will now receive notifications from Emotify!',
          { type: 'system' },
          'system'
        );
      }

    } catch (error) {
      console.error('Error updating notification preferences:', error);
      setNotificationsEnabled(!enabled);
      Alert.alert('Error', 'Failed to update notification preferences');
    }
  };

  // THEME DROPDOWN HANDLER
  const toggleThemeDropdown = () => setThemeDropdownVisible(prev => !prev);

  // THEME LABEL HANDLER
  const getSelectedThemeLabel = (themeValue: string) => {
    const theme = themeOptions.find(option => option.value === themeValue);
    return theme ? theme.label : 'Select Theme';
  };

  // COMBINE STATE & HANDLERS FOR CLEAN PROP PASSING
  const stateProps = {
    firstName, lastName, email, msg, notificationsEnabled, darkModeEnabled, feedbackText,
    selectedThemeLabel: getSelectedThemeLabel(selectedTheme),
    isThemeDropdownVisible
  };
  const handlerProps = {
    setFirstName, setLastName, setEmail, handleUpdate, handleDelete, handleLogout,
    setNotificationsEnabled, setDarkModeEnabled, setFeedbackText, handleSendFeedback,
    setSelectedTheme: setTheme,
    toggleThemeDropdown,
    handleNotificationToggle,
    sendTestNotification
  };

  return (
    <View style={styles.container}>

      {/* === Background Video Layer === */}
      <VideoBackground />

      {/* === Main Settings Screen Content (before expanding) === */}
      <Animated.View style={[
        styles.mainContent,
        {
          // Fade + scale out animation when a section is opened
          opacity: expandAnim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [1, 0.3, 0],
          }),
          transform: [
            {
              scale: expandAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0.9],
              }),
            },
          ],
        },
      ]}>

        {/* Header / Title */}
        <View style={styles.top}>
          <Text style={styles.title}>Settings</Text>
        </View>
        <View style={styles.card}>

          {/* Each tab button opens its corresponding section */}
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
          <AnimatedTabButton
            title="Rewards"
            iconName="star-outline"
            onPress={() => handleSectionOpen('rewards')}
          />
        </View>
      </Animated.View>

      {/* === Expanding Overlay (shown when a section is opened) === */}
      <Animated.View
        pointerEvents={activeSection ? 'auto' : 'none'}
        style={[
          styles.expandingOverlay,
          {
            transform: [{ scale: expandAnim }],
            opacity: expandAnim.interpolate({
              inputRange: [0, 0.1, 1],
              outputRange: [0, 1, 1],
              extrapolate: 'clamp',
            }),
          },
        ]}
      >

        {/* Background video continues underneath expanded content */}
        <VideoBackground />

        {/* Expanded content wrapper (holds section content + back button) */}
        <Animated.View style={[styles.expandedContentWrapper, { opacity: contentOpacityAnim }]}>

          {/* Top row: Back button + current section title */}
          <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'center' }}>

            {/* Back button slides in from top using animation */}
            <Animated.View style={[styles.backBtnContainer, { transform: [{ translateY: backButtonSlideAnim }] }]}>
              <TouchableOpacity style={styles.backBtn} onPress={handleSectionClose}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Section title (e.g., "Account", "General") */}
            <Text style={styles.sectionTitle}>{activeSection?.charAt(0).toUpperCase()}{activeSection?.slice(1)}</Text>
          </View>

          {/* Render section-specific content when active */}
          {activeSection && (
            <View style={styles.sectionCard}>
              <SectionContent activeSection={activeSection} state={stateProps} handlers={handlerProps} />
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
  },
  backgroundVideo: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -2,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17, 22, 26, 0.6)',
    zIndex: -1,
  },
  mainContent: {
    width: '100%',
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
  },
  top: {
    width: '100%',
    paddingTop: 30,
    marginLeft: 30,
    marginBottom: 20,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  card: {
    width: '93%',
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
  expandingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#121212',
    zIndex: 10,
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  expandedContentWrapper: {
    flex: 1,
    width: '100%',
    gap: 20,
  },
  sectionCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ffffff3b',
    padding: 15,
  },
  sectionContent: {
    width: '100%',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: '#ffffff3b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    marginHorizontal: 'auto',
  },
  backBtnContainer: {
    zIndex: 20,
    left: 0,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: '#ffffff3b',
    padding: 10,
    borderRadius: 10,
    width: 90,
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
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  buttonText: {
    fontSize: 16,
    color: '#333',
  },
  arrowIcon: {
    fontSize: 12,
    color: '#333',
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContainer: {
    zIndex: 1,
    width: '100%',
  },
  dropdownContent: {
    width: '80%', 
    maxHeight: 200, 
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  option: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
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
  infoContainer: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
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
  pointsSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  pointsDisplayContainer: {
    marginTop: 12,
  },
  pointsList: {
    marginTop: 12,
    gap: 12,
  },
  pointsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  pointsItemText: {
    flex: 1,
    color: '#e3ffdd',
    fontSize: 16,
    marginLeft: 12,
  },
  pointsValue: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pointsSubtitle: {
    marginTop: 4,
    color: '#e3ffdd',
    fontSize: 13,
    opacity: 0.8,
  },
  pointsProgressWrapper: {
    width: '100%',
    marginTop: 18,
    paddingHorizontal: 4,
  },
  pointsProgressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
  },
  pointsProgressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#FFD700',
  },
  pointsProgressLabel: {
    marginTop: 6,
    color: '#b4b4b4',
    fontSize: 13,
  },
  historySection: {
    marginTop: 28,
  },
  historyChart: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  historyBarWrapper: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  historyBarTrack: {
    width: 10,
    height: 60,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  historyBarFill: {
    width: '100%',
    borderRadius: 999,
    backgroundColor: '#1DB954',
  },
  historyBarLabel: {
    marginTop: 4,
    fontSize: 11,
    color: '#b4b4b4',
  },
});

// for notifying, The whole design is inspired by Aryan Bhanot's earlier work on the Tune Space music app.
// Here is the link to the original repository:

// https://github.com/aryanbhanot05/Tune_Space/blob/master/app/Settings.tsx

// Thank You for reviewing my code!