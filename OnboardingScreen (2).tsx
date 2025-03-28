import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Animated,
  Image,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

interface OnboardingScreenProps {
  navigation: any;
}

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  image: string;
  bgColor: string;
  icon: string;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const onboardingSlides: OnboardingSlide[] = [
    {
      id: '1',
      title: 'Find Expert Healthcare',
      description: 'Connect with specialists across multiple fields for personalized consultations.',
      image: 'https://source.unsplash.com/random/800x800/?doctor',
      bgColor: '#4a6ee0',
      icon: 'medkit',
    },
    {
      id: '2',
      title: 'Virtual Consultations',
      description: 'Experience high-quality video consultations from the comfort of your home.',
      image: 'https://source.unsplash.com/random/800x800/?videocall',
      bgColor: '#10b981',
      icon: 'videocam',
    },
    {
      id: '3',
      title: 'Appointment Management',
      description: 'Schedule, reschedule, or cancel appointments with just a few taps.',
      image: 'https://source.unsplash.com/random/800x800/?calendar',
      bgColor: '#f59e0b',
      icon: 'calendar',
    },
    {
      id: '4',
      title: 'Track Your Health',
      description: 'Monitor your health metrics and share with your healthcare providers.',
      image: 'https://source.unsplash.com/random/800x800/?health',
      bgColor: '#ef4444',
      icon: 'pulse',
    },
  ];

  const renderItem = ({ item, index }: { item: OnboardingSlide; index: number }) => {
    return (
      <View style={[styles.slide, { backgroundColor: item.bgColor }]}>
        <View style={styles.iconContainer}>
          <Icon name={item.icon} size={60} color="white" />
        </View>

        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.image }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </View>
    );
  };

  const goToNextSlide = () => {
    if (currentIndex < onboardingSlides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      // Go to login screen
      navigation.navigate('LoginScreen');
    }
  };

  const goToSkip = () => {
    navigation.navigate('LoginScreen');
  };

  const handleViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems[0]) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={onboardingSlides[currentIndex]?.bgColor || '#4a6ee0'}
      />

      <TouchableOpacity style={styles.skipButton} onPress={goToSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={onboardingSlides}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={32}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      <View style={styles.pagination}>
        {onboardingSlides.map((_, i) => {
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
              key={i}
              style={[styles.dot, { width: dotWidth, opacity }]}
            />
          );
        })}
      </View>

      <TouchableOpacity style={styles.nextButton} onPress={goToNextSlide}>
        <Text style={styles.nextButtonText}>
          {currentIndex === onboardingSlides.length - 1 ? 'Get Started' : 'Next'}
        </Text>
        <Icon
          name={currentIndex === onboardingSlides.length - 1 ? 'checkmark' : 'arrow-forward'}
          size={20}
          color="white"
          style={styles.nextButtonIcon}
        />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  slide: {
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  imageContainer: {
    width: width * 0.8,
    height: height * 0.4,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'white',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 24,
    maxWidth: width * 0.8,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
    position: 'absolute',
    bottom: 100,
    width: '100%',
  },
  dot: {
    height: 10,
    borderRadius: 5,
    backgroundColor: 'white',
    marginHorizontal: 5,
  },
  nextButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nextButtonIcon: {
    marginLeft: 5,
  },
  skipButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  skipText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default OnboardingScreen;
