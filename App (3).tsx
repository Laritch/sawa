import React, { useState, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './app/navigation/AppNavigator';
import AuthNavigator from './app/navigation/AuthNavigator';
import { UserProvider } from './app/context/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Font from 'expo-font';
import { ActivityIndicator, View } from 'react-native';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

  // Load fonts and check if user is logged in
  useEffect(() => {
    async function prepare() {
      try {
        // Load fonts
        await Font.loadAsync({
          'Inter-Regular': require('./assets/fonts/Inter-Regular.ttf'),
          'Inter-Medium': require('./assets/fonts/Inter-Medium.ttf'),
          'Inter-Bold': require('./assets/fonts/Inter-Bold.ttf'),
        });

        // Check if user is logged in
        const token = await AsyncStorage.getItem('userToken');
        setUserToken(token);

        // Check if it's first launch
        const firstLaunch = await AsyncStorage.getItem('firstLaunch');
        setIsFirstLaunch(firstLaunch === null);

        if (firstLaunch === null) {
          // Set firstLaunch to false for future app launches
          await AsyncStorage.setItem('firstLaunch', 'false');
        }
      } catch (e) {
        console.warn('Error preparing app:', e);
      } finally {
        setIsReady(true);
      }
    }

    prepare();
  }, []);

  const login = async (token: string) => {
    try {
      await AsyncStorage.setItem('userToken', token);
      setUserToken(token);
    } catch (e) {
      console.error('Error storing auth token', e);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      setUserToken(null);
    } catch (e) {
      console.error('Error removing auth token', e);
    }
  };

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4a6ee0" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <UserProvider value={{
        userToken,
        isLoggedIn: !!userToken,
        login,
        logout
      }}>
        <NavigationContainer>
          {userToken ? (
            <AppNavigator />
          ) : (
            <AuthNavigator isFirstLaunch={!!isFirstLaunch} />
          )}
        </NavigationContainer>
      </UserProvider>
    </SafeAreaProvider>
  );
}
