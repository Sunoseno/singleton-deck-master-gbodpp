
import React from 'react';
import { Modal, View, Image, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import Icon from './Icon';
import { colors } from '../styles/commonStyles';

interface CardImageModalProps {
  visible: boolean;
  onClose: () => void;
  imagePath: string | null;
  cardName: string;
  loading?: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const CardImageModal: React.FC<CardImageModalProps> = ({
  visible,
  onClose,
  imagePath,
  cardName,
  loading = false,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.closeArea} onPress={onClose} />
        
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.cardName} numberOfLines={2}>
              {cardName}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.imageContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading image...</Text>
              </View>
            ) : imagePath ? (
              <Image
                source={{ uri: imagePath }}
                style={styles.cardImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.noImageContainer}>
                <Icon name="image-outline" size={48} color={colors.textSecondary} />
                <Text style={styles.noImageText}>Image not available</Text>
              </View>
            )}
          </View>
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
  },
  closeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    backgroundColor: colors.background,
    borderRadius: 12,
    maxWidth: screenWidth * 0.9,
    maxHeight: screenHeight * 0.8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cardName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginRight: 12,
  },
  closeButton: {
    padding: 4,
  },
  imageContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  cardImage: {
    width: 250,
    height: 350,
    borderRadius: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  noImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  noImageText: {
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: 8,
  },
});

export default CardImageModal;
