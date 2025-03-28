import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  StatusBar,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface HomeScreenProps {
  navigation: any;
}

interface Expert {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviews: number;
  image: string;
  available: boolean;
}

interface Article {
  id: string;
  title: string;
  category: string;
  readTime: string;
  image: string;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for featured experts
  const featuredExperts: Expert[] = [
    {
      id: '1',
      name: 'Dr. Sarah Johnson',
      specialty: 'Cardiologist',
      rating: 4.9,
      reviews: 87,
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80',
      available: true,
    },
    {
      id: '2',
      name: 'Dr. Michael Chen',
      specialty: 'Neurologist',
      rating: 4.8,
      reviews: 72,
      image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80',
      available: true,
    },
    {
      id: '3',
      name: 'Dr. Lisa Patel',
      specialty: 'Dermatologist',
      rating: 4.7,
      reviews: 64,
      image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80',
      available: false,
    },
  ];

  // Mock data for health articles
  const healthArticles: Article[] = [
    {
      id: '1',
      title: 'Understanding Heart Health: Signs to Watch For',
      category: 'Heart Health',
      readTime: '5 min read',
      image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80',
    },
    {
      id: '2',
      title: 'The Importance of Regular Check-ups',
      category: 'Preventive Care',
      readTime: '3 min read',
      image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80',
    },
    {
      id: '3',
      title: 'Stress Management Techniques for Busy Professionals',
      category: 'Mental Health',
      readTime: '4 min read',
      image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80',
    },
  ];

