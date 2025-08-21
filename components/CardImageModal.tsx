
import Icon from './Icon';
import { Modal, View, Image, TouchableOpacity, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import React from 'react';
import { useTheme } from '../hooks/useTheme';

interface CardImageModalProps {
  visible: boolean;
  onClose: () => void;
  imagePath: string | null;
  cardName: string;
  loading?: boolean;
  deckInfo?: { currentDeck: string | null; otherDecks: string[] };
}

export default function CardImageModal({ visible, onClose, imagePath, cardName, loading, deckInfo }: CardImageModalProps) {
  const { colors } = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      width: screenWidth * 0.9,
      maxHeight: screenHeight * 0.8,
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
      marginRight: 16,
    },
    closeButton: {
      padding: 4,
    },
    content: {
      flex: 1,
    },
    imageContainer: {
      alignItems: 'center',
      padding: 16,
    },
    image: {
      width: screenWidth * 0.7,
      height: screenWidth * 0.7 * 1.4, // Magic card aspect ratio
      borderRadius: 8,
    },
    loadingText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      padding: 40,
    },
    noImageText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      padding: 40,
    },
    deckInfo: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    deckInfoTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    currentDeck: {
      fontSize: 14,
      color: colors.success,
      marginBottom: 4,
    },
    otherDeck: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 2,
    },
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={2}>
              {cardName}
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.imageContainer}>
              {loading ? (
                <Text style={styles.loadingText}>Loading image...</Text>
              ) : imagePath ? (
                <Image source={{ uri: imagePath }} style={styles.image} resizeMode="contain" />
              ) : (
                <Text style={styles.noImageText}>No image available</Text>
              )}
            </View>
            
            {deckInfo && (deckInfo.currentDeck || deckInfo.otherDecks.length > 0) && (
              <View style={styles.deckInfo}>
                <Text style={styles.deckInfoTitle}>Deck Information</Text>
                
                {deckInfo.currentDeck && (
                  <Text style={styles.currentDeck}>
                    Currently in: {deckInfo.currentDeck}
                  </Text>
                )}
                
                {deckInfo.otherDecks.length > 0 && (
                  <>
                    <Text style={[styles.deckInfoTitle, { fontSize: 14, marginTop: 8, marginBottom: 4 }]}>
                      Also needed in:
                    </Text>
                    {deckInfo.otherDecks.map((deckName, index) => (
                      <Text key={index} style={styles.otherDeck}>
                        • {deckName}
                      </Text>
                    ))}
                  </>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
