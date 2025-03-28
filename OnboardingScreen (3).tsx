import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Animated,
  TouchableOpacity,
  Image,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { StackNavigationProp } from '@react-navigation/stack';

const { width, height } = Dimensions.get('window');

// Onboarding data
const slides = [
  {
    id: '1',
    title: 'Expert Consultations',
    description: 'Connect with healthcare professionals for personalized consultations from anywhere.',
    image: require('../../assets/onboarding-1.png'),
  },
  {
    id: '2',
    title: 'Video Appointments',
    description: 'Schedule and join video consultations with just a few taps.',
    image: require('../../assets/onboarding-2.png'),
  },
  {
    id: '3',
    title: 'Health Tracking',
    description: 'Monitor your health metrics and share them with your healthcare providers.',
    image: require('../../assets/onboarding-3.png'),
  },
  {
    id: '4',
    title: 'Secure Messaging',
    description: 'Communicate securely with your healthcare team anytime.',
    image: require('../../assets/onboarding-4.png'),
  },
];

type OnboardingScreenNavigationProp = StackNavigationProp<any, 'Onboarding'>;

interface OnboardingScreenProps {
  navigation: OnboardingScreenNavigationProp;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList>(null);

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    setCurrentIndex(viewableItems[0].index);
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollTo = () => {
    if (currentIndex < slides.length - 1) {
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      navigation.replace('Login');
    }
  };

  const skip = () => {
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.skipContainer}>
        <TouchableOpacity onPress={skip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 3 }}>
        <FlatList
          data={slides}
          renderItem={({ item }) => (
            <View style={styles.slide}>
              <Image source={item.image} style={styles.image} />
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          bounces={false}
          keyExtractor={(item) => item.id}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={32}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={viewConfig}
          ref={slidesRef}
        />
      </View>

      <View style={styles.footer}>
        <View style={styles.indicatorContainer}>
          {slides.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];

            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [10, 20, 10],
              extrapolate: 'clamp',
            });

            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                key={i.toString()}
                style={[styles.indicator, { width: dotWidth, opacity }]}
              />
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={scrollTo}
        >
          <Text style={styles.buttonText}>
            {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  skipContainer: {
    padding: 16,
    alignItems: 'flex-end',
  },
  skipText: {
    fontSize: 16,
    color: '#4a6ee0',
    fontWeight: '500',
  },
  slide: {
    width,
    height: height * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  image: {
    width: width * 0.8,
    height: height * 0.4,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  footer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4a6ee0',
    marginHorizontal: 5,
  },
  button: {
    backgroundColor: '#4a6ee0',
    padding: 16,
    borderRadius: 10,
    marginBottom: 30,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
});

export default OnboardingScreen;