  // Mock function for pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    // Simulate an API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  const renderExpertCard = ({ item }: { item: Expert }) => (
    <TouchableOpacity style={styles.expertCard}>
      <View style={styles.expertImageContainer}>
        <Image source={{ uri: item.image }} style={styles.expertImage} />
        {item.available && (
          <View style={styles.availableBadge}>
            <Text style={styles.availableBadgeText}>Available Now</Text>
          </View>
        )}
      </View>
      <View style={styles.expertInfo}>
        <Text style={styles.expertName}>{item.name}</Text>
        <Text style={styles.expertSpecialty}>{item.specialty}</Text>
        <View style={styles.expertRating}>
          <Icon name="star" size={16} color="#FFD700" />
          <Text style={styles.expertRatingText}>
            {item.rating.toFixed(1)} ({item.reviews})
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderArticleCard = ({ item }: { item: Article }) => (
    <TouchableOpacity style={styles.articleCard}>
      <Image source={{ uri: item.image }} style={styles.articleImage} />
      <View style={styles.articleContent}>
        <Text style={styles.articleTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.articleMeta}>
          <Text style={styles.articleCategory}>{item.category}</Text>
          <Text style={styles.articleReadTime}>{item.readTime}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeHeader}>
            <View>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.welcomeName}>Alex Johnson</Text>
            </View>
            <TouchableOpacity style={styles.notificationsButton}>
              <Icon name="notifications" size={24} color="#4a6ee0" />
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>3</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
            <Text style={styles.searchPlaceholder}>Search for experts, specialties...</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Appointments')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#E1F5FE' }]}>
              <Icon name="calendar" size={24} color="#039BE5" />
            </View>
            <Text style={styles.actionText}>Appointments</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('VideoConsultation')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
              <Icon name="videocam" size={24} color="#43A047" />
            </View>
            <Text style={styles.actionText}>Video Consult</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Chat')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FFF3E0' }]}>
              <Icon name="chatbubble-ellipses" size={24} color="#FF9800" />
            </View>
            <Text style={styles.actionText}>Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('HealthMetrics')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#F3E5F5' }]}>
              <Icon name="pulse" size={24} color="#8E24AA" />
            </View>
            <Text style={styles.actionText}>Health Data</Text>
          </TouchableOpacity>
        </View>

        {/* Upcoming Appointment */}
        <View style={styles.upcomingCard}>
          <View style={styles.upcomingHeader}>
            <Icon name="time" size={18} color="#4a6ee0" />
            <Text style={styles.upcomingTitle}>Upcoming Appointment</Text>
          </View>

          <View style={styles.appointmentContent}>
            <View style={styles.appointmentImageContainer}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2' }}
                style={styles.appointmentImage}
              />
            </View>

            <View style={styles.appointmentDetails}>
              <Text style={styles.appointmentDoctor}>Dr. Sarah Johnson</Text>
              <Text style={styles.appointmentSpecialty}>Cardiologist</Text>
              <View style={styles.appointmentTime}>
                <Icon name="calendar" size={14} color="#666" />
                <Text style={styles.appointmentTimeText}>Today, 2:00 PM</Text>
              </View>
            </View>

            <View style={styles.appointmentType}>
              <View style={styles.appointmentTypeIcon}>
                <Icon name="videocam" size={14} color="#43A047" />
              </View>
              <Text style={styles.appointmentTypeText}>Video</Text>
            </View>
          </View>

          <View style={styles.appointmentActions}>
            <TouchableOpacity style={[styles.appointmentButton, styles.rescheduleButton]}>
              <Text style={styles.rescheduleButtonText}>Reschedule</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.appointmentButton, styles.joinButton]}
              onPress={() => navigation.navigate('VideoConsultation')}
            >
              <Text style={styles.joinButtonText}>Join Now</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Featured Experts */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Experts</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={featuredExperts}
            renderItem={renderExpertCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.expertsList}
          />
        </View>

        {/* Health Articles */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Health Articles</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {healthArticles.map((article) => renderArticleCard({ item: article }))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  welcomeSection: {
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 10,
  },
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
  },
  welcomeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  notificationsButton: {
    position: 'relative',
    padding: 5,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF5252',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 10,
    padding: 12,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchPlaceholder: {
    color: '#999',
    fontSize: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: 'white',
    marginTop: 10,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  actionText: {
    fontSize: 12,
    color: '#666',
  },
  upcomingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    margin: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  upcomingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  upcomingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  appointmentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  appointmentImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    marginRight: 15,
  },
  appointmentImage: {
    width: '100%',
    height: '100%',
  },
  appointmentDetails: {
    flex: 1,
  },
  appointmentDoctor: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
  },
  appointmentSpecialty: {
    color: '#666',
    fontSize: 14,
    marginBottom: 5,
  },
  appointmentTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentTimeText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 5,
  },
  appointmentType: {
    alignItems: 'center',
  },
  appointmentTypeIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  appointmentTypeText: {
    fontSize: 12,
    color: '#666',
  },
  appointmentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  appointmentButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rescheduleButton: {
    borderWidth: 1,
    borderColor: '#DDD',
    marginRight: 10,
  },
  rescheduleButtonText: {
    color: '#666',
  },
  joinButton: {
    backgroundColor: '#4a6ee0',
  },
  joinButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  sectionContainer: {
    padding: 15,
    backgroundColor: 'white',
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    color: '#4a6ee0',
    fontSize: 14,
  },
  expertsList: {
    paddingRight: 15,
  },
  expertCard: {
    width: 150,
    marginRight: 15,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  expertImageContainer: {
    width: '100%',
    height: 120,
    position: 'relative',
  },
  expertImage: {
    width: '100%',
    height: '100%',
  },
  availableBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(67, 160, 71, 0.8)',
    paddingVertical: 4,
  },
  availableBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  expertInfo: {
    padding: 10,
  },
  expertName: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
    color: '#333',
  },
  expertSpecialty: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  expertRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expertRatingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  articleCard: {
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 15,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 2,
  },
  articleImage: {
    width: 100,
    height: 80,
  },
  articleContent: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  articleTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  articleMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  articleCategory: {
    color: '#4a6ee0',
    fontSize: 12,
  },
  articleReadTime: {
    color: '#999',
    fontSize: 12,
  },
});

export default HomeScreen;
