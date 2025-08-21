
import React, { useState } from 'react';
import { Text, View, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSettings } from '../hooks/useSettings';
import { useTheme } from '../hooks/useTheme';
import { SUPPORTED_LANGUAGES } from '../types/settings';
import { scryfallService } from '../services/scryfallService';
import Icon from '../components/Icon';

export default function SettingsScreen() {
  const { settings, loading, updateSettings } = useSettings();
  const { colors, styles } = useTheme();
  const [clearingCache, setClearingCache] = useState(false);

  if (loading || !settings) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.text}>Loading settings...</Text>
      </View>
    );
  }

  const handleLanguageChange = async (languageCode: 'en' | 'de' | 'fr' | 'it' | 'es') => {
    console.log('Changing language to:', languageCode);
    try {
      await updateSettings({ language: languageCode });
    } catch (error) {
      console.log('Error updating language:', error);
    }
  };

  const handleTranslateToggle = async (value: boolean) => {
    console.log('Toggling card name translation:', value);
    try {
      await updateSettings({ translateCardNames: value });
    } catch (error) {
      console.log('Error updating translation setting:', error);
    }
  };

  const handleDarkModeToggle = async (value: boolean) => {
    console.log('Toggling dark mode:', value);
    try {
      await updateSettings({ darkMode: value });
    } catch (error) {
      console.log('Error updating dark mode setting:', error);
    }
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'This will delete all downloaded card images. They will be re-downloaded when needed. Continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setClearingCache(true);
            try {
              await scryfallService.clearImageCache();
              Alert.alert('Success', 'Cache cleared successfully!');
              console.log('Cache cleared successfully');
            } catch (error) {
              console.log('Error clearing cache:', error);
              Alert.alert('Error', 'Failed to clear cache. Please try again.');
            } finally {
              setClearingCache(false);
            }
          },
        },
      ]
    );
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const [cacheInfo, setCacheInfo] = useState<{ fileCount: number; totalSize: number } | null>(null);

  React.useEffect(() => {
    const loadCacheInfo = async () => {
      try {
        const info = await scryfallService.getCacheSize();
        setCacheInfo(info);
      } catch (error) {
        console.log('Error loading cache info:', error);
      }
    };
    loadCacheInfo();
  }, [clearingCache]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.section, { paddingTop: 20 }]}>
        <View style={styles.row}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginRight: 16 }}
          >
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Settings</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20 }}>
        {/* Appearance */}
        <View style={[styles.card, { marginBottom: 20 }]}>
          <Text style={[styles.subtitle, { marginBottom: 16 }]}>Appearance</Text>
          
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.subtitle, { marginBottom: 4 }]}>
                Dark Mode
              </Text>
              <Text style={[styles.textSecondary, { fontSize: 14 }]}>
                Switch between light and dark theme
              </Text>
            </View>
            <Switch
              value={settings.darkMode}
              onValueChange={handleDarkModeToggle}
              trackColor={{ false: colors.border, true: colors.primary + '40' }}
              thumbColor={settings.darkMode ? colors.primary : colors.textSecondary}
            />
          </View>
        </View>

        {/* Language Selection */}
        <View style={[styles.card, { marginBottom: 20 }]}>
          <Text style={[styles.subtitle, { marginBottom: 16 }]}>Language</Text>
          
          {SUPPORTED_LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.row,
                {
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  marginBottom: 8,
                  backgroundColor: settings.language === lang.code ? colors.primary + '20' : colors.cardBackground,
                  borderRadius: 8,
                  borderWidth: settings.language === lang.code ? 2 : 1,
                  borderColor: settings.language === lang.code ? colors.primary : colors.border,
                }
              ]}
              onPress={() => handleLanguageChange(lang.code)}
            >
              <Text style={[
                styles.text,
                { 
                  flex: 1,
                  color: settings.language === lang.code ? colors.primary : colors.text 
                }
              ]}>
                {lang.name}
              </Text>
              {settings.language === lang.code && (
                <Icon name="checkmark-circle" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Card Name Translation */}
        <View style={[styles.card, { marginBottom: 20 }]}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.subtitle, { marginBottom: 4 }]}>
                Translate Card Names
              </Text>
              <Text style={[styles.textSecondary, { fontSize: 14 }]}>
                Show card names in selected language instead of English
              </Text>
            </View>
            <Switch
              value={settings.translateCardNames}
              onValueChange={handleTranslateToggle}
              trackColor={{ false: colors.border, true: colors.primary + '40' }}
              thumbColor={settings.translateCardNames ? colors.primary : colors.textSecondary}
            />
          </View>
        </View>

        {/* Cache Management */}
        <View style={[styles.card, { marginBottom: 20 }]}>
          <Text style={[styles.subtitle, { marginBottom: 16 }]}>Cache Management</Text>
          
          {cacheInfo && (
            <View style={{ marginBottom: 16 }}>
              <Text style={[styles.textSecondary, { fontSize: 14, marginBottom: 4 }]}>
                Cached Images: {cacheInfo.fileCount} files
              </Text>
              <Text style={[styles.textSecondary, { fontSize: 14 }]}>
                Cache Size: {formatBytes(cacheInfo.totalSize)}
              </Text>
            </View>
          )}
          
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: colors.error,
                opacity: clearingCache ? 0.6 : 1,
              }
            ]}
            onPress={handleClearCache}
            disabled={clearingCache}
          >
            <View style={styles.row}>
              <Icon 
                name={clearingCache ? "hourglass-outline" : "trash-outline"} 
                size={16} 
                color={colors.background} 
                style={{ marginRight: 8 }} 
              />
              <Text style={styles.buttonText}>
                {clearingCache ? 'Clearing...' : 'Clear Cache'}
              </Text>
            </View>
          </TouchableOpacity>
          
          <Text style={[styles.textSecondary, { fontSize: 12, marginTop: 8, textAlign: 'center' }]}>
            This will delete all downloaded card images from Scryfall
          </Text>
        </View>

        {/* Info Section */}
        <View style={[styles.card, { backgroundColor: colors.info + '20', borderColor: colors.info }]}>
          <View style={styles.row}>
            <Icon name="information-circle" size={20} color={colors.info} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.text, { fontSize: 14, lineHeight: 20 }]}>
                When card name translation is enabled, the app will fetch localized card names from the Scryfall API. 
                This may take longer to load and requires an internet connection.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
