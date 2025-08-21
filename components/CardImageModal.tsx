
import React from 'react';
import { Modal, View, Image, TouchableOpacity, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import Icon from './Icon';
import { colors } from '../styles/commonStyles';

interface CardImageModalProps {
  visible: boolean;
  onClose: () => void;
  imagePath: string | null;
  cardName: string;
  loading?: boolean;
  deckInfo?: { currentDeck: string | null; otherDecks: string[] };
}

const CardImageModal: React.FC<CardImageModalProps> = ({
  visible,
  onClose,
  imagePath,
  cardName,
  loading = false,
  deckInfo,
}) => {
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const imageSize = Math.min(screenWidth * 0.8, screenHeight * 0.6);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { maxWidth: screenWidth * 0.9, maxHeight: screenHeight * 0.9 }]}>
          <View style={styles.header}>
            <Text style={styles.cardName} numberOfLines={2}>
              {cardName}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.imageContainer}>
              {loading ? (
                <View style={[styles.loadingContainer, { width: imageSize, height: imageSize * 1.4 }]}>
                  <Text style={styles.loadingText}>Loading image...</Text>
                </View>
              ) : imagePath ? (
                <Image
                  source={{ uri: imagePath }}
                  style={[styles.cardImage, { width: imageSize, height: imageSize * 1.4 }]}
                  resizeMode="contain"
                />
              ) : (
                <View style={[styles.noImageContainer, { width: imageSize, height: imageSize * 1.4 }]}>
                  <Icon name="image-outline" size={48} color={colors.textSecondary} />
                  <Text style={styles.noImageText}>No image available</Text>
                </View>
              )}
            </View>

            {/* NEW: Display deck information */}
            {deckInfo && (
              <View style={styles.deckInfoContainer}>
                <Text style={styles.deckInfoTitle}>Deck Information</Text>
                
                {deckInfo.currentDeck && (
                  <View style={styles.deckInfoItem}>
                    <Text style={styles.deckInfoLabel}>Currently in:</Text>
                    <Text style={[styles.deckInfoValue, { color: colors.success, fontWeight: '600' }]}>
                      {deckInfo.currentDeck}
                    </Text>
                  </View>
                )}
                
                {deckInfo.otherDecks.length > 0 && (
                  <View style={styles.deckInfoItem}>
                    <Text style={styles.deckInfoLabel}>Also needed by:</Text>
                    {deckInfo.otherDecks.map((deckName, index) => (
                      <Text key={index} style={[styles.deckInfoValue, { color: colors.warning }]}>
                        • {deckName}
                      </Text>
                    ))}
                  </View>
                )}
                
                {!deckInfo.currentDeck && deckInfo.otherDecks.length === 0 && (
                  <Text style={[styles.deckInfoValue, { color: colors.textSecondary, fontStyle: 'italic' }]}>
                    This card is not in any deck
                  </Text>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: colors.background,
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.backgroundAlt,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: 12,
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
  cardImage: {
    borderRadius: 12,
    backgroundColor: colors.backgroundAlt,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 8,
  },
  noImageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
  },
  noImageText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 8,
  },
  deckInfoContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.backgroundAlt,
  },
  deckInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  deckInfoItem: {
    marginBottom: 8,
  },
  deckInfoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  deckInfoValue: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
  },
});

export default CardImageModal;
