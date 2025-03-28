import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';
import { Camera } from 'expo-camera';
import * as Permissions from 'expo-permissions';

interface VideoConsultationScreenProps {
  navigation: any;
  route: any;
}

const { width, height } = Dimensions.get('window');

const VideoConsultationScreen: React.FC<VideoConsultationScreenProps> = ({ navigation, route }) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCallConnected, setIsCallConnected] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Expert info - could come from route params in a real app
  const expert = {
    name: 'Dr. Sarah Johnson',
    specialty: 'Cardiologist',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80',
  };

  useEffect(() => {
    (async () => {
      if (Platform.OS === 'web') {
        setHasPermission(true);
        return;
      }

      const { status } = await Camera.requestCameraPermissionsAsync();
      const audioStatus = await Camera.requestMicrophonePermissionsAsync();
      setHasPermission(status === 'granted' && audioStatus.status === 'granted');

      if (status !== 'granted' || audioStatus.status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera and microphone access is needed for video consultations',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    })();
  }, [navigation]);

  useEffect(() => {
    // Simulate connecting to call
    const connectTimer = setTimeout(() => {
      setIsCallConnected(true);
    }, 2000);

    // Set up call duration timer
    let durationTimer: NodeJS.Timeout;
    if (isCallConnected) {
      durationTimer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }

    return () => {
      clearTimeout(connectTimer);
      if (durationTimer) clearInterval(durationTimer);
    };
  }, [isCallConnected]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    Alert.alert(
      'End Consultation',
      'Are you sure you want to end this consultation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Call',
          style: 'destructive',
          onPress: () => navigation.goBack()
        }
      ]
    );
  };

  const toggleCamera = () => {
    setIsFrontCamera(!isFrontCamera);
  };

  const toggleAudio = () => {
    setIsAudioMuted(!isAudioMuted);
  };

  const toggleVideo = () => {
    setIsVideoDisabled(!isVideoDisabled);
  };

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <Text>Requesting camera and microphone permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Text>No access to camera or microphone</Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.permissionButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Connection status */}
      {!isCallConnected && (
        <View style={styles.connectingOverlay}>
          <View style={styles.connectingContent}>
            <View style={styles.loadingIndicator}>
              <View style={styles.loadingDot} />
              <View style={[styles.loadingDot, { animationDelay: '0.5s' }]} />
              <View style={[styles.loadingDot, { animationDelay: '1s' }]} />
            </View>
            <Text style={styles.connectingText}>Connecting to Dr. Sarah Johnson...</Text>
          </View>
        </View>
      )}

      {/* Main video area */}
      <View style={styles.videoContainer}>
        {/* Doctor's video (simulated) */}
        {!isVideoDisabled ? (
          <Image
            source={{ uri: expert.image }}
            style={styles.mainVideo}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.videoDisabledContainer}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>SJ</Text>
            </View>
            <Text style={styles.videoDisabledText}>Video Paused</Text>
          </View>
        )}

        {/* Self view (small picture-in-picture) */}
        <View style={styles.selfViewContainer}>
          {/* In a real app, this would be your camera view */}
          <View style={[
            styles.selfView,
            isVideoDisabled && styles.selfViewDisabled
          ]}>
            {!isVideoDisabled ? (
              <Camera
                style={styles.camera}
                type={isFrontCamera ? Camera.Constants.Type.front : Camera.Constants.Type.back}
                ratio="16:9"
              />
            ) : (
              <View style={styles.selfViewDisabledContent}>
                <Text style={styles.selfViewText}>You</Text>
              </View>
            )}
          </View>
        </View>

        {/* Call info overlay */}
        <View style={styles.callInfoOverlay}>
          <View style={styles.expertInfo}>
            <Text style={styles.expertName}>{expert.name}</Text>
            <Text style={styles.expertSpecialty}>{expert.specialty}</Text>
          </View>
          <View style={styles.callDuration}>
            <Icon name="time-outline" size={14} color="#fff" />
            <Text style={styles.durationText}>{formatDuration(callDuration)}</Text>
          </View>
        </View>
      </View>

      {/* Bottom control bar */}
      <View style={styles.controlBar}>
        <TouchableOpacity
          style={[styles.controlButton, isAudioMuted && styles.controlButtonActive]}
          onPress={toggleAudio}
        >
          <Icon
            name={isAudioMuted ? "mic-off" : "mic"}
            size={24}
            color="#fff"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, isVideoDisabled && styles.controlButtonActive]}
          onPress={toggleVideo}
        >
          <Icon
            name={isVideoDisabled ? "videocam-off" : "videocam"}
            size={24}
            color="#fff"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.endCallButton}
          onPress={handleEndCall}
        >
          <Icon name="call" size={24} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={toggleCamera}
        >
          <Icon name="camera-reverse" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, isChatOpen && styles.controlButtonActive]}
          onPress={toggleChat}
        >
          <Icon name="chatbubble-ellipses" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Chat panel (simplified) */}
      {isChatOpen && (
        <View style={styles.chatPanel}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatTitle}>In-call Messages</Text>
            <TouchableOpacity onPress={toggleChat}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <View style={styles.chatBody}>
            <View style={styles.chatMessage}>
              <Text style={styles.messageText}>Hello, how are you feeling today?</Text>
              <Text style={styles.messageTime}>2:32 PM</Text>
            </View>
            <View style={[styles.chatMessage, styles.myMessage]}>
              <Text style={styles.messageText}>I've been having some chest pain when I exercise.</Text>
              <Text style={styles.messageTime}>2:33 PM</Text>
            </View>
            <View style={styles.chatMessage}>
              <Text style={styles.messageText}>I'll help you with that. Can you describe when it typically occurs?</Text>
              <Text style={styles.messageTime}>2:34 PM</Text>
            </View>
          </View>
          <View style={styles.chatInputContainer}>
            <View style={styles.chatInput}>
              <Text style={styles.chatInputPlaceholder}>Type a message...</Text>
            </View>
            <TouchableOpacity style={styles.sendButton}>
              <Icon name="send" size={20} color="#4a6ee0" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  permissionButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#4a6ee0',
    borderRadius: 8,
  },
  permissionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  connectingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  connectingContent: {
    alignItems: 'center',
  },
  loadingIndicator: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  loadingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4a6ee0',
    margin: 3,
    opacity: 0.6,
  },
  connectingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#222',
    position: 'relative',
  },
  mainVideo: {
    width: '100%',
    height: '100%',
  },
  videoDisabledContainer: {
    flex: 1,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#4a6ee0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: 'white',
    fontSize: 48,
    fontWeight: 'bold',
  },
  videoDisabledText: {
    color: 'white',
    fontSize: 16,
  },
  selfViewContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 100,
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'white',
  },
  selfView: {
    width: '100%',
    height: '100%',
    backgroundColor: '#555',
  },
  camera: {
    flex: 1,
  },
  selfViewDisabled: {
    backgroundColor: '#333',
  },
  selfViewDisabledContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selfViewText: {
    color: 'white',
    fontSize: 14,
  },
  callInfoOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: width - 140, // Accounting for selfView width
  },
  expertInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  expertName: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  expertSpecialty: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  callDuration: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationText: {
    color: 'white',
    marginLeft: 5,
    fontSize: 14,
  },
  controlBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#000',
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonActive: {
    backgroundColor: '#d32f2f',
  },
  endCallButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#d32f2f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatPanel: {
    position: 'absolute',
    bottom: 90,
    left: 10,
    right: 10,
    height: 300,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  chatTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  chatBody: {
    flex: 1,
    padding: 12,
  },
  chatMessage: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#e1f5fe',
  },
  messageText: {
    fontSize: 14,
  },
  messageTime: {
    fontSize: 10,
    color: '#999',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  chatInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 15,
    justifyContent: 'center',
    marginRight: 10,
  },
  chatInputPlaceholder: {
    color: '#999',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default VideoConsultationScreen;
